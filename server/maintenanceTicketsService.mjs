/**
 * Enterprise maintenance ticketing API (extends DamianixPro; does not replace POST /api/maintenance).
 *
 * Base path (mounted in index.mjs): `/api/maintenance`
 *
 * Example requests:
 *
 * POST /api/maintenance/tickets
 * Headers: Authorization: Bearer <supabase_jwt>
 * Body: { "property_id": "uuid", "title": "AC leak", "description": "...", "priority": "high", "unit_id": null }
 * Owner/agent/manager on behalf: add "tenant_id" (public.tenants.id) for an active property_tenants lease.
 * Response 201: { "ticket": { ... , "is_overdue": false }, "comments": [], "attachments": [], "history": [...] }
 *
 * GET /api/maintenance/tickets?status=pending&property_id=uuid
 * Response 200: { "tickets": [ { ... , "is_overdue": true } ], "count": 1 }
 *
 * GET /api/maintenance/tickets/:ticketId
 * Response 200: { "ticket": {...}, "comments": [...], "attachments": [...], "history": [...] }
 *
 * PATCH /api/maintenance/tickets/:ticketId
 * Body: { "status": "in_progress", "assigned_to": "uuid", "cost_estimate": 50000, "actual_cost": 48000 }
 *
 * POST /api/maintenance/tickets/:ticketId/comments  { "comment": "text" }
 * POST /api/maintenance/tickets/:ticketId/attachments  { "file_url": "https://...", "file_type": "image/png" }
 * POST /api/maintenance/tickets/:ticketId/assign  { "assigned_to": "uuid" }
 * POST /api/maintenance/tickets/:ticketId/resolve  { "actual_cost": 48000 }
 */

