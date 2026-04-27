// DamianixPro Payment Dashboard - FlutterFlow Custom Actions
// Add to FlutterFlow: Custom Code > Actions
//
// Dependencies: http: ^1.1.0

import 'dart:convert';
import 'package:http/http.dart' as http;

/// Fetch payment dashboard data (summary + transactions).
/// Returns map with summary (total_revenue, pending_payments, completed_payments) and transactions list.
Future<Map<String, dynamic>?> fetchPaymentDashboard({
  required String apiBaseUrl,
  required String authToken,
  String? statusFilter,
  String? dateFrom,
  String? dateTo,
}) async {
  try {
    final queryParams = <String, String>{};
    if (statusFilter != null && statusFilter.isNotEmpty) queryParams['status'] = statusFilter;
    if (dateFrom != null && dateFrom.isNotEmpty) queryParams['date_from'] = dateFrom;
    if (dateTo != null && dateTo.isNotEmpty) queryParams['date_to'] = dateTo;

    final uri = Uri.parse(
      '${apiBaseUrl.replaceAll(RegExp(r'/$'), '')}/api/tenant/payments',
    ).replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/// Initialize rent payment. Returns map with payment_link and tx_ref, or null on error.
Future<Map<String, dynamic>?> initRentPayment({
  required String apiBaseUrl,
  required String tenantId,
  required double amount,
  String? redirectUrl,
}) async {
  try {
    final url = Uri.parse(
      '${apiBaseUrl.replaceAll(RegExp(r'/$'), '')}/api/payments/rent/flutterwave',
    );
    final body = jsonEncode({
      'tenant_id': tenantId,
      'amount': amount,
      if (redirectUrl != null && redirectUrl.isNotEmpty) 'redirect_url': redirectUrl,
    });

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return {
        'payment_link': data['payment_link'] as String? ?? '',
        'tx_ref': data['tx_ref'] as String? ?? '',
        'status': data['status'] as String? ?? 'pending',
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/// Verify payment status by transaction reference.
Future<String> verifyPaymentStatus({
  required String apiBaseUrl,
  required String txRef,
}) async {
  try {
    final encodedRef = Uri.encodeComponent(txRef);
    final url = Uri.parse(
      '${apiBaseUrl.replaceAll(RegExp(r'/$'), '')}/api/payments/status/$encodedRef',
    );

    final response = await http.get(url);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['status'] as String? ?? 'PENDING';
    }
    return 'error';
  } catch (e) {
    return 'error';
  }
}
