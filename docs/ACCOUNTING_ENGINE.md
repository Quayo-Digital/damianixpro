# DamianixPro Accounting Engine

## Core Idea: Event → Accounting Engine → Journal Entries

Every financial action in DamianixPro automatically generates double-entry accounting records.

```
Event (e.g. tenant pays rent)
    → Accounting Engine (server/accountingEngine.mjs)
        → Journal Entries (journal_entries table)
```

## Event Mappings

| Event                | Debit           | Credit       | Source                            |
| -------------------- | --------------- | ------------ | --------------------------------- |
| **Tenant pays rent** | Bank Account    | Rent Income  | Flutterwave webhook               |
| **Expense recorded** | Expense Account | Bank Account | POST /api/expenses                |
| **Manual income**    | Bank Account    | [Account]    | POST /api/accounting/transactions |
| **Manual expense**   | [Account]       | Bank Account | POST /api/accounting/transactions |

## Implementation

- **`server/accountingEngine.mjs`** – Central module:
  - `recordRentPayment()` – Debit Bank, Credit Rent Income
  - `recordExpense()` – Debit Expense, Credit Bank
  - `recordManualTransaction()` – Debit/Credit based on type
  - `createJournalEntries()` – Low-level double-entry insert

- **Wired to events:**
  - `flutterwavePaymentService.mjs` – Webhook on payment success
  - `expenseService.mjs` – On expense creation
  - `accountingTransactionService.mjs` – On manual transaction

## Adding New Events

To add a new financial event:

1. Add a handler in `accountingEngine.mjs` (e.g. `recordShortletBooking()`).
2. Call it from the event source (webhook, API, etc.).
3. Ensure the account names exist in `chart_of_accounts`.
