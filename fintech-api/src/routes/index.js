import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { paymentsControllerRouter } from '../controllers/paymentsController.js';
import { walletControllerRouter } from '../controllers/walletController.js';
import { escrowControllerRouter } from '../controllers/escrowController.js';
import { withdrawalControllerRouter } from '../controllers/withdrawalController.js';
import {
  validateFlutterwaveWebhookSignature,
  handleFlutterwaveWebhook,
} from '../payments/webhookHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

apiRouter.post(
  '/webhooks/flutterwave',
  validateFlutterwaveWebhookSignature,
  asyncHandler(handleFlutterwaveWebhook)
);

apiRouter.use('/payments/flutterwave', paymentsControllerRouter);

apiRouter.use('/wallets', walletControllerRouter);

apiRouter.use('/escrow', escrowControllerRouter);

apiRouter.use('/withdrawals', withdrawalControllerRouter);
