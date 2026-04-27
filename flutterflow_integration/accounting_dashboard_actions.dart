// DamianixPro Accounting Dashboard - FlutterFlow Custom Actions
// Add to FlutterFlow: Custom Code > Actions
//
// Dependencies: http: ^1.1.0

import 'dart:convert';
import 'package:http/http.dart' as http;

String _base(String url) => url.replaceAll(RegExp(r'/$'), '');

/// Fetch Profit & Loss report.
/// Returns { total_income, total_expenses, net_profit }
Future<Map<String, dynamic>?> fetchProfitLoss({
  required String apiBaseUrl,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final params = <String, String>{};
    if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

    final uri = Uri.parse('${_base(apiBaseUrl)}/api/reports/profit-loss')
        .replace(queryParameters: params.isNotEmpty ? params : null);

    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/// Fetch Cash Flow report.
/// Returns { opening_balance, money_in, money_out, closing_balance }
Future<Map<String, dynamic>?> fetchCashFlow({
  required String apiBaseUrl,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final params = <String, String>{};
    if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

    final uri = Uri.parse('${_base(apiBaseUrl)}/api/reports/cash-flow')
        .replace(queryParameters: params.isNotEmpty ? params : null);

    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/// Fetch Property Financials (property-level P&L).
/// Returns { total_income, total_expenses, profit }
Future<Map<String, dynamic>?> fetchPropertyFinancials({
  required String apiBaseUrl,
  required String propertyId,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final params = <String, String>{};
    if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

    final encodedId = Uri.encodeComponent(propertyId);
    final uri = Uri.parse('${_base(apiBaseUrl)}/api/properties/$encodedId/financials')
        .replace(queryParameters: params.isNotEmpty ? params : null);

    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/// Fetch recent accounting transactions.
/// Returns List<Map> with id, type, amount, account, description, property_id, tenant_id, created_at
Future<List<dynamic>> fetchAccountingTransactions({
  required String apiBaseUrl,
  String? type,
  String? account,
  String? propertyId,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final params = <String, String>{};
    if (type != null && type.isNotEmpty) params['type'] = type;
    if (account != null && account.isNotEmpty) params['account'] = account;
    if (propertyId != null && propertyId.isNotEmpty) params['property_id'] = propertyId;
    if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

    final uri = Uri.parse('$_base(apiBaseUrl)/api/accounting/transactions')
        .replace(queryParameters: params.isNotEmpty ? params : null);

    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body);
      return list is List ? list : [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

/// Fetch expenses list.
/// Returns List<Map> with id, amount, category, property_id, description, created_at
Future<List<dynamic>> fetchExpenses({
  required String apiBaseUrl,
  String? category,
  String? propertyId,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final params = <String, String>{};
    if (category != null && category.isNotEmpty) params['category'] = category;
    if (propertyId != null && propertyId.isNotEmpty) params['property_id'] = propertyId;
    if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

    final uri = Uri.parse('${_base(apiBaseUrl)}/api/expenses')
        .replace(queryParameters: params.isNotEmpty ? params : null);

    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body);
      return list is List ? list : [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

/// Fetch full accounting dashboard data (profit-loss + transactions + expenses).
/// Use when propertyId is null for platform-wide, or pass propertyId for property-level.
Future<Map<String, dynamic>> fetchAccountingDashboard({
  required String apiBaseUrl,
  String? propertyId,
  String? dateFrom,
  String? dateTo,
}) async {
  final params = <String, String>{};
  if (dateFrom != null && dateFrom.isNotEmpty) params['date_from'] = dateFrom;
  if (dateTo != null && dateTo.isNotEmpty) params['date_to'] = dateTo;

  Map<String, dynamic>? profitLoss;
  Map<String, dynamic>? cashFlow;
  List<dynamic> transactions = [];
  List<dynamic> expenses = [];

  if (propertyId != null && propertyId.isNotEmpty) {
    profitLoss = await fetchPropertyFinancials(
      apiBaseUrl: apiBaseUrl,
      propertyId: propertyId,
      dateFrom: dateFrom,
      dateTo: dateTo,
    );
  } else {
    profitLoss = await fetchProfitLoss(
      apiBaseUrl: apiBaseUrl,
      dateFrom: dateFrom,
      dateTo: dateTo,
    );
  }

  cashFlow = await fetchCashFlow(
    apiBaseUrl: apiBaseUrl,
    dateFrom: dateFrom,
    dateTo: dateTo,
  );

  transactions = await fetchAccountingTransactions(
    apiBaseUrl: apiBaseUrl,
    propertyId: propertyId,
    dateFrom: dateFrom,
    dateTo: dateTo,
  );

  expenses = await fetchExpenses(
    apiBaseUrl: apiBaseUrl,
    propertyId: propertyId,
    dateFrom: dateFrom,
    dateTo: dateTo,
  );

  return {
    'profit_loss': profitLoss ?? {'total_income': 0.0, 'total_expenses': 0.0, 'net_profit': 0.0},
    'cash_flow': cashFlow ?? {'opening_balance': 0.0, 'money_in': 0.0, 'money_out': 0.0, 'closing_balance': 0.0},
    'transactions': transactions,
    'expenses': expenses,
  };
}
