/**
 * Minimal API smoke tests for fintech-api (manual / CI with secrets).
 *
 * Usage:
 *   BASE_URL=http://localhost:4101/api \
 *   JWT_TENANT=<HS256 token with sub + role tenant> \
 *   JWT_LANDLORD=<token role landlord> \
 *   JWT_ADMIN=<token role admin> \
 *   node qa/smoke-api.mjs
 *
 * Optional:
 *   LANDLORD_USER_ID=<uuid> — for debit-rent (must exist in FINTECH_USER_TABLE, default fintech_auth_users)
 *   SKIP_ESCROW=1 — skip escrow create/fund if commission accounts not seeded
 */
import { randomUUID } from 'node:crypto';

const base = (process.env.BASE_URL || 'http://localhost:4101/api').replace(/\/$/, '');
const tenantJwt = process.env.JWT_TENANT || '';
const landlordJwt = process.env.JWT_LANDLORD || '';
const adminJwt = process.env.JWT_ADMIN || '';
const landlordUserId = process.env.LANDLORD_USER_ID || '';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function req(method, path, token, body) {
  const url = `${base}${path}`;
  const r = await fetch(url, {
    method,
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: r.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results = [];

  if (!tenantJwt || !landlordJwt) {
    console.error('Set JWT_TENANT and JWT_LANDLORD');
    process.exit(1);
  }

  // Wallet: ensure + me (tenant)
  {
    const a = await req('POST', '/wallets/ensure', tenantJwt, { currencyCode: 'NGN' });
    assert(a.status === 200 || a.status === 201, `ensure wallet: ${a.status} ${JSON.stringify(a.json)}`);
    const b = await req('GET', '/wallets/me?currency=NGN', tenantJwt);
    assert(b.status === 200, `wallet me: ${b.status}`);
    results.push(['wallet_me_tenant', b.json?.balanceMinor != null]);
  }

  // Double idempotency: same debit-rent key twice (second should be duplicate / same journal)
  if (landlordUserId) {
    const key = `qa-debit-rent-${randomUUID()}`;
    const body = {
      landlordUserId,
      amountMinor: '100',
      idempotencyKey: key,
      currencyCode: 'NGN',
    };
    const r1 = await req('POST', '/wallets/debit-rent', tenantJwt, body);
    const r2 = await req('POST', '/wallets/debit-rent', tenantJwt, body);
    assert(r1.status === 200 || r1.status === 201, `debit-rent first: ${r1.status}`);
    assert(r2.status === 200 || r2.status === 201, `debit-rent retry: ${r2.status}`);
    const dup1 = r1.json?.duplicate === true || r1.json?.duplicate === false;
    const dup2 = r2.json?.duplicate === true;
    assert(dup1, 'first response has duplicate flag');
    assert(dup2, 'second response should be duplicate: true');
    results.push(['double_debit_rent_idempotent', dup2]);
  } else {
    results.push(['double_debit_rent_idempotent', 'skipped_set_LANDLORD_USER_ID']);
  }

  // Role: tenant cannot list withdrawals
  {
    const w = await req('GET', '/withdrawals', tenantJwt);
    assert(w.status === 403, `tenant withdrawals should 403, got ${w.status}`);
    results.push(['tenant_blocked_withdrawals', w.status === 403]);
  }

  // Landlord can list withdrawals (may be empty)
  {
    const w = await req('GET', '/withdrawals', landlordJwt);
    assert(w.status === 200, `landlord list withdrawals: ${w.status}`);
    results.push(['landlord_list_withdrawals', true]);
  }

  // Webhook: wrong hash → 401 (no JWT)
  {
    const url = `${base}/webhooks/flutterwave`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'verif-hash': 'invalid' },
      body: JSON.stringify({ event: 'charge.completed', data: { id: 1 } }),
    });
    const expect401 = r.status === 401 || r.status === 503;
    results.push(['webhook_rejects_bad_hash', expect401]);
  }

  // Admin payout route (403 without admin)
  if (adminJwt) {
    const p = await req('POST', '/payments/flutterwave/payout', tenantJwt, {
      account_bank: '044',
      account_number: '0000000000',
      amount: 100,
      currency: 'NGN',
      reference: `qa-${randomUUID()}`,
      narration: 'qa',
    });
    results.push(['payout_forbidden_for_tenant', p.status === 403]);
  }

  for (const [name, ok] of results) {
    console.log(ok === true ? `PASS\t${name}` : `FAIL/SKIP\t${name}\t${ok}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
