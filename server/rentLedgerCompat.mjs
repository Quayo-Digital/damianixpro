/**
 * Map canonical public.rent_payments ↔ legacy Node API shapes (formerly public.payments).
 */

/** rent_payments.status → legacy API status (PENDING | PAID | CANCELLED | OVERDUE) */
export function apiStatusFromRent(status) {
  const x = String(status || "").toLowerCase();
  if (x === "successful") return "PAID";
  if (x === "failed" || x === "cancelled") return "CANCELLED";
  if (x === "pending" || x === "active") {
    return "PENDING";
  }
  return "PENDING";
}

/** True if this pending rent row should be treated as OVERDUE (legacy). */
export function isOverdueRentRow(row) {
  if (apiStatusFromRent(row.status) !== "PENDING") return false;
  const d = row.due_date;
  if (!d) return false;
  const due = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

/** Legacy filter (PENDING, PAID, …) → list of rent_payments.status values for .in() */
export function rentStatusesMatchingApiFilter(statusFilter) {
  const u = String(statusFilter || "").toUpperCase();
  if (u === "PAID" || u === "COMPLETED") return ["successful"];
  if (u === "CANCELLED" || u === "FAILED") return ["failed", "cancelled"];
  if (u === "PENDING" || u === "OVERDUE") return ["pending", "active"];
  return null;
}

/**
 * PENDING vs OVERDUE both map to DB pending/active — narrow in application code after fetch.
 */
export function needsLegacyStatusRefinement(statusFilter) {
  const u = String(statusFilter || "").toUpperCase();
  return u === "PENDING" || u === "OVERDUE";
}

export function legacyMatchesRefinedFilter(legacyStatus, statusFilter) {
  const u = String(statusFilter || "").toUpperCase();
  if (u === "OVERDUE") return legacyStatus === "OVERDUE";
  if (u === "PENDING") return legacyStatus === "PENDING";
  return true;
}

export function paidDateFromRentRow(row) {
  const p = row.payment_date;
  if (!p) return null;
  return String(p).slice(0, 10);
}

/**
 * Resolve property_tenants.id from an active-style lease row { id, tenant_id, property_id }.
 */
export async function resolvePropertyTenantIdFromLease(supabase, lease) {
  if (!supabase || !lease?.tenant_id || !lease?.property_id) return null;
  const { data, error } = await supabase
    .from("property_tenants")
    .select("id")
    .eq("tenant_id", lease.tenant_id)
    .eq("property_id", lease.property_id)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[rent-ledger] resolvePropertyTenantIdFromLease", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function resolveLeaseIdForPropertyTenant(supabase, propertyTenantId) {
  if (!supabase || !propertyTenantId) return null;
  const { data: pt, error: e1 } = await supabase
    .from("property_tenants")
    .select("tenant_id, property_id")
    .eq("id", propertyTenantId)
    .maybeSingle();
  if (e1 || !pt) return null;
  const { data: lease, error: e2 } = await supabase
    .from("leases")
    .select("id")
    .eq("tenant_id", pt.tenant_id)
    .eq("property_id", pt.property_id)
    .in("status", ["ACTIVE", "active"])
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e2) return null;
  return lease?.id ?? null;
}

/**
 * Load rent_payments for a tenant via property_tenants.
 */
export async function fetchRentPaymentsForTenant(supabase, tenantId) {
  if (!supabase || !tenantId) return [];
  const { data: pts, error: e1 } = await supabase.from("property_tenants").select("id").eq("tenant_id", tenantId);
  if (e1 || !pts?.length) return [];
  const ids = pts.map((p) => p.id);
  const { data: rows, error: e2 } = await supabase
    .from("rent_payments")
    .select(
      `
      id,
      amount,
      status,
      due_date,
      payment_date,
      payment_method,
      reference,
      created_at,
      updated_at,
      category,
      description,
      property_tenant_id,
      property_tenants!inner (
        tenant_id,
        property_id,
        tenants ( first_name, last_name, email, phone ),
        properties ( id, title, owner_id )
      )
    `
    )
    .in("property_tenant_id", ids)
    .order("created_at", { ascending: false });

  if (e2) {
    console.error("[rent-ledger] fetchRentPaymentsForTenant", e2);
    return [];
  }
  return rows || [];
}

/**
 * Normalize rent_payments row (+ embed) to legacy payment object for API responses.
 */
export function mapRentRowToLegacyPayment(row) {
  const pt = row.property_tenants || {};
  const t = pt.tenants || {};
  let status = apiStatusFromRent(row.status);
  if (status === "PENDING" && isOverdueRentRow(row)) {
    status = "OVERDUE";
  }
  const paidDate = paidDateFromRentRow(row);
  return {
    id: row.id,
    tenant_id: pt.tenant_id,
    lease_id: null,
    amount: row.amount,
    status,
    due_date: row.due_date,
    paid_date: paidDate,
    payment_method: row.payment_method || null,
    transaction_id: row.reference || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category,
    description: row.description,
    tenants: t,
    leases: pt.property_id
      ? {
          property_id: pt.property_id,
          properties: pt.properties || { owner_id: null },
        }
      : null,
    property_tenants: pt,
  };
}
