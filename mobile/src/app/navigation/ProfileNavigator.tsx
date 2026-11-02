import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileHomeScreen } from '@/features/account/presentation/screens/ProfileHomeScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  );
}
