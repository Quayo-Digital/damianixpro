/**
 * Property + voice sidecar (Express). Uses Supabase (service role) as the primary store for these routes.
 * Not the ledger API: see `fintech-api/` and docs/ARCHITECTURE_RUNTIMES.md (Flutterwave webhooks differ).
 */
import 'dotenv/config';
import express from 'express';
import { applyVoiceServerSecurity, createStrictRouteLimiter } from './httpSecurity.mjs';
import { createVoiceRouter } from './voiceTranscriptionService.mjs';
import { createIntentRouter } from './intentDetectionService.mjs';
import { createMaintenanceRouter } from './maintenanceService.mjs';
import { createMaintenanceTicketsRouter } from './maintenanceTicketsService.mjs';
import { createRentBalanceRouter } from './rentBalanceService.mjs';
import { createPropertySearchRouter } from './propertySearchService.mjs';
import { createViewingScheduleRouter } from './viewingScheduleService.mjs';
import { createRentPaymentRouter } from './rentPaymentService.mjs';
import { createFlutterwavePaymentRouter } from './flutterwavePaymentService.mjs';
import { createPaymentInsightsRouter } from './paymentInsightsService.mjs';
import { createVoiceAuthRouter } from './voiceAuthService.mjs';
import { createWhatsAppVoiceRouter } from './whatsappVoiceAssistant.mjs';
import { createRentReminderRouter } from './rentReminderService.mjs';
import { createVoiceAssistantRouter } from './voiceAssistantService.mjs';
import { createAccountingTransactionRouter } from './accountingTransactionService.mjs';
import { createExpenseRouter } from './expenseService.mjs';
import { createProfitLossReportRouter } from './profitLossReportService.mjs';
import { createCashFlowReportRouter } from './cashFlowReportService.mjs';
import { createTenantLedgerRouter } from './tenantLedgerService.mjs';
import { createPropertyFinancialsRouter } from './propertyFinancialsService.mjs';
import { createAIFinancialAssistantRouter } from './aiFinancialAssistantService.mjs';
import { createLeasingAssistRouter } from './leasingAssistService.mjs';
import { createLeaseOnboardingAssistRouter } from './leaseOnboardingAssistService.mjs';
import { createPropertyCopywriterRouter } from './propertyCopywriterService.mjs';
import { createDocumentOcrRouter } from './documentOcrService.mjs';
import { createWebPushWebhookRouter } from './webPushWebhook.mjs';
import { createSupportChatRouter } from './supportChatService.mjs';
import { createRbacRouter } from './rbacRoutes.mjs';
import { createCrmPipelineRouter } from './crmPipelineService.mjs';
import { createAiAssistantRouter } from './aiAssistantService.mjs';
import { createNotificationSystemRouter } from './notificationSystemService.mjs';
import { createExecutiveAnalyticsRouter } from './executiveAnalyticsService.mjs';
import { createImportPipelineRouter } from './importPipelineService.mjs';
import {
  errorHandler,
  logger,
  notFoundHandler,
  requestContextMiddleware,
} from './observability.mjs';

const app = express();
const port = process.env.VOICE_SERVER_PORT || 4000;
const strictWriteLimiter = createStrictRouteLimiter({
  windowMs: 60_000,
  max: Math.min(300, Math.max(10, Number(process.env.API_WRITE_RATE_LIMIT_MAX) || 80)),
  message: 'Write rate limit exceeded. Slow down and retry.',
});
const authLikeLimiter = createStrictRouteLimiter({
  windowMs: 60_000,
  max: Math.min(300, Math.max(5, Number(process.env.API_AUTH_RATE_LIMIT_MAX) || 40)),
  message: 'Too many authentication or sensitive attempts. Please wait.',
});
const analyticsLimiter = createStrictRouteLimiter({
  windowMs: 60_000,
  max: Math.min(600, Math.max(10, Number(process.env.API_ANALYTICS_RATE_LIMIT_MAX) || 90)),
  message: 'Analytics rate limit exceeded. Please wait.',
});
const webhookLimiter = createStrictRouteLimiter({
  windowMs: 60_000,
  max: Math.min(2000, Math.max(50, Number(process.env.API_WEBHOOK_RATE_LIMIT_MAX) || 400)),
  message: 'Webhook rate limit exceeded.',
});

