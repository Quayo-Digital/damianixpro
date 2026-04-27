/**
 * Request body validation (Zod). On success, replaces `req.body` with parsed output.
 */
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

const uuidString = z.string().uuid();

/** Positive integer minor amount as string (kobo). */
const amountMinorField = z.union([
  z.string().regex(/^\d+$/),
  z.number().int().positive(),
  z.bigint().positive(),
]).transform((v) => (typeof v === 'bigint' ? v.toString() : String(v)));

export const withdrawalRequestSchema = z.object({
  amountMinor: amountMinorField,
  currencyCode: z.string().trim().length(3).optional(),
  destination: z
    .object({
      account_bank: z.string().min(1).optional(),
      accountBank: z.string().min(1).optional(),
      account_number: z.string().min(1).optional(),
      accountNumber: z.string().min(1).optional(),
      beneficiary_name: z.string().max(200).optional(),
      beneficiaryName: z.string().max(200).optional(),
    })
    .refine(
      (d) =>
        Boolean((d.account_bank || d.accountBank) && (d.account_number || d.accountNumber)),
      { message: 'destination must include account_bank and account_number' }
    ),
  clientIdempotencyKey: z.string().trim().min(8).max(256),
  narration: z.string().trim().max(500).optional(),
});

export const debitRentBodySchema = z.object({
  landlordUserId: uuidString,
  amountMinor: amountMinorField,
  idempotencyKey: z.string().trim().min(8).max(256),
  currencyCode: z.string().trim().length(3).optional(),
  leaseId: z.string().max(128).optional(),
  reference: z.string().max(256).optional(),
  description: z.string().max(500).optional(),
});

/**
 * @param {z.ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const r = schema.safeParse(req.body ?? {});
    if (!r.success) {
      return next(
        new AppError('Validation failed', 422, 'validation_error', {
          issues: r.error.flatten(),
        })
      );
    }
    req.body = r.data;
    next();
  };
}
