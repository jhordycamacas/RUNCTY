import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '@/features/auth/presentation/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/presentation/screens/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** Screens receive navigation as callbacks so features stay navigation-agnostic. */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {({ navigation }) => (
          <LoginScreen
            onGoToRegister={() => navigation.navigate('Register')}
            onGoToForgotPassword={() => navigation.navigate('ForgotPassword')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register" options={{ title: 'Crear cuenta' }}>
        {({ navigation }) => <RegisterScreen onGoToLogin={() => navigation.popTo('Login')} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" options={{ title: 'Recuperar contraseña' }}>
        {({ navigation }) => <ForgotPasswordScreen onBackToLogin={() => navigation.popTo('Login')} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
