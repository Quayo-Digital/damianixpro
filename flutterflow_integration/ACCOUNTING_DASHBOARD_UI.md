# DamianixPro Accounting Dashboard - FlutterFlow UI Guide

Clean fintech-style Accounting Dashboard for DamianixPro. Mobile responsive.

---

## API Endpoints

| Method | Endpoint                         | Description                                                                |
| ------ | -------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/api/reports/profit-loss`       | P&L: total_income, total_expenses, net_profit. Query: date_from, date_to   |
| GET    | `/api/reports/cash-flow`         | Cash flow: opening_balance, money_in, money_out, closing_balance           |
| GET    | `/api/properties/:id/financials` | Property-level P&L. Query: date_from, date_to                              |
| GET    | `/api/accounting/transactions`   | Recent transactions. Query: type, account, property_id, date_from, date_to |
| GET    | `/api/expenses`                  | Expenses list. Query: category, property_id, date_from, date_to            |

---

## Page Structure

### 1. Page State Variables

| Variable             | Type    | Default                       |
| -------------------- | ------- | ----------------------------- |
| `isLoading`          | bool    | false                         |
| `profitLoss`         | Map     | {}                            |
| `cashFlow`           | Map     | {}                            |
| `transactions`       | List    | []                            |
| `expenses`           | List    | []                            |
| `dateFrom`           | String  | ""                            |
| `dateTo`             | String  | ""                            |
| `selectedPropertyId` | String? | null                          |
| `properties`         | List    | []                            |
| `apiBaseUrl`         | String  | "https://api.damianixpro.com" |

---

## 2. Layout (Mobile Responsive)

```
┌─────────────────────────────────────────────┐
│  Accounting Dashboard                         │  ← AppBar
├─────────────────────────────────────────────┤
│  [ Date From ] [ Date To ] [ Property ▼ ]    │  ← Filters
│  [ Apply ]                                    │
├─────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │ Total   │ │ Total   │ │ Net     │          │  ← Summary Cards
│ │ Income  │ │ Expenses│ │ Profit  │          │
│ │ ₦12M    │ │ ₦3M     │ │ ₦9M     │          │
│ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────┤
│  Income vs Expenses                           │  ← Chart 1
│  ████████████ Income  ████ Expenses          │
├─────────────────────────────────────────────┤
│  Monthly Trends                               │  ← Chart 2
│  [Bar chart - income/expense by month]        │
├─────────────────────────────────────────────┤
│  Recent Transactions                          │
│  ┌─────────────────────────────────────────┐ │  ← Table
│  │ Rent Income    +₦1,200,000   Mar 15     │ │
│  │ Maintenance   -₦50,000      Mar 10     │ │
│  └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Expenses                                     │
│  ┌─────────────────────────────────────────┐ │  ← Table
│  │ Maintenance  ₦50,000  Fix plumbing      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### Summary Cards (3 cards)

