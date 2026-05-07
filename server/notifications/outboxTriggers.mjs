/**
 * High-level enqueue helpers (rent, payments, maintenance).
 * Import from route handlers / webhooks — keeps trigger wiring in one discoverable module.
 */

import { insertOutboxJobs, buildOutboxRows, processOutboxBatch } from './outboxCore.mjs';

function formatAmount(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function dueDisplay(dueDate) {
  try {
    return new Date(dueDate).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dueDate || '');
  }
}

function daysPhrase(daysUntilDue) {
  const d = Number(daysUntilDue);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

/**
 * @param {object} opts
 * @param {{ user_id?: string, email?: string, phone?: string, first_name?: string }} opts.tenant
 * @param {number} opts.amount
 * @param {string} opts.dueDate
 * @param {number} opts.daysUntilDue
 * @param {string} [opts.paymentLink]
 * @param {string[]} [opts.channels]
 */
export async function enqueueRentDueReminder(opts) {
  const { tenant, amount, dueDate, daysUntilDue, paymentLink, channels } = opts;
  const recipient = {
    user_id: tenant.user_id || null,
    email: tenant.email || null,
    phone: tenant.phone || null,
    display_name: tenant.first_name || 'Tenant',
  };
  const payload = {
    first_name: tenant.first_name || 'Tenant',
    amount,
    amount_formatted: formatAmount(amount),
    due_date: dueDate,
    due_date_display: dueDisplay(dueDate),
    days_until_due: daysUntilDue,
    days_phrase: daysPhrase(daysUntilDue),
    payment_link: paymentLink || '',
  };
  const rows = buildOutboxRows('rent_due', recipient, payload, channels);
  return insertOutboxJobs(rows);
}

/**
 * @param {object} opts
 * @param {{ user_id?: string, email?: string, phone?: string, first_name?: string }} opts.tenant
 * @param {number} opts.amount
 * @param {string} opts.txRef
 * @param {string[]} [opts.channels]
 */
export async function enqueuePaymentReceived(opts) {
  const { tenant, amount, txRef, channels } = opts;
  const recipient = {
    user_id: tenant.user_id || null,
    email: tenant.email || null,
    phone: tenant.phone || null,
    display_name: tenant.first_name || 'Tenant',
  };
  const payload = {
    first_name: tenant.first_name || 'Tenant',
    amount,
    amount_formatted: formatAmount(amount),
    tx_ref: txRef,
  };
  const rows = buildOutboxRows('payment_received', recipient, payload, channels);
  return insertOutboxJobs(rows);
}

/**
 * @param {object} opts
 * @param {{ user_id?: string, email?: string, phone?: string, first_name?: string }} opts.tenant
 * @param {string} opts.txRef
 * @param {string[]} [opts.channels]
 */
export async function enqueuePaymentFailed(opts) {
  const { tenant, txRef, channels } = opts;
  const recipient = {
    user_id: tenant.user_id || null,
    email: tenant.email || null,
    phone: tenant.phone || null,
    display_name: tenant.first_name || 'Tenant',
  };
  const payload = {
    first_name: tenant.first_name || 'Tenant',
    tx_ref: txRef,
  };
  const rows = buildOutboxRows('payment_failed', recipient, payload, channels);
  return insertOutboxJobs(rows);
}

/**
 * @param {object} opts
 * @param {{ user_id?: string, email?: string, phone?: string, first_name?: string }} opts.tenant
 * @param {string} opts.ticketTitle
 * @param {string} opts.oldStatus
 * @param {string} opts.newStatus
 * @param {string} [opts.ticketId]
 * @param {string[]} [opts.channels]
 */
/**
 * @param {object} opts
 * @param {{ user_id?: string, email?: string, phone?: string, first_name?: string }} opts.tenant
 * @param {string} opts.ticketTitle
 * @param {string} opts.ticketNumber
 * @param {string} [opts.ticketId]
 * @param {string[]} [opts.channels]
 */
export async function enqueueMaintenanceTicketCreated(opts) {
  const { tenant, ticketTitle, ticketNumber, ticketId, channels } = opts;
  const recipient = {
    user_id: tenant.user_id || null,
    email: tenant.email || null,
    phone: tenant.phone || null,
    display_name: tenant.first_name || 'Tenant',
  };
  const payload = {
    first_name: tenant.first_name || 'Tenant',
    ticket_title: ticketTitle,
    ticket_number: ticketNumber,
    ticket_id: ticketId || '',
  };
  const rows = buildOutboxRows('maintenance_ticket_created', recipient, payload, channels);
  return insertOutboxJobs(rows);
}

export async function enqueueMaintenanceTicketStatus(opts) {
  const { tenant, ticketTitle, oldStatus, newStatus, ticketId, channels } = opts;
  const recipient = {
    user_id: tenant.user_id || null,
    email: tenant.email || null,
    phone: tenant.phone || null,
    display_name: tenant.first_name || 'Tenant',
  };
  const payload = {
    first_name: tenant.first_name || 'Tenant',
    ticket_title: ticketTitle,
    old_status: oldStatus,
    new_status: newStatus,
    ticket_id: ticketId || '',
  };
  const rows = buildOutboxRows('maintenance_update', recipient, payload, channels);
  return insertOutboxJobs(rows);
}

export { processOutboxBatch as drainNotificationOutbox };
