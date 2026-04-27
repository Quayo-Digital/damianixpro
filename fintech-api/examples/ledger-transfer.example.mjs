/**
 * Example: run from repo root after configuring fintech-api/.env
 *   node fintech-api/examples/ledger-transfer.example.mjs
 *
 * Prerequisites:
 * - public.accounts rows for two wallets (or use UUIDs from your DB)
 * - ledger_journals / ledger_entries tables + balance triggers (see supabase/sql/fintech_wallet_ledger_schema.sql)
 * - Optional: fintech-api/sql/ledger_transfer_audit.sql
 */
import { pool } from '../src/db/pool.js';
import { transfer, getNetBalanceMinor } from '../src/services/ledgerService.js';

// Replace with real UUIDs from your database
const WALLET_SENDER = '00000000-0000-4000-8000-0000000000a1';
const WALLET_RECIPIENT = '00000000-0000-4000-8000-0000000000a2';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const senderBefore = await getNetBalanceMinor(client, WALLET_SENDER);
    const recipientBefore = await getNetBalanceMinor(client, WALLET_RECIPIENT);
    // eslint-disable-next-line no-console
    console.info('Before:', { senderBefore: senderBefore.toString(), recipientBefore: recipientBefore.toString() });

    const result = await transfer(
      {
        debitAccountId: WALLET_RECIPIENT,
        creditAccountId: WALLET_SENDER,
        amount: 500n,
        idempotencyKey: `demo-transfer-${Date.now()}`,
        currencyCode: 'NGN',
        reference: 'DEMO-REF-1',
        description: 'Demo P2P transfer',
        metadata: { channel: 'example-script' },
      },
      client
    );

    // eslint-disable-next-line no-console
    console.info('Transfer result:', result);

    const senderAfter = await getNetBalanceMinor(client, WALLET_SENDER);
    const recipientAfter = await getNetBalanceMinor(client, WALLET_RECIPIENT);
    // eslint-disable-next-line no-console
    console.info('After:', { senderAfter: senderAfter.toString(), recipientAfter: recipientAfter.toString() });

    await client.query('ROLLBACK'); // remove this line to COMMIT for real writes
    // eslint-disable-next-line no-console
    console.info('Rolled back (example only). Remove ROLLBACK to persist.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
