import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { isWebPushConfigured, sendWebPushForUser } from './webPushService.mjs';

const router = express.Router();

router.post('/api/viewings', async (req, res) => {
  if (!supabaseAdmin) {
    return res
      .status(500)
      .json({ error: 'Viewing scheduling service not configured. Missing Supabase credentials.' });
  }

  const { property_id, user_id, date, time } = req.body ?? {};

  if (!property_id || !user_id || !date || !time) {
    return res.status(400).json({
      error: 'property_id, user_id, date, and time are all required fields.',
    });
  }

  const startDateTime = new Date(`${date}T${time}`);
  if (Number.isNaN(startDateTime.getTime())) {
    return res.status(400).json({ error: 'Invalid date or time format.' });
  }

  // Simple 1-hour slot window for conflict checks
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  try {
    // Prevent double booking: check for overlapping confirmed viewings for this property
    const { data: existing, error: conflictError } = await supabaseAdmin
      .from('property_viewings')
      .select('id, scheduled_at, status')
      .eq('property_id', property_id)
      .neq('status', 'CANCELLED')
      .gte('scheduled_at', startDateTime.toISOString())
      .lt('scheduled_at', endDateTime.toISOString());

    if (conflictError) {
      console.error('[viewings] Failed to check for conflicts', conflictError);
      return res.status(500).json({ error: 'Failed to validate viewing slot.' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: 'This time slot is already booked for this property.',
      });
    }

    // Create viewing appointment
    const { data: viewing, error: insertError } = await supabaseAdmin
      .from('property_viewings')
      .insert([
        {
          property_id,
          user_id,
          scheduled_at: startDateTime.toISOString(),
          status: 'PENDING',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[viewings] Failed to create viewing', insertError);
      return res.status(500).json({ error: 'Failed to create viewing appointment.' });
    }

    // Notify agent/property owner via notifications table
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('id, title, agent_id, owner_id')
      .eq('id', property_id)
      .maybeSingle();

    if (propertyError) {
      console.error('[viewings] Failed to load property for notification', propertyError);
    } else if (property) {
      const targetUserId = property.agent_id || property.owner_id;
      if (targetUserId) {
        const notificationTitle = 'New Property Viewing Request';
        const notificationDescription = `A user has requested a viewing for "${property.title}" on ${date} at ${time}.`;

        const viewLink = `/properties/${property.id}`;
        const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
          user_id: targetUserId,
          title: notificationTitle,
          description: notificationDescription,
          type: 'general',
          link: viewLink,
          metadata: {
            property_id: property.id,
            viewing_id: viewing.id,
            requested_date: date,
            requested_time: time,
          },
        });

        if (notificationError) {
          console.error('[viewings] Failed to create notification', notificationError);
        } else if (isWebPushConfigured()) {
          void sendWebPushForUser(targetUserId, {
            title: notificationTitle,
            body: notificationDescription,
            url: viewLink,
          });
        }
      }
    }

    return res.status(201).json({
      message: 'Viewing scheduled successfully.',
      viewing: {
        id: viewing.id,
        property_id: viewing.property_id,
        user_id: viewing.user_id,
        scheduled_at: viewing.scheduled_at,
        status: viewing.status,
      },
    });
  } catch (err) {
    console.error('[viewings] Unexpected error creating viewing', err);
    return res.status(500).json({ error: 'Unexpected error creating viewing appointment.' });
  }
});

export function createViewingScheduleRouter() {
  return router;
}

