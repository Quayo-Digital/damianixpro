import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createApiIpRateLimiter } from './middleware/rateLimit.js';
import { onFlutterwaveWebhook } from './payments/webhookHandler.js';
import { handleTransferWebhookEvent } from './services/withdrawalService.js';

onFlutterwaveWebhook(handleTransferWebhookEvent);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }
  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', createApiIpRateLimiter(), apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
