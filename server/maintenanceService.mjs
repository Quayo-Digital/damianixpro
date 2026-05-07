import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';

const router = express.Router();
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}
function asTrimmedString(v, maxLen) {
  if (v == null) return null;
  const out = String(v).trim();
  if (!out) return null;
  return out.length > maxLen ? out.slice(0, maxLen) : out;
}

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
  if (!isUuid(String(tenant_id)) || !isUuid(String(property_id))) {
    return res.status(400).json({ error: 'tenant_id and property_id must be valid UUIDs.' });
  }

  const ticketNumber = generateTicketNumber();
  const title = `Ticket ${ticketNumber}`;
  const description = asTrimmedString(issue, 2000);
  if (!description) {
    return res.status(400).json({ error: 'issue must be a non-empty string.' });
  }

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

