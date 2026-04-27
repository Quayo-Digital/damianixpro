// DamianixPro Rent Payment - FlutterFlow Custom Actions
// Add to FlutterFlow: Custom Code > Actions > Add Action
//
// Dependencies (add in pubspec.yaml):
//   http: ^1.1.0
//   url_launcher: ^6.2.0  (for opening payment link in browser/WebView)

import 'dart:convert';
import 'package:http/http.dart' as http;

/// Initialize rent payment. Returns map with payment_link and tx_ref, or null on error.
/// Use in: Button onPressed -> Call this action -> Store result in page state
Future<Map<String, dynamic>?> initRentPayment({
  required String apiBaseUrl,
  required String tenantId,
  required double amount,
  String? redirectUrl,
}) async {
  try {
    final url = Uri.parse('${apiBaseUrl.replaceAll(RegExp(r'/$'), '')}/api/payments/rent/flutterwave');
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
/// Returns: "PAID", "PENDING", "CANCELLED", or "error"
/// Use after WebView redirect - poll until PAID or CANCELLED (with retry delay)
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
