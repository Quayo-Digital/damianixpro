import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getAccessToken } from './src/services/auth';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/state/AuthContext';

export default function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const token = await getAccessToken();
      if (token) setAuthenticated(true);
    };
    void hydrate();
  }, []);

  return (
    <AuthProvider value={{ isAuthenticated, setAuthenticated }}>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