applyVoiceServerSecurity(app, { jsonLimit: '5mb' });
app.use(requestContextMiddleware);

// Mount voice transcription routes
app.use(createVoiceRouter());

// Mount intent detection routes
app.use(createIntentRouter());

// Mount voice AI assistant (pay rent, check balance)
app.use(createVoiceAssistantRouter());

// Mount enterprise maintenance tickets (GET/POST /api/maintenance/tickets, etc.)
app.use('/api/maintenance/tickets', strictWriteLimiter);
app.use('/api/maintenance', createMaintenanceTicketsRouter());
// Legacy single-endpoint maintenance intake (POST /api/maintenance)
app.use('/api/maintenance', strictWriteLimiter);
app.use(createMaintenanceRouter());

// Mount rent balance endpoint
app.use(createRentBalanceRouter());

// Mount property search endpoint
app.use(createPropertySearchRouter());

// Mount viewing scheduling endpoint
app.use(createViewingScheduleRouter());

// Mount rent payment endpoints
app.use('/api/payments/webhook', webhookLimiter);
app.use('/api/payments/rent/webhook', webhookLimiter);
app.use('/api/payments/rent', strictWriteLimiter);
app.use('/api/payments', analyticsLimiter);
app.use(createRentPaymentRouter());

// Mount payment insights (GET /api/payments/insights) - before :id routes
app.use('/api/payments/insights', analyticsLimiter);
app.use(createPaymentInsightsRouter());

// Mount Flutterwave rent payment (POST /api/payments/rent/flutterwave)
app.use(createFlutterwavePaymentRouter());

// Mount voice agent authentication
app.use(createVoiceAuthRouter());

// Mount WhatsApp voice assistant
app.use(createWhatsAppVoiceRouter());

// Mount AI rent reminder system
app.use(createRentReminderRouter());

// Mount accounting transaction engine
app.use(createAccountingTransactionRouter());

// Mount expense tracking
app.use(createExpenseRouter());

// Mount reports
app.use(createProfitLossReportRouter());
app.use(createCashFlowReportRouter());

// Mount tenant ledger
app.use(createTenantLedgerRouter());

// Mount property financials
app.use(createPropertyFinancialsRouter());

// Mount AI financial assistant
app.use(createAIFinancialAssistantRouter());

// AI rental application screening (owner / agent / manager)
app.use(createLeasingAssistRouter());

// AI post-lease onboarding coordination (owner / agent / manager)
app.use(createLeaseOnboardingAssistRouter());

// AI property listing copywriter (owner / agent / manager / admin)
app.use(createPropertyCopywriterRouter());

// Mount document OCR (OpenAI Vision)
app.use('/api/documents/ocr', strictWriteLimiter);
app.use(createDocumentOcrRouter());

// Support AI chatbot (public + optional auth for role hint)
app.use(createSupportChatRouter());

// Optional: Supabase Database Webhook → POST /api/push/webhook (see .env.example)
app.use('/api/push', createWebPushWebhookRouter());

// Property CRM & sales pipeline (leads, deals, inspections, reminders)
app.use('/api/crm', strictWriteLimiter, createCrmPipelineRouter());

// NL → structured property/rent insights (RBAC: properties.read)
app.use('/api/ai/query', authLikeLimiter);
app.use(createAiAssistantRouter());

// Notification outbox worker (NOTIFICATION_WORKER_SECRET)
app.use(createNotificationSystemRouter());

// Executive analytics (reports.financial | reports.operational)
app.use('/api/analytics/executive', analyticsLimiter);
app.use(createExecutiveAnalyticsRouter());

// Server-side import pipeline (signed upload + job lifecycle)
app.use(createImportPipelineRouter());

// RBAC: Supabase JWT + permission matrix (`config/rbac-permission-matrix.json`)
app.use(createRbacRouter());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'voice-transcription' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  logger.info('server_started', { port, service: 'voice-transcription' });
});

