// DamianixPro Accounting Dashboard - FlutterFlow Custom Widgets
// Add to FlutterFlow: Custom Code > Widgets
//
// Clean fintech style, mobile responsive

import 'package:flutter/material.dart';

// Fintech color palette
const _colorIncome = Color(0xFF059669);   // Emerald
const _colorExpense = Color(0xFFDC2626);  // Red
const _colorProfit = Color(0xFF2563EB);    // Blue
const _colorSurface = Color(0xFFF8FAFC);
const _colorCard = Color(0xFFFFFFFF);
const _colorText = Color(0xFF0F172A);
const _colorMuted = Color(0xFF64748B);

String _formatNaira(dynamic value) {
  final n = (value is num) ? value.toDouble() : (double.tryParse(value?.toString() ?? '0') ?? 0);
  final s = n.toInt().toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}

/// Summary card: Total Income | Total Expenses | Net Profit
class AccountingSummaryCard extends StatelessWidget {
  const AccountingSummaryCard({
    super.key,
    required this.title,
    required this.value,
    required this.type,
  });

  final String title;
  final String value;
  final String type; // 'income' | 'expense' | 'profit'

  Color get _accentColor {
    switch (type.toLowerCase()) {
      case 'income': return _colorIncome;
      case 'expense': return _colorExpense;
      case 'profit': return _colorProfit;
      default: return _colorProfit;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _colorCard,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: _colorMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: _accentColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Income vs Expenses bar chart (simple CSS-like bars)
class IncomeVsExpenseChart extends StatelessWidget {
  const IncomeVsExpenseChart({
    super.key,
    required this.income,
    required this.expenses,
  });

  final double income;
  final double expenses;

  @override
  Widget build(BuildContext context) {
    final maxVal = (income > expenses ? income : expenses);
    final max = maxVal > 0 ? maxVal : 1.0;
    final incomeWidth = (income / max).clamp(0.0, 1.0);
    final expenseWidth = (expenses / max).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _colorCard,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Income vs Expenses',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: _colorText,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Income', style: TextStyle(fontSize: 12, color: _colorMuted)),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: incomeWidth,
                        minHeight: 12,
                        backgroundColor: _colorIncome.withOpacity(0.2),
                        valueColor: const AlwaysStoppedAnimation(_colorIncome),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('₦${_formatNaira(income)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _colorIncome)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Expenses', style: TextStyle(fontSize: 12, color: _colorMuted)),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: expenseWidth,
                        minHeight: 12,
                        backgroundColor: _colorExpense.withOpacity(0.2),
                        valueColor: const AlwaysStoppedAnimation(_colorExpense),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('₦${_formatNaira(expenses)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _colorExpense)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Monthly trends placeholder (use fl_chart in FlutterFlow for real chart)
class MonthlyTrendsChart extends StatelessWidget {
  const MonthlyTrendsChart({
    super.key,
    required this.monthlyData,
  });

  final List<Map<String, dynamic>> monthlyData;

  @override
  Widget build(BuildContext context) {
    final data = monthlyData.take(6).toList();
    final maxVal = data.fold<double>(0, (m, e) {
      final v = (e['income'] ?? 0) + (e['expenses'] ?? 0);
      return v > m ? v : m;
    });
    final max = maxVal > 0 ? maxVal : 1.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _colorCard,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Monthly Trends',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: _colorText,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((m) {
                final inc = ((m['income'] ?? 0) as num).toDouble();
                final exp = ((m['expenses'] ?? 0) as num).toDouble();
                final incH = (inc / max).clamp(0.0, 1.0);
                final expH = (exp / max).clamp(0.0, 1.0);
                final label = (m['month'] ?? '').toString();
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 12,
                              height: 80 * incH,
                              decoration: BoxDecoration(
                                color: _colorIncome,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 2),
                            Container(
                              width: 12,
                              height: 80 * expH,
                              decoration: BoxDecoration(
                                color: _colorExpense,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          label.length > 4 ? label.substring(0, 4) : label,
                          style: const TextStyle(fontSize: 10, color: _colorMuted),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

/// Recent transaction row
class AccountingTransactionRow extends StatelessWidget {
  const AccountingTransactionRow({
    super.key,
    required this.type,
    required this.amount,
    required this.account,
    required this.date,
    this.description,
    this.onTap,
  });

  final String type;
  final double amount;
  final String account;
  final String date;
  final String? description;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isIncome = type.toLowerCase() == 'income';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _colorCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: (isIncome ? _colorIncome : _colorExpense).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                color: isIncome ? _colorIncome : _colorExpense,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    account,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: _colorText,
                    ),
                  ),
                  if (description != null && description!.isNotEmpty)
                    Text(
                      description!,
                      style: const TextStyle(fontSize: 12, color: _colorMuted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 2),
                  Text(
                    date,
                    style: const TextStyle(fontSize: 11, color: _colorMuted),
                  ),
                ],
              ),
            ),
            Text(
              '${isIncome ? '+' : '-'}₦${_formatNaira(amount)}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isIncome ? _colorIncome : _colorExpense,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Expense row
class AccountingExpenseRow extends StatelessWidget {
  const AccountingExpenseRow({
    super.key,
    required this.amount,
    required this.category,
    required this.date,
    this.description,
    this.onTap,
  });

  final double amount;
  final String category;
  final String date;
  final String? description;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _colorCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _colorExpense.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.receipt_long, color: _colorExpense, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: _colorText,
                    ),
                  ),
                  if (description != null && description!.isNotEmpty)
                    Text(
                      description!,
                      style: const TextStyle(fontSize: 12, color: _colorMuted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 2),
                  Text(
                    date,
                    style: const TextStyle(fontSize: 11, color: _colorMuted),
                  ),
                ],
              ),
            ),
            Text(
              '₦${_formatNaira(amount)}',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: _colorExpense,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Filter bar: Date range + Property dropdown
class AccountingFilterBar extends StatelessWidget {
  const AccountingFilterBar({
    super.key,
    required this.dateFrom,
    required this.dateTo,
    this.selectedPropertyId,
    this.propertyOptions = const [],
    required this.onDateFromChanged,
    required this.onDateToChanged,
    this.onPropertyChanged,
    required this.onApply,
  });

  final String dateFrom;
  final String dateTo;
  final String? selectedPropertyId;
  final List<Map<String, dynamic>> propertyOptions;
  final ValueChanged<String> onDateFromChanged;
  final ValueChanged<String> onDateToChanged;
  final ValueChanged<String?>? onPropertyChanged;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _colorCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Filters', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _colorText)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: dateFrom,
                  decoration: const InputDecoration(
                    labelText: 'From',
                    hintText: 'YYYY-MM-DD',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: onDateFromChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  initialValue: dateTo,
                  decoration: const InputDecoration(
                    labelText: 'To',
                    hintText: 'YYYY-MM-DD',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: onDateToChanged,
                ),
              ),
            ],
          ),
          if (propertyOptions.isNotEmpty && onPropertyChanged != null) ...[
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Property',
                isDense: true,
                border: OutlineInputBorder(),
              ),
              value: selectedPropertyId,
              items: [
                const DropdownMenuItem(value: null, child: Text('All Properties')),
                ...propertyOptions.map((p) => DropdownMenuItem(
                  value: p['id']?.toString(),
                  child: Text(p['title'] ?? p['name'] ?? 'Property'),
                )),
              ],
              onChanged: onPropertyChanged,
            ),
          ],
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onApply,
            style: FilledButton.styleFrom(
              backgroundColor: _colorProfit,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }
}
