/**
 * Property + voice sidecar (Express). Uses Supabase (service role) as the primary store for these routes.
 * Not the ledger API: see `fintech-api/` and docs/ARCHITECTURE_RUNTIMES.md (Flutterwave webhooks differ).
 */
import 'dotenv/config';
import express from 'express';
import { applyVoiceServerSecurity } from './httpSecurity.mjs';
import { createVoiceRouter } from './voiceTranscriptionService.mjs';
import { createIntentRouter } from './intentDetectionService.mjs';
import { createMaintenanceRouter } from './maintenanceService.mjs';
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
import { createDocumentOcrRouter } from './documentOcrService.mjs';
import { createWebPushWebhookRouter } from './webPushWebhook.mjs';
import { createSupportChatRouter } from './supportChatService.mjs';

const app = express();
const port = process.env.VOICE_SERVER_PORT || 4000;

applyVoiceServerSecurity(app, { jsonLimit: '5mb' });

// Mount voice transcription routes
app.use(createVoiceRouter());

// Mount intent detection routes
app.use(createIntentRouter());

// Mount voice AI assistant (pay rent, check balance)
app.use(createVoiceAssistantRouter());

// Mount maintenance request routes
app.use(createMaintenanceRouter());

// Mount rent balance endpoint
app.use(createRentBalanceRouter());

// Mount property search endpoint
app.use(createPropertySearchRouter());

// Mount viewing scheduling endpoint
app.use(createViewingScheduleRouter());

// Mount rent payment endpoints
app.use(createRentPaymentRouter());

// Mount payment insights (GET /api/payments/insights) - before :id routes
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

// Mount document OCR (OpenAI Vision)
app.use(createDocumentOcrRouter());

// Support AI chatbot (public + optional auth for role hint)
app.use(createSupportChatRouter());

// Optional: Supabase Database Webhook → POST /api/push/webhook (see .env.example)
app.use('/api/push', createWebPushWebhookRouter());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'voice-transcription' });
});

app.listen(port, () => {
  console.log(`DamianixPro voice service listening on http://localhost:${port}`);
});

