/**
 * Property CRM & sales pipeline (Express + Supabase admin).
 * Mount: app.use('/api/crm', createCrmPipelineRouter());
 *
 * RBAC: crm.read / crm.write from config/rbac-permission-matrix.json
 */

import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { createRequireRbacPermission } from './middleware/requireRbacPermission.mjs';

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const auth = [requireSupabaseJwt, attachUserRole];
const read = [...auth, createRequireRbacPermission('crm.read')];
const write = [...auth, createRequireRbacPermission('crm.write')];

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
function asFiniteNumber(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function asIsoDateTime(v) {
  if (v == null || v === '') return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
function isValidEmail(v) {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
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

async function assertPropertyAccess(uid, role, propertyId) {
  if (!propertyId) return true;
  if (role === 'admin' || role === 'super_admin') return true;
  const ids = await getVisiblePropertyIds(uid, role);
  return ids && ids.includes(propertyId);
}

async function assertLeadVisible(uid, role, lead) {
  if (!lead) return false;
  if (role === 'admin' || role === 'super_admin') return true;
  if (lead.created_by === uid) return true;
  if (lead.property_id) return assertPropertyAccess(uid, role, lead.property_id);
  return false;
}
async function assertDealVisible(uid, role, deal) {
  if (!deal) return false;
  if (role === 'admin' || role === 'super_admin') return true;
  if (deal.created_by === uid) return true;
  if (deal.assigned_agent_id === uid) return true;
  if (deal.property_id) return assertPropertyAccess(uid, role, deal.property_id);
  return false;
}

/** POST /leads */
router.post('/leads', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { full_name, email, phone, source, notes, property_id } = req.body ?? {};
  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    return res.status(400).json({ error: 'full_name is required.' });
  }
  if (property_id && !isUuid(property_id)) return res.status(400).json({ error: 'Invalid property_id.' });
  if (property_id && !(await assertPropertyAccess(uid, role, property_id))) {
    return res.status(403).json({ error: 'Not allowed for this property.' });
  }
  const normalizedEmail = asTrimmedString(email, 254);
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  const { data, error } = await supabaseAdmin
    .from('crm_leads')
    .insert({
      full_name: asTrimmedString(full_name, 200),
      email: normalizedEmail,
      phone: asTrimmedString(phone, 40),
      source: asTrimmedString(source, 80),
      notes: asTrimmedString(notes, 4000),
      property_id: property_id || null,
      created_by: uid,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm] lead insert', error);
    return res.status(500).json({ error: 'Failed to create lead.' });
  }
  return res.status(201).json({ lead: data });
});

/** GET /leads */
router.get('/leads', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  let q = supabaseAdmin.from('crm_leads').select('*').order('created_at', { ascending: false });
  if (role === 'admin' || role === 'super_admin') {
    /* all */
  } else {
    const ids = await getVisiblePropertyIds(uid, role);
    if (ids && ids.length > 0) {
      q = q.or(`created_by.eq.${uid},property_id.in.(${ids.join(',')})`);
    } else {
      q = q.eq('created_by', uid);
    }
  }
  const { data, error } = await q.limit(200);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ leads: data || [] });
});

