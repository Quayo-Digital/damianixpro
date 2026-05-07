import { Button, StyleSheet, Text, View } from 'react-native';
import { signOut } from '../services/auth';
import { useAuthContext } from '../state/AuthContext';

export function AccountScreen() {
  const { setAuthenticated } = useAuthContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Button
        title="Sign Out"
        onPress={async () => {
          await signOut();
          setAuthenticated(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
});
