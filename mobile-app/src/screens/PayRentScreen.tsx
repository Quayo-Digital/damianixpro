import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { initRentPayment, verifyPaymentStatus } from '../services/payments';
import { trackEvent } from '../services/analytics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type PaymentsStackParamList = {
  TenantPayments: undefined;
  PayRent: undefined;
};

type Props = NativeStackScreenProps<PaymentsStackParamList, 'PayRent'>;

export function PayRentScreen({ navigation }: Props) {
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const numericAmount = useMemo(() => Number(amount), [amount]);

  const onInit = async () => {
    try {
      setError(null);
      trackEvent('payment_init_started', { tenant_id: tenantId.trim(), amount: numericAmount });
      const result = await initRentPayment(tenantId.trim(), numericAmount);
      setPaymentLink(result.payment_link);
      setTxRef(result.tx_ref);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize payment');
    }
  };

  const onVerify = async () => {
    if (!txRef) return;
    try {
      setError(null);
      const s = await verifyPaymentStatus(txRef);
      setStatus(s);
      const upper = String(s).toUpperCase();
      if (upper === 'PAID' || upper === 'SUCCESSFUL' || upper === 'SUCCESS') {
        trackEvent('payment_verify_success', { tx_ref: txRef, status: s });
      } else {
        trackEvent('payment_verify_failed', { tx_ref: txRef, status: s });
      }
    } catch (e) {
      trackEvent('payment_verify_failed', { tx_ref: txRef, error: 'request_failed' });
      setError(e instanceof Error ? e.message : 'Failed to verify payment');
    }
  };

  useEffect(() => {
    if (paymentLink) {
      trackEvent('payment_webview_opened', { tx_ref: txRef });
    }
  }, [paymentLink, txRef]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Rent (Sprint 1)</Text>
      <TextInput
        style={styles.input}
        placeholder="Tenant ID"
        value={tenantId}
        onChangeText={setTenantId}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <View style={styles.row}>
        <Button title="Back" onPress={() => navigation.goBack()} />
        <Button title="Init Payment" onPress={onInit} disabled={!tenantId || !numericAmount} />
        <Button title="Verify" onPress={onVerify} disabled={!txRef} />
      </View>
      {txRef ? <Text>tx_ref: {txRef}</Text> : null}
      <Text>Status: {status}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {paymentLink ? <WebView source={{ uri: paymentLink }} style={styles.webview} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  webview: { flex: 1, marginTop: 12, borderWidth: 1, borderColor: '#ddd' },
  error: { color: '#c00', marginTop: 8 },
});