/** GET /leads/:leadId — lead + linked deals + inspections + listing */
router.get('/leads/:leadId', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { leadId } = req.params;
  if (!isUuid(leadId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const role = req.userRole;

  const { data: lead, error: lErr } = await supabaseAdmin.from('crm_leads').select('*').eq('id', leadId).maybeSingle();
  if (lErr || !lead) return res.status(404).json({ error: 'Lead not found.' });
  if (!(await assertLeadVisible(uid, role, lead))) {
    return res.status(403).json({ error: 'Not allowed to view this lead.' });
  }

  const { data: deals, error: dErr } = await supabaseAdmin
    .from('crm_deals')
    .select('*')
    .eq('lead_id', leadId)
    .order('updated_at', { ascending: false });
  if (dErr) return res.status(500).json({ error: dErr.message });
  const dealRows = deals || [];
  const dealIds = dealRows.map((d) => d.id);
  let inspections = [];
  if (dealIds.length > 0) {
    const { data: ins } = await supabaseAdmin
      .from('crm_inspections')
      .select('*')
      .in('deal_id', dealIds)
      .order('scheduled_start', { ascending: true });
    inspections = ins || [];
  }

  let property = null;
  if (lead.property_id) {
    const { data: p } = await supabaseAdmin
      .from('properties')
      .select('id, name, address, city, state')
      .eq('id', lead.property_id)
      .maybeSingle();
    property = p ?? null;
  }

  return res.json({ lead, deals: dealRows, inspections, property });
});

/** PATCH /leads/:leadId */
router.patch('/leads/:leadId', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { leadId } = req.params;
  if (!isUuid(leadId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const role = req.userRole;

  const { data: lead, error: lErr } = await supabaseAdmin.from('crm_leads').select('*').eq('id', leadId).maybeSingle();
  if (lErr || !lead) return res.status(404).json({ error: 'Lead not found.' });
  if (!(await assertLeadVisible(uid, role, lead))) {
    return res.status(403).json({ error: 'Not allowed to update this lead.' });
  }

  const body = req.body ?? {};
  const patch = {};
  if (body.full_name != null) {
    const fn = String(body.full_name).trim();
    if (!fn) return res.status(400).json({ error: 'full_name cannot be empty.' });
    patch.full_name = asTrimmedString(fn, 200);
  }
  if (body.email !== undefined) {
    const normalizedEmail = asTrimmedString(body.email, 254);
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ error: 'Invalid email format.' });
    patch.email = normalizedEmail;
  }
  if (body.phone !== undefined) patch.phone = asTrimmedString(body.phone, 40);
  if (body.source !== undefined) patch.source = asTrimmedString(body.source, 80);
  if (body.notes !== undefined) patch.notes = asTrimmedString(body.notes, 4000);
  if (body.property_id !== undefined) {
    if (body.property_id && !isUuid(body.property_id)) {
      return res.status(400).json({ error: 'Invalid property_id.' });
    }
    if (body.property_id && !(await assertPropertyAccess(uid, role, body.property_id))) {
      return res.status(403).json({ error: 'Not allowed for this property.' });
    }
    patch.property_id = body.property_id || null;
  }

  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'No updates.' });

  const { data, error } = await supabaseAdmin.from('crm_leads').update(patch).eq('id', leadId).select('*').single();
  if (error) {
    console.error('[crm] lead patch', error);
    return res.status(500).json({ error: error.message });
  }
  return res.json({ lead: data });
});

/** GET /agent-options — profiles for deal assignment UI */
router.get('/agent-options', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;

  const labelOf = (p) => {
    const fn = (p.first_name || '').trim();
    const ln = (p.last_name || '').trim();
    const n = `${fn} ${ln}`.trim();
    return n || p.email || p.id;
  };

  if (role === 'admin' || role === 'super_admin') {
    const { data: profRows, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .order('first_name', { ascending: true })
      .limit(400);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({
      agents: (profRows || []).map((p) => ({ id: p.id, label: labelOf(p) })),
    });
  }

  const propIds = await getVisiblePropertyIds(uid, role);
  if (!propIds || propIds.length === 0) {
    const { data: self } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', uid)
      .maybeSingle();
    return res.json({
      agents: self ? [{ id: self.id, label: labelOf(self) }] : [],
    });
  }

  const { data: props } = await supabaseAdmin.from('properties').select('agent_id').in('id', propIds);
  const agentIdSet = new Set((props || []).map((p) => p.agent_id).filter(Boolean));
  agentIdSet.add(uid);
  const agentIds = [...agentIdSet];
  const { data: profs, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', agentIds);
  if (pErr) return res.status(500).json({ error: pErr.message });
  return res.json({
    agents: (profs || []).map((p) => ({ id: p.id, label: labelOf(p) })),
  });
});

/** POST /deals */
router.post('/deals', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const {
    title,
    lead_id,
    property_id,
    assigned_agent_id,
    budget_min,
    budget_max,
    next_follow_up_at,
  } = req.body ?? {};

  let dealTitle = asTrimmedString(title, 200);
  let propId = property_id || null;
  let leadId = lead_id || null;

  if (leadId) {
    if (!isUuid(leadId)) return res.status(400).json({ error: 'Invalid lead_id.' });
    const { data: lead } = await supabaseAdmin.from('crm_leads').select('*').eq('id', leadId).maybeSingle();
    if (!lead) return res.status(400).json({ error: 'Lead not found.' });
    if (!dealTitle) dealTitle = `Deal: ${lead.full_name}`;
    if (!propId && lead.property_id) propId = lead.property_id;
  }
  if (!dealTitle) return res.status(400).json({ error: 'title is required unless lead_id is set.' });
  if (propId && !isUuid(propId)) return res.status(400).json({ error: 'Invalid property_id.' });
  if (propId && !(await assertPropertyAccess(uid, role, propId))) {
    return res.status(403).json({ error: 'Not allowed for this property.' });
  }
  if (assigned_agent_id && !isUuid(assigned_agent_id)) {
    return res.status(400).json({ error: 'Invalid assigned_agent_id.' });
  }
  const budgetMin = asFiniteNumber(budget_min);
  const budgetMax = asFiniteNumber(budget_max);
  if (budget_min != null && budgetMin == null) return res.status(400).json({ error: 'Invalid budget_min.' });
  if (budget_max != null && budgetMax == null) return res.status(400).json({ error: 'Invalid budget_max.' });
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return res.status(400).json({ error: 'budget_min cannot exceed budget_max.' });
  }
  const nextFollowUpAt = asIsoDateTime(next_follow_up_at);
  if (next_follow_up_at != null && next_follow_up_at !== '' && nextFollowUpAt == null) {
    return res.status(400).json({ error: 'Invalid next_follow_up_at timestamp.' });
  }

  const row = {
    title: dealTitle,
    lead_id: leadId,
    property_id: propId,
    stage: 'lead',
    outcome: null,
    assigned_agent_id: assigned_agent_id || null,
    created_by: uid,
    budget_min: budgetMin,
    budget_max: budgetMax,
    next_follow_up_at: nextFollowUpAt,
  };

  const { data, error } = await supabaseAdmin.from('crm_deals').insert(row).select('*').single();
  if (error) {
    console.error('[crm] deal insert', error);
    return res.status(500).json({ error: 'Failed to create deal.' });
  }
  return res.status(201).json({ deal: data });
});

