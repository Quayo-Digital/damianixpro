import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import * as healthController from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/live', healthController.live);
healthRouter.get('/ready', asyncHandler(healthController.ready));
healthRouter.get('/me', optionalAuth, asyncHandler(healthController.me));
