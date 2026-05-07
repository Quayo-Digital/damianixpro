import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../screens/SignInScreen';
import { TenantPaymentsScreen } from '../screens/TenantPaymentsScreen';
import { PayRentScreen } from '../screens/PayRentScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { useAuthContext } from '../state/AuthContext';

type PaymentsStackParamList = {
  TenantPayments: undefined;
  PayRent: undefined;
};

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PaymentsStack = createNativeStackNavigator<PaymentsStackParamList>();

function TenantPaymentsStackNavigator() {
  return (
    <PaymentsStack.Navigator>
      <PaymentsStack.Screen
        name="TenantPayments"
        component={TenantPaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <PaymentsStack.Screen
        name="PayRent"
        component={PayRentScreen}
        options={{ title: 'Pay Rent' }}
      />
    </PaymentsStack.Navigator>
  );
}

function TenantTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="TenantPaymentsTab"
        component={TenantPaymentsStackNavigator}
        options={{ title: 'Payments', headerShown: false }}
      />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuthContext();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="AuthSignIn" component={SignInScreen} />
        ) : (
          <RootStack.Screen name="TenantApp" component={TenantTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