/** GET /deals */
router.get('/deals', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { stage } = req.query;

  let q = supabaseAdmin.from('crm_deals').select('*').order('updated_at', { ascending: false });

  if (stage && typeof stage === 'string') q = q.eq('stage', stage);

  if (role === 'admin' || role === 'super_admin') {
    /* all */
  } else {
    const ids = await getVisiblePropertyIds(uid, role);
    const parts = [`created_by.eq.${uid}`, `assigned_agent_id.eq.${uid}`];
    if (ids && ids.length > 0) parts.push(`property_id.in.(${ids.join(',')})`);
    q = q.or(parts.join(','));
  }

  const { data: deals, error } = await q.limit(500);
  if (error) {
    console.error('[crm] deals list', error);
    return res.status(500).json({ error: error.message });
  }
  const rows = deals || [];
  const leadIds = [...new Set(rows.map((d) => d.lead_id).filter(Boolean))];
  let leadMap = {};
  if (leadIds.length > 0) {
    const { data: leads } = await supabaseAdmin.from('crm_leads').select('*').in('id', leadIds);
    for (const l of leads || []) leadMap[l.id] = l;
  }
  const enriched = rows.map((d) => ({ ...d, lead: d.lead_id ? leadMap[d.lead_id] ?? null : null }));
  return res.json({ deals: enriched });
});

/** GET /deals/:dealId */
router.get('/deals/:dealId', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { dealId } = req.params;
  if (!isUuid(dealId)) return res.status(400).json({ error: 'Invalid id.' });

  const { data: deal, error: dErr } = await supabaseAdmin.from('crm_deals').select('*').eq('id', dealId).maybeSingle();
  if (dErr || !deal) return res.status(404).json({ error: 'Deal not found.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  if (!(await assertDealVisible(uid, role, deal))) {
    return res.status(403).json({ error: 'Not allowed to view this deal.' });
  }

  let lead = null;
  if (deal.lead_id) {
    const { data: l } = await supabaseAdmin.from('crm_leads').select('*').eq('id', deal.lead_id).maybeSingle();
    lead = l ?? null;
  }
  const dealOut = { ...deal, lead };

  const [ins, rem] = await Promise.all([
    supabaseAdmin.from('crm_inspections').select('*').eq('deal_id', dealId).order('scheduled_start'),
    supabaseAdmin.from('crm_reminders').select('*').eq('deal_id', dealId).order('remind_at'),
  ]);
  return res.json({
    deal: dealOut,
    inspections: ins.data || [],
    reminders: rem.data || [],
  });
});

