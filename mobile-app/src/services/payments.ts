import { env } from '../config/env';

export type TenantPaymentItem = {
  id: string;
  amount: number;
  status: string;
  date: string;
  transaction_id?: string;
};

export type InitRentPaymentResponse = {
  payment_link: string;
  tx_ref: string;
  status: string;
};

export const fetchTenantPayments = async (accessToken: string): Promise<TenantPaymentItem[]> => {
  const res = await fetch(`${env.voiceApiBaseUrl}/api/tenant/payments`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch payments (${res.status})`);
  const json = (await res.json()) as { transactions?: TenantPaymentItem[] };
  return json.transactions ?? [];
};

export const initRentPayment = async (
  tenantId: string,
  amount: number
): Promise<InitRentPaymentResponse> => {
  const res = await fetch(`${env.voiceApiBaseUrl}/api/payments/rent/flutterwave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, amount }),
  });

  if (!res.ok) throw new Error(`Failed to initialize payment (${res.status})`);
  return (await res.json()) as InitRentPaymentResponse;
};

export const verifyPaymentStatus = async (txRef: string): Promise<string> => {
  const res = await fetch(
    `${env.voiceApiBaseUrl}/api/payments/status/${encodeURIComponent(txRef)}`
  );
  if (!res.ok) throw new Error(`Failed to verify payment (${res.status})`);
  const json = (await res.json()) as { status?: string };
  return json.status ?? 'PENDING';
};
