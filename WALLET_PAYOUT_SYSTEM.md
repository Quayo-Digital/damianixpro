# Wallet & Payout System Documentation

Complete guide to the short-let wallet and payout system.

## Overview

The wallet system manages owner earnings from short-let bookings:
- **Pending Balance**: Funds held until checkout clearance period (24 hours)
- **Available Balance**: Funds ready for payout
- **Total Earned**: Lifetime earnings
- **Total Paid Out**: Lifetime payouts

## Wallet Flow

### 1. Booking Payment → Pending Balance

When a guest pays for a booking:
1. Payment is processed via Paystack
2. Platform commission is deducted (default 10%)
3. Owner's payout amount is added to **pending_balance**
4. Funds remain pending until checkout clearance

### 2. Checkout Clearance → Available Balance

After checkout (24-hour clearance period):
1. Funds move from **pending_balance** to **balance**
2. Owner can now request payout
3. Automatic release via scheduled function

### 3. Payout Request → Bank Transfer

Owner requests payout:
1. KYC verification check
2. Wallet balance validation
3. Paystack transfer recipient creation/retrieval
4. Funds debited from wallet
5. Paystack transfer initiated
6. Funds sent to owner's bank account

## API Usage

### Get Wallet Summary

```typescript
import { getWalletSummary } from '@/services/shortlet/api/wallets';

const summary = await getWalletSummary(userId);
console.log(summary.earningsBreakdown);
// {
//   total_earned: 500000,
//   total_paid_out: 200000,
//   available: 250000,
//   pending: 50000,
//   pending_payouts: 0
// }
```

### Request Payout

```typescript
import { requestPayout } from '@/services/shortlet/api/payouts';

const result = await requestPayout({
  user_id: userId,
  amount: 50000,
  bank_account: {
    account_number: '0123456789',
    bank_code: '058',
    account_name: 'John Doe'
  },
  reason: 'Monthly payout'
});

if (result.success) {
  console.log('Payout initiated:', result.transfer_code);
}
```

### Using React Hook

```typescript
import { useShortletWallet } from '@/hooks/useShortletWallet';

function WalletComponent() {
  const {
    wallet,
    walletSummary,
    transactions,
    requestPayout,
    isLoading
  } = useShortletWallet();

  const handlePayout = async () => {
    const result = await requestPayout(
      50000,
      {
        account_number: '0123456789',
        bank_code: '058',
        account_name: 'John Doe'
      },
      'Monthly payout'
    );
  };

  return (
    <div>
      <h2>Wallet Balance: ₦{walletSummary?.earningsBreakdown.available}</h2>
      <p>Pending: ₦{walletSummary?.earningsBreakdown.pending}</p>
      <button onClick={handlePayout}>Request Payout</button>
    </div>
  );
}
```

## KYC Verification

Owners must complete KYC before requesting payouts:

```typescript
import { submitKYC, getKYCStatus } from '@/services/shortlet/api/kyc';

// Submit KYC
await submitKYC({
  user_id: userId,
  bank_account_number: '0123456789',
  bank_code: '058',
  account_name: 'John Doe',
  bvn: '12345678901', // Optional but recommended
  id_document_url: 'https://...',
  proof_of_address_url: 'https://...'
});

// Check status
const status = await getKYCStatus(userId);
if (status.verified) {
  // Can request payout
}
```

## Scheduled Fund Release

The `release-pending-funds` Edge Function automatically releases funds:

1. **Deploy the function:**
   ```bash
   supabase functions deploy release-pending-funds
   ```

2. **Set up cron job** (via Supabase Dashboard or external scheduler):
   - Run every 6 hours
   - Releases funds for bookings past 24-hour clearance

3. **Manual trigger:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/release-pending-funds \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## Payout Status Tracking

### Check Payout Status

```typescript
import { verifyPayoutStatus } from '@/services/shortlet/api/payouts';

const result = await verifyPayoutStatus(transferCode);
console.log(result.status); // 'success', 'failed', or 'pending'
```

### Get Payout History

```typescript
import { getPayoutHistory } from '@/services/shortlet/api/payouts';

const history = await getPayoutHistory(userId);
// Returns array of payout transactions
```

## Security Features

1. **KYC Verification**: Required before payout
2. **Balance Validation**: Prevents overdraft
3. **Signature Verification**: Paystack webhook verification
4. **Transaction Logging**: All operations logged
5. **Idempotency**: Prevents duplicate payouts

## Error Handling

All functions return structured responses:

```typescript
{
  success: boolean;
  error?: string;
  // ... other fields
}
```

Common errors:
- `Insufficient balance` - Not enough funds in wallet
- `KYC verification required` - Must complete KYC first
- `Recipient creation failed` - Bank account validation failed
- `Transfer initiation failed` - Paystack transfer error

## Testing

### Test Wallet Operations

```typescript
// Create test wallet
const wallet = await getOrCreateWallet(testUserId);

// Credit wallet
await creditWallet(testUserId, 100000, bookingId);

// Check balance
const summary = await getWalletSummary(testUserId);
console.log(summary.wallet.balance); // 100000
```

### Test Payout

1. Ensure KYC is verified
2. Add funds to wallet
3. Request payout with test bank account
4. Verify transfer in Paystack dashboard

## Database Schema

### wallets table
- `user_id` - Owner user ID
- `balance` - Available balance
- `pending_balance` - Funds awaiting clearance
- `total_earned` - Lifetime earnings
- `total_paid_out` - Lifetime payouts

### transactions table
- `type` - 'charge', 'refund', 'payout', 'deposit', 'commission'
- `status` - 'pending', 'success', 'failed', 'refunded'
- `provider_ref` - Paystack reference/transfer code

### profiles table (extended)
- `paystack_recipient_code` - Cached recipient code
- `paystack_recipient_data` - Bank account details
- `kyc_status` - 'none', 'pending', 'verified'
- `kyc_data` - KYC submission data

## Best Practices

1. **Always check balance** before payout request
2. **Verify KYC status** before allowing payouts
3. **Cache recipient codes** to avoid repeated API calls
4. **Monitor payout status** via webhooks
5. **Log all operations** for audit trail
6. **Handle failures gracefully** with rollback

## Next Steps

1. Set up scheduled fund release function
2. Create admin interface for KYC approval
3. Add payout analytics dashboard
4. Implement payout limits and thresholds
5. Add email notifications for payouts

