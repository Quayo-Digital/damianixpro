/**
 * DamianixPro Accounting Engine
 *
 * Core Idea: Event → Accounting Engine → Journal Entries
 *
 * Every financial action automatically generates double-entry accounting records.
 * - Tenant pays rent → Debit Bank, Credit Rent Income
 * - Expense recorded → Debit Expense Account, Credit Bank
 * - Manual transaction → Debit/Credit based on type
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Create double-entry journal entries.
 * @param {object} supabase - Supabase client
 * @param {object[]} entries - Array of { account, debit, credit, description?, reference?, source_type, source_id?, property_id?, tenant_id? }
 * @param {string} entryDate - YYYY-MM-DD
 * @returns {Promise<{ batchId: string, error?: Error }>}
 */
export async function createJournalEntries(supabase, entries, entryDate) {
  if (!supabase || !entries?.length || !entryDate) {
    return { batchId: null, error: new Error("Missing required params") };
  }

  const batchId = uuidv4();
  const rows = entries.map((e) => ({
    journal_batch_id: batchId,
    entry_date: entryDate,
    account: e.account,
    debit: Number(e.debit || 0),
    credit: Number(e.credit || 0),
    description: e.description || null,
    reference: e.reference || null,
    source_type: e.source_type || "manual",
    source_id: e.source_id || null,
    property_id: e.property_id || null,
    tenant_id: e.tenant_id || null,
  }));

  const { error } = await supabase.from("journal_entries").insert(rows);
  if (error) {
    console.error("[accounting-engine] Journal insert failed", error);
    return { batchId, error };
  }
  return { batchId };
}

/**
 * Record rent payment: Debit Bank Account, Credit Rent Income
 */
export async function recordRentPayment(supabase, opts) {
  const { paymentId, amount, leaseId, tenantId, txRef, entryDate } = opts;
  if (!supabase || !paymentId || !amount || amount <= 0) return { error: new Error("Invalid params") };

  let propertyId = null;
  let tenantUserId = null;

  if (leaseId) {
    const { data: lease } = await supabase
      .from("leases")
      .select("property_id")
      .eq("id", leaseId)
      .maybeSingle();
    propertyId = lease?.property_id || null;
  }

  if (tenantId) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("user_id")
      .eq("id", tenantId)
      .maybeSingle();
    tenantUserId = tenant?.user_id || null;
  }

  const ref = txRef || paymentId;
  const amt = Number(amount);
  const date = entryDate || new Date().toISOString().slice(0, 10);

  return createJournalEntries(
    supabase,
    [
      { account: "Bank Account", debit: amt, credit: 0, description: "Rent payment received", reference: ref, source_type: "rent_payment", source_id: paymentId, property_id: propertyId, tenant_id: tenantUserId },
      { account: "Rent Income", debit: 0, credit: amt, description: "Rent payment received", reference: ref, source_type: "rent_payment", source_id: paymentId, property_id: propertyId, tenant_id: tenantUserId },
    ],
    date
  );
}

/**
 * Record expense: Debit Expense Account, Credit Bank Account
 */
export async function recordExpense(supabase, opts) {
  const { expenseId, amount, account, description, propertyId, entryDate } = opts;
  if (!supabase || !expenseId || !amount || amount <= 0 || !account) return { error: new Error("Invalid params") };

  const amt = Number(amount);
  const date = entryDate || new Date().toISOString().slice(0, 10);

  return createJournalEntries(
    supabase,
    [
      { account, debit: amt, credit: 0, description: description || "Expense", reference: expenseId, source_type: "expense", source_id: expenseId, property_id: propertyId || null, tenant_id: null },
      { account: "Bank Account", debit: 0, credit: amt, description: description || "Expense", reference: expenseId, source_type: "expense", source_id: expenseId, property_id: propertyId || null, tenant_id: null },
    ],
    date
  );
}

/**
 * Record manual income/expense transaction: Debit Bank/Credit Income or Debit Expense/Credit Bank
 */
export async function recordManualTransaction(supabase, opts) {
  const { txId, type, amount, account, description, propertyId, tenantId, entryDate } = opts;
  if (!supabase || !txId || !type || !amount || amount <= 0 || !account) return { error: new Error("Invalid params") };

  const amt = Number(amount);
  const date = entryDate || new Date().toISOString().slice(0, 10);

  if (type === "income") {
    return createJournalEntries(
      supabase,
      [
        { account: "Bank Account", debit: amt, credit: 0, description: description || "Manual income", reference: txId, source_type: "manual", source_id: txId, property_id: propertyId || null, tenant_id: tenantId || null },
        { account, debit: 0, credit: amt, description: description || "Manual income", reference: txId, source_type: "manual", source_id: txId, property_id: propertyId || null, tenant_id: tenantId || null },
      ],
      date
    );
  }

  if (type === "expense") {
    return createJournalEntries(
      supabase,
      [
        { account, debit: amt, credit: 0, description: description || "Manual expense", reference: txId, source_type: "manual", source_id: txId, property_id: propertyId || null, tenant_id: tenantId || null },
        { account: "Bank Account", debit: 0, credit: amt, description: description || "Manual expense", reference: txId, source_type: "manual", source_id: txId, property_id: propertyId || null, tenant_id: tenantId || null },
      ],
      date
    );
  }

  return { error: new Error("type must be 'income' or 'expense'") };
}
