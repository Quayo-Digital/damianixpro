/**
 * Flutterwave dedicated virtual accounts (collections).
 * @see https://developer.flutterwave.com/docs/virtual-account-numbers
 */
import { createFlutterwaveClient, flutterwaveRequest } from '../lib/flutterwaveClient.js';
import { AppError } from '../utils/AppError.js';

/**
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.txRef - Unique reference for this VA creation (idempotency at app layer).
 * @param {string} [input.phoneNumber]
 * @param {string} [input.firstName]
 * @param {string} [input.lastName]
 * @param {string} [input.narration]
 * @param {boolean} [input.isPermanent=true]
 * @param {string} [input.bvn] - When required by your Flutterwave setup / compliance.
 * @param {Record<string, unknown>} [input.meta]
 */
export async function createVirtualAccount(input) {
  const i = /** @type {Record<string, unknown>} */ (input);
  const email = i.email;
  const txRef = i.txRef ?? i.tx_ref;
  const phoneNumber = i.phoneNumber ?? i.phonenumber ?? i.phone_number;
  const firstName = i.firstName ?? i.firstname;
  const lastName = i.lastName ?? i.lastname;
  const narration = i.narration;
  const isPermanent = i.isPermanent ?? i.is_permanent ?? true;
  const bvn = i.bvn;
  const meta = i.meta;

  if (!email || !txRef) {
    throw new AppError('email and txRef are required', 400, 'validation');
  }

  const client = createFlutterwaveClient();

  const body = {
    email: String(email).trim(),
    is_permanent: isPermanent,
    tx_ref: String(txRef).trim(),
    ...(phoneNumber && { phonenumber: String(phoneNumber) }),
    ...(firstName && { firstname: String(firstName) }),
    ...(lastName && { lastname: String(lastName) }),
    ...(narration && { narration: String(narration) }),
    ...(bvn && { bvn: String(bvn) }),
    ...(meta && Object.keys(meta).length > 0 && { meta }),
  };

  const data = await flutterwaveRequest(client, 'POST', '/virtual-account-numbers', body);
  return {
    ok: true,
    reference: txRef,
    raw: data,
    accountNumber: data?.data?.account_number ?? data?.data?.accountNumber,
    bankName: data?.data?.bank_name ?? data?.data?.bankName,
    flwRef: data?.data?.flw_ref ?? data?.data?.flwRef,
    orderRef: data?.data?.order_ref ?? data?.data?.orderRef,
  };
}
