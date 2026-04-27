/**
 * Unified Payment Service - Main Export
 * Single entry point for all payment operations
 */

export * from './types';
export * from './UnifiedPaymentService';
export * from './providers/FlutterwaveProvider';
export * from './providers/BankTransferProvider';
export * from './mutations';

// Re-export for convenience
export { getUnifiedPaymentService } from './UnifiedPaymentService';
