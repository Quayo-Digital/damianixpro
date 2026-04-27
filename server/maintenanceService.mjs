import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';

const router = express.Router();

function generateTicketNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 1_0000)
    .toString()
    .padStart(4, '0');
  return `MNT-${datePart}-${randomPart}`;
}

router.post('/api/maintenance', async (req, res) => {
  if (!supabaseAdmin) {
    return res
      .status(500)
      .json({ error: 'Maintenance service not configured. Missing Supabase credentials.' });
  }

  const { tenant_id, property_id, issue } = req.body ?? {};

  if (!tenant_id || !property_id || !issue) {
    return res
      .status(400)
      .json({ error: 'tenant_id, property_id, and issue are all required fields.' });
  }

  const ticketNumber = generateTicketNumber();
  const title = `Ticket ${ticketNumber}`;
  const description = String(issue).trim();

  try {
    const { data, error } = await supabaseAdmin
      .from('maintenance_requests')
      .insert([
        {
          tenant_id,
          property_id,
          title,
          description,
          priority: 'MEDIUM',
          status: 'OPEN',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[maintenance] Failed to create maintenance request', error);
      return res.status(500).json({ error: 'Failed to create maintenance request.' });
    }

    return res.status(201).json({
      message: 'Maintenance request submitted successfully.',
      ticket_number: ticketNumber,
      request: data,
    });
  } catch (err) {
    console.error('[maintenance] Unexpected error creating maintenance request', err);
    return res.status(500).json({ error: 'Unexpected error creating maintenance request.' });
  }
});

export function createMaintenanceRouter() {
  return router;
}