/** PATCH /deals/:dealId */
router.patch('/deals/:dealId', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { dealId } = req.params;
  if (!isUuid(dealId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const body = req.body ?? {};
  const patch = {};

  if (body.title != null) patch.title = asTrimmedString(body.title, 200);
  if (body.property_id !== undefined) {
    if (body.property_id && !isUuid(body.property_id)) return res.status(400).json({ error: 'Invalid property_id.' });
    if (body.property_id && !(await assertPropertyAccess(uid, role, body.property_id))) {
      return res.status(403).json({ error: 'Not allowed for this property.' });
    }
    patch.property_id = body.property_id || null;
  }
  if (body.assigned_agent_id !== undefined) {
    if (body.assigned_agent_id && !isUuid(body.assigned_agent_id)) {
      return res.status(400).json({ error: 'Invalid assigned_agent_id.' });
    }
    patch.assigned_agent_id = body.assigned_agent_id || null;
  }
  if (body.budget_min !== undefined) {
    const n = asFiniteNumber(body.budget_min);
    if (body.budget_min != null && n == null) return res.status(400).json({ error: 'Invalid budget_min.' });
    patch.budget_min = n;
  }
  if (body.budget_max !== undefined) {
    const n = asFiniteNumber(body.budget_max);
    if (body.budget_max != null && n == null) return res.status(400).json({ error: 'Invalid budget_max.' });
    patch.budget_max = n;
  }
  if (
    (patch.budget_min ?? deal.budget_min) != null &&
    (patch.budget_max ?? deal.budget_max) != null &&
    (patch.budget_min ?? deal.budget_min) > (patch.budget_max ?? deal.budget_max)
  ) {
    return res.status(400).json({ error: 'budget_min cannot exceed budget_max.' });
  }
  if (body.next_follow_up_at !== undefined) {
    const iso = asIsoDateTime(body.next_follow_up_at);
    if (body.next_follow_up_at != null && body.next_follow_up_at !== '' && iso == null) {
      return res.status(400).json({ error: 'Invalid next_follow_up_at timestamp.' });
    }
    patch.next_follow_up_at = iso;
  }

  if (body.stage != null) {
    const st = String(body.stage);
    if (!['lead', 'inspection', 'negotiation', 'closed'].includes(st)) {
      return res.status(400).json({ error: 'Invalid stage.' });
    }
    patch.stage = st;
    if (st === 'closed') {
      const oc = body.outcome;
      if (oc !== 'won' && oc !== 'lost') {
        return res.status(400).json({ error: 'outcome won|lost required when stage is closed.' });
      }
      patch.outcome = oc;
    } else {
      patch.outcome = null;
    }
  } else if (body.outcome != null) {
    return res.status(400).json({ error: 'Set stage to closed to change outcome.' });
  }

  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'No updates.' });

  const { data, error } = await supabaseAdmin.from('crm_deals').update(patch).eq('id', dealId).select('*').single();
  if (error) {
    console.error('[crm] deal patch', error);
    return res.status(500).json({ error: error.message });
  }
  return res.json({ deal: data });
});