import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { getPermissionSetForRole } from './rbac/matrix.mjs';
import {
  enqueueMaintenanceTicketCreated,
  enqueueMaintenanceTicketStatus,
  drainNotificationOutbox,
} from './notifications/outboxTriggers.mjs';

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const authChain = [requireSupabaseJwt, attachUserRole];

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
function asFiniteNonNegative(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
function safeHttpUrl(v) {
  if (!v || typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > 2048) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function perm(role, key) {
  return getPermissionSetForRole(role).has(key);
}

async function notifyTenantTicketCreated(ticket) {
  if (!supabaseAdmin || !ticket?.tenant_id) return;
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('user_id, phone, email, first_name, last_name')
    .eq('id', ticket.tenant_id)
    .maybeSingle();
  if (!tenant?.user_id) return;
  await enqueueMaintenanceTicketCreated({
    tenant: { ...tenant, first_name: tenant.first_name || 'Tenant' },
    ticketTitle: ticket.title || 'Maintenance request',
    ticketNumber: ticket.ticket_number || '',
    ticketId: ticket.id,
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
  });
  await drainNotificationOutbox(20);
}

async function notifyTenantMaintenanceStatus(updated, previousRow) {
  if (!supabaseAdmin || !updated?.tenant_id) return;
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('user_id, phone, email, first_name, last_name')
    .eq('id', updated.tenant_id)
    .maybeSingle();
  if (!tenant?.user_id) return;
  await enqueueMaintenanceTicketStatus({
    tenant: { ...tenant, first_name: tenant.first_name || 'Tenant' },
    ticketTitle: updated.title || 'Maintenance request',
    oldStatus: previousRow?.status || 'unknown',
    newStatus: updated.status,
    ticketId: updated.id,
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
  });
  await drainNotificationOutbox(20);
}

function normalizePriority(p) {
  const x = String(p || 'medium').toLowerCase();
  if (['low', 'medium', 'high', 'urgent'].includes(x)) return x;
  return 'medium';
}

function slaHours(priority) {
  switch (priority) {
    case 'low':
      return 72;
    case 'medium':
      return 48;
    case 'high':
      return 24;
    case 'urgent':
      return 8;
    default:
      return 48;
  }
}

function computeSlaDeadline(priority) {
  const hrs = slaHours(normalizePriority(priority));
  return new Date(Date.now() + hrs * 3600 * 1000).toISOString();
}

function generateTicketNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `TKT-${datePart}-${randomPart}`;
}

function serializeTicket(row) {
  if (!row) return row;
  const now = Date.now();
  const terminal = row.status === 'resolved' || row.status === 'cancelled';
  const sla = row.sla_deadline ? new Date(row.sla_deadline).getTime() : null;
  const isOverdue = !terminal && sla != null && sla < now;
  return { ...row, is_overdue: isOverdue };
}

async function appendHistory(ticketId, action, performedBy, metadata = {}) {
  const { error } = await supabaseAdmin.from('maintenance_history').insert({
    ticket_id: ticketId,
    action,
    performed_by: performedBy,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  });
  if (error) console.error('[maintenanceTickets] history insert failed', error);
}

async function getTenantIdForUser(uid) {
  const { data } = await supabaseAdmin.from('tenants').select('id').eq('user_id', uid).maybeSingle();
  return data?.id ?? null;
}

async function getVisiblePropertyIds(uid, role) {
  if (role === 'admin' || role === 'super_admin') return null;
  if (role === 'owner') {
    const { data } = await supabaseAdmin.from('properties').select('id').eq('owner_id', uid);
    return (data || []).map((r) => r.id);
  }
  if (role === 'agent') {
    const { data } = await supabaseAdmin.from('properties').select('id').eq('agent_id', uid);
    return (data || []).map((r) => r.id);
  }
  if (role === 'manager') {
    const { data } = await supabaseAdmin
      .from('properties')
      .select('id')
      .or(`agent_id.eq.${uid},owner_id.eq.${uid}`);
    return (data || []).map((r) => r.id);
  }
  return [];
}

async function loadProperty(propertyId) {
  const { data } = await supabaseAdmin
    .from('properties')
    .select('id, owner_id, agent_id')
    .eq('id', propertyId)
    .maybeSingle();
  return data;
}

async function assertPropertyTenantActive(propertyId, tenantId) {
  const { data, error } = await supabaseAdmin
    .from('property_tenants')
    .select('id')
    .eq('property_id', propertyId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return false;
  return !!data;
}

async function assertUnitOnProperty(unitId, propertyId) {
  const { data } = await supabaseAdmin
    .from('units')
    .select('id')
    .eq('id', unitId)
    .eq('property_id', propertyId)
    .maybeSingle();
  return !!data;
}

async function canViewTicket(uid, role, ticket) {
  if (!ticket) return false;
  if (role === 'admin' || role === 'super_admin') return true;
  const tid = await getTenantIdForUser(uid);
  if (tid && ticket.tenant_id === tid) return true;
  if ((role === 'facility_manager' || role === 'vendor') && ticket.assigned_to === uid) return true;
  if (ticket.assigned_to === uid) return true;
  if (ticket.created_by === uid) return true;
  const pr = await loadProperty(ticket.property_id);
  if (!pr) return false;
  if (pr.owner_id === uid || pr.agent_id === uid) return true;
  if (role === 'manager' && (pr.owner_id === uid || pr.agent_id === uid)) return true;
  const ids = await getVisiblePropertyIds(uid, role);
  if (ids && ids.includes(ticket.property_id)) return true;
  return false;
}

async function canAssignTicket(uid, role, ticket) {
  if (!ticket) return false;
  if (role === 'admin' || role === 'super_admin') return true;
  if (!perm(role, 'maintenance.assign')) return false;
  const pr = await loadProperty(ticket.property_id);
  if (!pr) return false;
  if (pr.owner_id === uid) return true;
  if (role === 'manager' && (pr.owner_id === uid || pr.agent_id === uid)) return true;
  if (role === 'agent' && pr.agent_id === uid) return true;
  return false;
}

async function canEditCosts(uid, role, ticket) {
  if (role === 'admin' || role === 'super_admin') return true;
  if (!perm(role, 'maintenance.write')) return false;
  const pr = await loadProperty(ticket.property_id);
  if (!pr) return false;
  if (pr.owner_id === uid) return true;
  if (role === 'manager' && (pr.owner_id === uid || pr.agent_id === uid)) return true;
  if (role === 'agent' && pr.agent_id === uid) return true;
  return false;
}

async function fetchTicketBundle(ticketId) {
  const { data: ticket, error: tErr } = await supabaseAdmin
    .from('maintenance_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();
  if (tErr || !ticket) return null;
  const [comments, attachments, history] = await Promise.all([
    supabaseAdmin
      .from('maintenance_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('maintenance_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('maintenance_history')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  ]);
  return {
    ticket: serializeTicket(ticket),
    comments: comments.data || [],
    attachments: attachments.data || [],
    history: history.data || [],
  };
}

/** POST /tickets */
router.post('/tickets', ...authChain, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }
  const uid = req.auth.sub;
  const role = req.userRole;
  const { property_id, unit_id, title, description, priority } = req.body ?? {};

  if (!isUuid(property_id)) {
    return res.status(400).json({ error: 'property_id must be a valid UUID.' });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required.' });
  }
  if (!perm(role, 'maintenance.write')) {
    return res.status(403).json({ error: 'FORBIDDEN', detail: 'maintenance.write required' });
  }

  const pri = normalizePriority(priority);
  const slaDeadline = computeSlaDeadline(pri);

  let tenantId = null;
  if (role === 'tenant') {
    tenantId = await getTenantIdForUser(uid);
    if (!tenantId) {
      return res.status(400).json({ error: 'No tenant profile linked to this user.' });
    }
    const okLink = await assertPropertyTenantActive(property_id, tenantId);
    if (!okLink) {
      return res.status(403).json({ error: 'You are not an active tenant at this property.' });
    }
  } else if (
    role === 'admin' ||
    role === 'super_admin' ||
    (['owner', 'agent', 'manager'].includes(role) && perm(role, 'maintenance.write'))
  ) {
    const bodyTenant = req.body?.tenant_id;
    if (!isUuid(bodyTenant)) {
      return res.status(400).json({
        error:
          'tenant_id is required (UUID of public.tenants) when opening a ticket for a tenant on their behalf.',
      });
    }
    tenantId = bodyTenant;
    const okLink = await assertPropertyTenantActive(property_id, tenantId);
    if (!okLink) {
      return res.status(400).json({ error: 'tenant_id is not linked to property_id as an active lease.' });
    }
    if (role !== 'admin' && role !== 'super_admin') {
      const pr = await loadProperty(property_id);
      if (!pr) return res.status(400).json({ error: 'Property not found.' });
      if (role === 'owner' && pr.owner_id !== uid) {
        return res.status(403).json({ error: 'You can only create tickets for your own properties.' });
      }
      if (role === 'agent' && pr.agent_id !== uid) {
        return res.status(403).json({ error: 'You can only create tickets on properties assigned to you.' });
      }
      if (role === 'manager' && pr.owner_id !== uid && pr.agent_id !== uid) {
        return res.status(403).json({ error: 'You are not authorized for this property.' });
      }
    }
  } else {
    return res.status(403).json({
      error: 'Only tenants, admins, or property staff with maintenance.write may create tickets.',
    });
  }

  if (unit_id) {
    if (!isUuid(unit_id)) return res.status(400).json({ error: 'unit_id must be a UUID.' });
    const okUnit = await assertUnitOnProperty(unit_id, property_id);
    if (!okUnit) return res.status(400).json({ error: 'unit_id does not belong to property_id.' });
  }

  const ticketNumber = generateTicketNumber();
  const row = {
    ticket_number: ticketNumber,
    tenant_id: tenantId,
    property_id,
    unit_id: unit_id || null,
    title: asTrimmedString(title, 200),
    description: asTrimmedString(description, 4000) || '',
    priority: pri,
    status: 'pending',
    created_by: uid,
    sla_deadline: slaDeadline,
    cost_estimate: 0,
    actual_cost: null,
    assigned_to: null,
    resolved_at: null,
  };

  const { data: ticket, error } = await supabaseAdmin
    .from('maintenance_tickets')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    console.error('[maintenanceTickets] insert', error);
    return res.status(500).json({ error: 'Failed to create ticket.' });
  }

  await appendHistory(ticket.id, 'created', uid, {
    ticket_number: ticketNumber,
    priority: pri,
    sla_deadline: slaDeadline,
  });

  void notifyTenantTicketCreated(ticket).catch((e) =>
    console.warn('[maintenanceTickets] ticket created notification', e?.message)
  );

  const bundle = await fetchTicketBundle(ticket.id);
  return res.status(201).json(bundle);
});

/** GET /tickets */
router.get('/tickets', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  if (!perm(role, 'maintenance.read')) {
    return res.status(403).json({ error: 'FORBIDDEN', detail: 'maintenance.read required' });
  }

  let q = supabaseAdmin.from('maintenance_tickets').select('*').order('created_at', { ascending: false });

  if (role === 'tenant') {
    const tid = await getTenantIdForUser(uid);
    if (!tid) return res.json({ tickets: [], count: 0 });
    q = q.eq('tenant_id', tid);
  } else if (role === 'facility_manager' || role === 'vendor') {
    q = q.eq('assigned_to', uid);
  } else if (role !== 'admin' && role !== 'super_admin') {
    const ids = await getVisiblePropertyIds(uid, role);
    if (!ids || ids.length === 0) return res.json({ tickets: [], count: 0 });
    q = q.in('property_id', ids);
  }

  const { tenant_id, property_id, status, assigned_to } = req.query;
  if (isUuid(tenant_id) && (role === 'admin' || role === 'super_admin')) q = q.eq('tenant_id', tenant_id);
  if (isUuid(property_id)) q = q.eq('property_id', property_id);
  if (typeof status === 'string' && status) {
    if (!['pending', 'in_progress', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    q = q.eq('status', status);
  }
  if (isUuid(assigned_to) && (role === 'admin' || role === 'super_admin' || role === 'owner')) {
    q = q.eq('assigned_to', assigned_to);
  }

  const { data, error } = await q.limit(200);
  if (error) {
    console.error('[maintenanceTickets] list', error);
    return res.status(500).json({ error: 'Failed to list tickets.' });
  }
  const tickets = (data || []).map(serializeTicket);
  return res.json({ tickets, count: tickets.length });
});

/** GET /tickets/:ticketId */
router.get('/tickets/:ticketId', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  if (!perm(req.userRole, 'maintenance.read')) {
    return res.status(403).json({ error: 'FORBIDDEN', detail: 'maintenance.read required' });
  }

  const bundle = await fetchTicketBundle(ticketId);
  if (!bundle) return res.status(404).json({ error: 'Ticket not found.' });
  const ok = await canViewTicket(req.auth.sub, req.userRole, bundle.ticket);
  if (!ok) return res.status(403).json({ error: 'FORBIDDEN' });
  return res.json(bundle);
});

/** PATCH /tickets/:ticketId */
router.patch('/tickets/:ticketId', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const uid = req.auth.sub;
  const role = req.userRole;

  const { data: rawTicket } = await supabaseAdmin.from('maintenance_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!rawTicket) return res.status(404).json({ error: 'Ticket not found.' });
  if (!(await canViewTicket(uid, role, rawTicket))) return res.status(403).json({ error: 'FORBIDDEN' });

  if (role === 'tenant') {
    return res.status(403).json({ error: 'Tenants cannot patch tickets; use comments endpoint.' });
  }

  const body = req.body ?? {};
  const patch = {};
  const meta = { before: {} };

  const fmLike = role === 'facility_manager' || role === 'vendor';
  const assignedStaff = rawTicket.assigned_to === uid;

  if (body.status != null) {
    const st = String(body.status);
    if (!['pending', 'in_progress', 'resolved', 'cancelled'].includes(st)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    if (fmLike && !assignedStaff) {
      return res.status(403).json({ error: 'Only assignees can change status for this role.' });
    }
    if (fmLike && !perm(role, 'maintenance.write')) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    if (!fmLike && !perm(role, 'maintenance.write')) {
      return res.status(403).json({ error: 'maintenance.write required' });
    }
    meta.before.status = rawTicket.status;
    patch.status = st;
  }

  if (body.assigned_to !== undefined) {
    if (!perm(role, 'maintenance.assign')) {
      return res.status(403).json({ error: 'maintenance.assign required to set assignee.' });
    }
    const okAssign = await canAssignTicket(uid, role, rawTicket);
    if (!okAssign) return res.status(403).json({ error: 'FORBIDDEN' });
    const assignee = body.assigned_to;
    if (assignee !== null && !isUuid(assignee)) {
      return res.status(400).json({ error: 'assigned_to must be UUID or null.' });
    }
    meta.before.assigned_to = rawTicket.assigned_to;
    patch.assigned_to = assignee;
  }

  if (body.cost_estimate != null || body.actual_cost !== undefined) {
    const okCost = await canEditCosts(uid, role, rawTicket);
    if (!okCost) return res.status(403).json({ error: 'FORBIDDEN', detail: 'Cannot edit costs for this ticket.' });
    if (body.cost_estimate != null) {
      const n = asFiniteNonNegative(body.cost_estimate);
      if (n == null) return res.status(400).json({ error: 'Invalid cost_estimate.' });
      meta.before.cost_estimate = rawTicket.cost_estimate;
      patch.cost_estimate = n;
    }
    if (body.actual_cost !== undefined) {
      if (body.actual_cost === null) {
        patch.actual_cost = null;
      } else {
        const n = asFiniteNonNegative(body.actual_cost);
        if (n == null) return res.status(400).json({ error: 'Invalid actual_cost.' });
        patch.actual_cost = n;
      }
      meta.before.actual_cost = rawTicket.actual_cost;
    }
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('maintenance_tickets')
    .update(patch)
    .eq('id', ticketId)
    .select('*')
    .single();

  if (error) {
    console.error('[maintenanceTickets] patch', error);
    return res.status(500).json({ error: 'Update failed.' });
  }

  if (patch.assigned_to !== undefined && patch.assigned_to !== rawTicket.assigned_to) {
    await appendHistory(ticketId, 'assigned', uid, { assigned_to: patch.assigned_to });
  }
  if (patch.status != null && patch.status !== rawTicket.status) {
    await appendHistory(ticketId, 'status_changed', uid, {
      from: rawTicket.status,
      to: patch.status,
    });
    void notifyTenantMaintenanceStatus(updated, rawTicket).catch((e) =>
      console.warn('[maintenanceTickets] notification outbox', e?.message)
    );
  }
  const otherPatch = { ...patch };
  delete otherPatch.status;
  delete otherPatch.assigned_to;
  if (Object.keys(otherPatch).length > 0) {
    await appendHistory(ticketId, 'updated', uid, { patch: otherPatch, ...meta });
  }

  const bundle = await fetchTicketBundle(ticketId);
  return res.json(bundle);
});

/** POST /tickets/:ticketId/comments */
router.post('/tickets/:ticketId/comments', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { comment } = req.body ?? {};
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return res.status(400).json({ error: 'comment is required.' });
  }
  if (!perm(role, 'maintenance.write')) {
    return res.status(403).json({ error: 'maintenance.write required' });
  }

  const { data: rawTicket } = await supabaseAdmin.from('maintenance_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!rawTicket) return res.status(404).json({ error: 'Ticket not found.' });
  if (!(await canViewTicket(uid, role, rawTicket))) return res.status(403).json({ error: 'FORBIDDEN' });

  const { data: row, error } = await supabaseAdmin
    .from('maintenance_comments')
    .insert({ ticket_id: ticketId, user_id: uid, comment: asTrimmedString(comment, 2000) })
    .select('*')
    .single();

  if (error) {
    console.error('[maintenanceTickets] comment', error);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }

  await appendHistory(ticketId, 'comment_added', uid, { comment_id: row.id });
  const bundle = await fetchTicketBundle(ticketId);
  return res.status(201).json(bundle);
});

/** POST /tickets/:ticketId/attachments */
router.post('/tickets/:ticketId/attachments', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { file_url, file_type } = req.body ?? {};
  const safeUrl = safeHttpUrl(file_url);
  if (!safeUrl) return res.status(400).json({ error: 'file_url must be a valid http(s) URL.' });
  if (!perm(role, 'maintenance.write')) {
    return res.status(403).json({ error: 'maintenance.write required' });
  }

  const { data: rawTicket } = await supabaseAdmin.from('maintenance_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!rawTicket) return res.status(404).json({ error: 'Ticket not found.' });
  if (!(await canViewTicket(uid, role, rawTicket))) return res.status(403).json({ error: 'FORBIDDEN' });

  const { data: row, error } = await supabaseAdmin
    .from('maintenance_attachments')
    .insert({
      ticket_id: ticketId,
      file_url: safeUrl,
      file_type: asTrimmedString(file_type, 80),
    })
    .select('*')
    .single();

  if (error) {
    console.error('[maintenanceTickets] attachment', error);
    return res.status(500).json({ error: 'Failed to add attachment.' });
  }

  await appendHistory(ticketId, 'attachment_added', uid, { attachment_id: row.id, file_type: row.file_type });
  const bundle = await fetchTicketBundle(ticketId);
  return res.status(201).json(bundle);
});

/** POST /tickets/:ticketId/assign */
router.post('/tickets/:ticketId/assign', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { assigned_to } = req.body ?? {};
  if (!isUuid(assigned_to)) {
    return res.status(400).json({ error: 'assigned_to UUID is required.' });
  }
  if (!perm(role, 'maintenance.assign')) {
    return res.status(403).json({ error: 'maintenance.assign required' });
  }

  const { data: rawTicket } = await supabaseAdmin.from('maintenance_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!rawTicket) return res.status(404).json({ error: 'Ticket not found.' });
  if (!(await canAssignTicket(uid, role, rawTicket))) return res.status(403).json({ error: 'FORBIDDEN' });

  const { error } = await supabaseAdmin
    .from('maintenance_tickets')
    .update({ assigned_to, status: rawTicket.status === 'pending' ? 'in_progress' : rawTicket.status })
    .eq('id', ticketId);

  if (error) {
    console.error('[maintenanceTickets] assign', error);
    return res.status(500).json({ error: 'Assign failed.' });
  }

  await appendHistory(ticketId, 'assigned', uid, { assigned_to });
  const bundle = await fetchTicketBundle(ticketId);
  return res.json(bundle);
});

/** POST /tickets/:ticketId/resolve */
router.post('/tickets/:ticketId/resolve', ...authChain, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase is not configured.' });
  const { ticketId } = req.params;
  if (!isUuid(ticketId)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { actual_cost } = req.body ?? {};

  const { data: rawTicket } = await supabaseAdmin.from('maintenance_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (!rawTicket) return res.status(404).json({ error: 'Ticket not found.' });
  if (!(await canViewTicket(uid, role, rawTicket))) return res.status(403).json({ error: 'FORBIDDEN' });

  const fmLike = role === 'facility_manager' || role === 'vendor';
  if (fmLike) {
    if (rawTicket.assigned_to !== uid || !perm(role, 'maintenance.write')) {
      return res.status(403).json({ error: 'Only assigned staff may resolve.' });
    }
  } else if (!(await canEditCosts(uid, role, rawTicket)) && role !== 'admin' && role !== 'super_admin') {
    const pr = await loadProperty(rawTicket.property_id);
    const ownerOk = pr?.owner_id === uid && perm(role, 'maintenance.write');
    if (!ownerOk && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
  }

  const patch = {
    status: 'resolved',
    resolved_at: new Date().toISOString(),
  };
  if (actual_cost !== undefined) {
    if (actual_cost === null) patch.actual_cost = null;
    else {
      const n = asFiniteNonNegative(actual_cost);
      if (n == null) return res.status(400).json({ error: 'Invalid actual_cost.' });
      patch.actual_cost = n;
    }
  }

  const { error } = await supabaseAdmin.from('maintenance_tickets').update(patch).eq('id', ticketId);
  if (error) {
    console.error('[maintenanceTickets] resolve', error);
    return res.status(500).json({ error: 'Resolve failed.' });
  }

  await appendHistory(ticketId, 'resolved', uid, { actual_cost: patch.actual_cost ?? null });
  const bundle = await fetchTicketBundle(ticketId);
  return res.json(bundle);
});

export function createMaintenanceTicketsRouter() {
  return router;
}
