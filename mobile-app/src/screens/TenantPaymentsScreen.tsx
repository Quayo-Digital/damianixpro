import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { getAccessToken, signOut } from '../services/auth';
import { fetchTenantPayments, TenantPaymentItem } from '../services/payments';
import { refreshFintechToken } from '../services/fintechAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthContext } from '../state/AuthContext';

type PaymentsStackParamList = {
  TenantPayments: undefined;
  PayRent: undefined;
};

type Props = NativeStackScreenProps<PaymentsStackParamList, 'TenantPayments'>;

export function TenantPaymentsScreen({ navigation }: Props) {
  const { setAuthenticated } = useAuthContext();
  const [items, setItems] = useState<TenantPaymentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No auth session');
      const data = await fetchTenantPayments(accessToken);
      setItems(data);
      // Keep fintech token warm for upcoming landlord/ledger screens.
      await refreshFintechToken();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tenant Payments</Text>
      <View style={styles.row}>
        <Button title="Refresh" onPress={load} />
        <Button title="Pay Rent" onPress={() => navigation.navigate('PayRent')} />
        <Button
          title="Sign Out"
          onPress={async () => {
            await signOut();
            setAuthenticated(false);
          }}
        />
      </View>
      {loading ? <Text>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>#{item.id.slice(0, 8)}</Text>
            <Text style={styles.itemText}>NGN {item.amount}</Text>
            <Text style={styles.itemText}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No payments found.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  itemText: { fontSize: 14 },
  error: { color: '#c00', marginBottom: 8 },
});
