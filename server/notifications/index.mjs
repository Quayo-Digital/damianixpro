/**
 * Notification system (queue + templates + channels).
 * @see notificationSystemService.mjs for HTTP worker endpoint.
 */

export { renderTemplate } from './templateEngine.mjs';
export { TRIGGER_TEMPLATES, TRIGGER_KEYS, isKnownTrigger, renderChannelPayload } from './templates.mjs';
export {
  insertOutboxJobs,
  buildOutboxRows,
  processOutboxBatch,
  processOutboxRow,
} from './outboxCore.mjs';
export {
  enqueueRentDueReminder,
  enqueuePaymentReceived,
  enqueuePaymentFailed,
  enqueueMaintenanceTicketCreated,
  enqueueMaintenanceTicketStatus,
  drainNotificationOutbox,
} from './outboxTriggers.mjs';
export { deliverChannel, sendSmsAbstract, sendWhatsAppAbstract } from './channelDeliver.mjs';