- **Total Income** – `profitLoss['total_income']` – Green (#059669)
- **Total Expenses** – `profitLoss['total_expenses']` – Red (#DC2626)
- **Net Profit** – `profitLoss['net_profit'] ?? profitLoss['profit']` – Blue (#2563EB)

Use `AccountingSummaryCard` widget with `type`: 'income' | 'expense' | 'profit'.

### Charts

- **Income vs Expenses** – `IncomeVsExpenseChart` with `income` and `expenses` from profitLoss
- **Monthly Trends** – `MonthlyTrendsChart` with `monthlyData` (build from transactions grouped by month, or leave empty)

### Tables

- **Recent Transactions** – `AccountingTransactionRow` for each item in `transactions`
  - type, amount, account, date, description
- **Expenses** – `AccountingExpenseRow` for each item in `expenses`
  - amount, category, date, description

### Filters

- **Date From** – TextField (YYYY-MM-DD)
- **Date To** – TextField (YYYY-MM-DD)
- **Property** – Dropdown (All Properties + list from `properties`)
- **Apply** – Fetches data with filters

Use `AccountingFilterBar` or build with standard FlutterFlow components.

---

## 4. Action Flows

### On Page Load

1. Set `isLoading` = true
2. Call `fetchAccountingDashboard(apiBaseUrl, selectedPropertyId, dateFrom, dateTo)`
3. Set `profitLoss` = result['profit_loss'], `cashFlow` = result['cash_flow']
4. Set `transactions` = result['transactions'], `expenses` = result['expenses']
5. Set `isLoading` = false

### On Filter Apply

1. Set `isLoading` = true
2. Call `fetchAccountingDashboard` with current filters
3. Update state
4. Set `isLoading` = false

### On Property Change

1. Update `selectedPropertyId`
2. Call `fetchAccountingDashboard` (or trigger Apply)

---

## 5. Custom Actions (accounting_dashboard_actions.dart)

| Action                        | Inputs                                                       | Returns                                              |
| ----------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `fetchProfitLoss`             | apiBaseUrl, dateFrom?, dateTo?                               | Map?                                                 |
| `fetchCashFlow`               | apiBaseUrl, dateFrom?, dateTo?                               | Map?                                                 |
| `fetchPropertyFinancials`     | apiBaseUrl, propertyId, dateFrom?, dateTo?                   | Map?                                                 |
| `fetchAccountingTransactions` | apiBaseUrl, type?, account?, propertyId?, dateFrom?, dateTo? | List                                                 |
| `fetchExpenses`               | apiBaseUrl, category?, propertyId?, dateFrom?, dateTo?       | List                                                 |
| `fetchAccountingDashboard`    | apiBaseUrl, propertyId?, dateFrom?, dateTo?                  | Map (profit_loss, cash_flow, transactions, expenses) |

---

## 6. Custom Widgets (accounting_dashboard_widget.dart)

| Widget                     | Props                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `AccountingSummaryCard`    | title, value, type ('income'\|'expense'\|'profit')                                                                      |
| `IncomeVsExpenseChart`     | income, expenses                                                                                                        |
| `MonthlyTrendsChart`       | monthlyData: List<{month, income, expenses}>                                                                            |
| `AccountingTransactionRow` | type, amount, account, date, description?, onTap?                                                                       |
| `AccountingExpenseRow`     | amount, category, date, description?, onTap?                                                                            |
| `AccountingFilterBar`      | dateFrom, dateTo, selectedPropertyId?, propertyOptions, onDateFromChanged, onDateToChanged, onPropertyChanged?, onApply |

---

## 7. FlutterFlow Setup

### Add Custom Actions

1. **Custom Code** > **Actions** > **+ Add Action**
2. Create actions from `accounting_dashboard_actions.dart`:
   - `fetchProfitLoss`
   - `fetchCashFlow`
   - `fetchPropertyFinancials`
   - `fetchAccountingTransactions`
   - `fetchExpenses`
   - `fetchAccountingDashboard`

### Add Custom Widgets

1. **Custom Code** > **Widgets** > **+ Add Widget**
2. Add each widget from `accounting_dashboard_widget.dart`:
   - `AccountingSummaryCard`
   - `IncomeVsExpenseChart`
   - `MonthlyTrendsChart`
   - `AccountingTransactionRow`
   - `AccountingExpenseRow`
   - `AccountingFilterBar`

### Dependencies

```yaml
dependencies:
  http: ^1.1.0
```

---

## 8. Design (Fintech Style)

- **Colors:** Emerald (income), Red (expense), Blue (profit)
- **Cards:** White background, 16px radius, subtle shadow
- **Spacing:** 16px padding, 8–12px gaps
- **Typography:** 18sp bold for values, 12sp for labels
- **Mobile:** Single column on small screens, cards stack vertically

---

## 9. Monthly Trends Data

To build `monthlyData` for the chart, group transactions by month:

```dart
// Example: from transactions list
final byMonth = <String, Map<String, double>>{};
for (final t in transactions) {
  final created = t['created_at'] ?? '';
  final month = created.length >= 7 ? created.substring(0, 7) : '';
  if (month.isEmpty) continue;
  byMonth[month] ??= {'income': 0, 'expenses': 0};
  if (t['type'] == 'income') {
    byMonth[month]!['income'] = (byMonth[month]!['income'] ?? 0) + (t['amount'] ?? 0);
  } else {
    byMonth[month]!['expenses'] = (byMonth[month]!['expenses'] ?? 0) + (t['amount'] ?? 0);
  }
}
final monthlyData = byMonth.entries.map((e) => {
  'month': e.key,
  'income': e.value['income'] ?? 0,
  'expenses': e.value['expenses'] ?? 0,
}).toList();
```