/** POST /deals/:dealId/inspections */
router.post('/deals/:dealId/inspections', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { dealId } = req.params;
  if (!isUuid(dealId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const { scheduled_start, scheduled_end, notes, status } = req.body ?? {};
  if (!scheduled_start) return res.status(400).json({ error: 'scheduled_start is required (ISO timestamp).' });
  const role = req.userRole;
  const { data: deal, error: dErr } = await supabaseAdmin.from('crm_deals').select('*').eq('id', dealId).maybeSingle();
  if (dErr || !deal) return res.status(404).json({ error: 'Deal not found.' });
  if (!(await assertDealVisible(uid, role, deal))) {
    return res.status(403).json({ error: 'Not allowed for this deal.' });
  }
  const scheduledStartIso = asIsoDateTime(scheduled_start);
  if (!scheduledStartIso) return res.status(400).json({ error: 'Invalid scheduled_start timestamp.' });
  const scheduledEndIso = asIsoDateTime(scheduled_end);
  if (scheduled_end != null && scheduled_end !== '' && !scheduledEndIso) {
    return res.status(400).json({ error: 'Invalid scheduled_end timestamp.' });
  }
  if (scheduledEndIso && scheduledEndIso < scheduledStartIso) {
    return res.status(400).json({ error: 'scheduled_end must be after scheduled_start.' });
  }
  const { data, error } = await supabaseAdmin
    .from('crm_inspections')
    .insert({
      deal_id: dealId,
      scheduled_start: scheduledStartIso,
      scheduled_end: scheduledEndIso,
      notes: asTrimmedString(notes, 4000),
      status: status && ['scheduled', 'completed', 'cancelled', 'no_show'].includes(status) ? status : 'scheduled',
      created_by: uid,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm] inspection insert', error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json({ inspection: data });
});

/** POST /deals/:dealId/reminders */
router.post('/deals/:dealId/reminders', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { dealId } = req.params;
  if (!isUuid(dealId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const { remind_at, body: msg } = req.body ?? {};
  if (!remind_at) return res.status(400).json({ error: 'remind_at is required (ISO timestamp).' });
  const role = req.userRole;
  const { data: deal, error: dErr } = await supabaseAdmin.from('crm_deals').select('*').eq('id', dealId).maybeSingle();
  if (dErr || !deal) return res.status(404).json({ error: 'Deal not found.' });
  if (!(await assertDealVisible(uid, role, deal))) {
    return res.status(403).json({ error: 'Not allowed for this deal.' });
  }
  const remindAtIso = asIsoDateTime(remind_at);
  if (!remindAtIso) return res.status(400).json({ error: 'Invalid remind_at timestamp.' });
  const { data, error } = await supabaseAdmin
    .from('crm_reminders')
    .insert({
      deal_id: dealId,
      remind_at: remindAtIso,
      body: asTrimmedString(msg, 2000),
      created_by: uid,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm] reminder insert', error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json({ reminder: data });
});

/** PATCH /reminders/:reminderId/complete */
router.patch('/reminders/:reminderId/complete', ...write, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const { reminderId } = req.params;
  if (!isUuid(reminderId)) return res.status(400).json({ error: 'Invalid id.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const { data: reminder, error: rErr } = await supabaseAdmin
    .from('crm_reminders')
    .select('id, deal_id')
    .eq('id', reminderId)
    .maybeSingle();
  if (rErr || !reminder) return res.status(404).json({ error: 'Reminder not found.' });
  const { data: deal, error: dErr } = await supabaseAdmin
    .from('crm_deals')
    .select('*')
    .eq('id', reminder.deal_id)
    .maybeSingle();
  if (dErr || !deal) return res.status(404).json({ error: 'Deal not found for reminder.' });
  if (!(await assertDealVisible(uid, role, deal))) {
    return res.status(403).json({ error: 'Not allowed for this reminder.' });
  }
  const { data, error } = await supabaseAdmin
    .from('crm_reminders')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', reminderId)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ reminder: data });
});

/** GET /reminders/upcoming */
router.get('/reminders/upcoming', ...read, async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  const uid = req.auth.sub;
  const role = req.userRole;
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  const until = new Date(Date.now() + days * 86400000).toISOString();
  const now = new Date().toISOString();

  let dealQuery = supabaseAdmin.from('crm_deals').select('id');
  if (role !== 'admin' && role !== 'super_admin') {
    const ids = await getVisiblePropertyIds(uid, role);
    const parts = [`created_by.eq.${uid}`, `assigned_agent_id.eq.${uid}`];
    if (ids && ids.length > 0) parts.push(`property_id.in.(${ids.join(',')})`);
    dealQuery = dealQuery.or(parts.join(','));
  }
  const { data: deals, error: dErr } = await dealQuery.limit(1000);
  if (dErr) return res.status(500).json({ error: dErr.message });
  const dealIds = (deals || []).map((d) => d.id);
  if (dealIds.length === 0) return res.json({ reminders: [] });

  const { data: reminders, error } = await supabaseAdmin
    .from('crm_reminders')
    .select('*')
    .in('deal_id', dealIds)
    .is('completed_at', null)
    .gte('remind_at', now)
    .lte('remind_at', until)
    .order('remind_at');
  if (error) return res.status(500).json({ error: error.message });
  const rlist = reminders || [];
  const rDealIds = [...new Set(rlist.map((r) => r.deal_id))];
  let dealMeta = {};
  if (rDealIds.length > 0) {
    const { data: drows } = await supabaseAdmin
      .from('crm_deals')
      .select('id,title,stage')
      .in('id', rDealIds);
    for (const d of drows || []) dealMeta[d.id] = d;
  }
  const merged = rlist.map((r) => ({ ...r, deal: dealMeta[r.deal_id] || null }));
  return res.json({ reminders: merged });
});

export function createCrmPipelineRouter() {
  return router;
}
