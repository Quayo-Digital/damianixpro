import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabaseClient.mjs';
import {
  legacyMatchesRefinedFilter,
  mapRentRowToLegacyPayment,
  needsLegacyStatusRefinement,
  rentStatusesMatchingApiFilter,
} from './rentLedgerCompat.mjs';
import { computeTenantRentBalance } from './rentBalanceCore.mjs';

const router = express.Router();
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

async function getTenantContextFromToken(token) {
  if (!jwtSecret) {
    throw new Error('Missing SUPABASE_JWT_SECRET for verifying tenant token');
  }

  const payload = jwt.verify(token, jwtSecret);
  const userId = payload.sub || payload.user_id || payload.id;

  if (!userId) {
    throw new Error('Invalid token payload: missing user id');
  }

  return { userId };
}

router.get('/api/tenant/rent-balance', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service not configured (Supabase env missing).' });
    }

    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token.' });
    }

    const { userId } = await getTenantContextFromToken(token);

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (tenantError) {
      console.error('[rent-balance] Failed to load tenant', tenantError);
      return res.status(500).json({ error: 'Failed to load tenant profile.' });
    }
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant profile not found for this user.' });
    }

    const balance = await computeTenantRentBalance(tenant.id);
    if (!balance) {
      return res.status(404).json({ error: 'No active lease found for tenant.' });
    }

    return res.json(balance);
  } catch (error) {
    console.error('[rent-balance] Unexpected error', error);
    return res.status(500).json({ error: 'Failed to calculate rent balance.' });
  }
});

router.get('/api/tenant/payments', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service not configured.' });
    }

    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token.' });
    }

    const { userId } = await getTenantContextFromToken(token);

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant profile not found.' });
    }

    const statusFilter = req.query.status;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;
    const statusUpper = statusFilter ? String(statusFilter).toUpperCase() : '';

    const { data: ptList } = await supabaseAdmin.from('property_tenants').select('id').eq('tenant_id', tenant.id);
    const ptIds = (ptList || []).map((p) => p.id);
    if (ptIds.length === 0) {
      return res.json([]);
    }

    let query = supabaseAdmin
      .from('rent_payments')
      .select(
        `
        id,
        amount,
        due_date,
        payment_date,
        status,
        reference,
        created_at,
        payment_method,
        category,
        description,
        property_tenant_id,
        property_tenants!inner (
          tenant_id,
          tenants ( first_name, last_name )
        )
      `
      )
      .in('property_tenant_id', ptIds)
      .order('created_at', { ascending: false });

    const rs = statusFilter ? rentStatusesMatchingApiFilter(statusUpper) : null;
    if (needsLegacyStatusRefinement(statusFilter)) {
      query = query.in('status', ['pending', 'active']);
    } else if (rs?.length) {
      query = query.in('status', rs);
    }
    if (dateFrom) {
      query = query.gte('due_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('due_date', dateTo);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('[tenant/payments]', error);
      return res.status(500).json({ error: 'Failed to fetch payments.' });
    }

    let payRows = payments || [];
    if (needsLegacyStatusRefinement(statusFilter)) {
      payRows = payRows.filter((p) =>
        legacyMatchesRefinedFilter(mapRentRowToLegacyPayment(p).status, statusFilter)
      );
    }

    const list = payRows.map((p) => {
      const legacy = mapRentRowToLegacyPayment(p);
      const t = legacy.tenants || {};
      const tenantName = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Tenant';
      return {
        id: legacy.id,
        tenant_name: tenantName,
        amount: Number(legacy.amount),
        status: legacy.status,
        date: legacy.paid_date || legacy.due_date,
        due_date: legacy.due_date,
        paid_date: legacy.paid_date,
        transaction_id: legacy.transaction_id,
        created_at: legacy.created_at,
      };
    });

    const totalRevenue = list.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = list
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((s, p) => s + p.amount, 0);
    const completedCount = list.filter((p) => p.status === 'PAID').length;

    return res.json({
      summary: {
        total_revenue: totalRevenue,
        pending_payments: pendingAmount,
        completed_payments: completedCount,
      },
      transactions: list,
    });
  } catch (error) {
    console.error('[tenant/payments] Unexpected error', error);
    return res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

export function createRentBalanceRouter() {
  return router;
}

