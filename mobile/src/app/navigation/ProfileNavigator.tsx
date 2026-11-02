import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChangePasswordScreen } from '@/features/account/presentation/screens/ChangePasswordScreen';
import { DeleteAccountScreen } from '@/features/account/presentation/screens/DeleteAccountScreen';
import { EditPersonalDataScreen } from '@/features/account/presentation/screens/EditPersonalDataScreen';
import { ProfileHomeScreen } from '@/features/account/presentation/screens/ProfileHomeScreen';
import { SportProfileScreen } from '@/features/sportProfile/presentation/screens/SportProfileScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditPersonalData: undefined;
  SportProfile: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="ProfileHome" options={{ title: 'Perfil' }}>
        {({ navigation }) => (
          <ProfileHomeScreen
            onEditPersonalData={() => navigation.navigate('EditPersonalData')}
            onOpenSportProfile={() => navigation.navigate('SportProfile')}
            onChangePassword={() => navigation.navigate('ChangePassword')}
            onDeleteAccount={() => navigation.navigate('DeleteAccount')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="EditPersonalData" options={{ title: 'Datos personales' }}>
        {({ navigation }) => <EditPersonalDataScreen onDone={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="SportProfile" component={SportProfileScreen} options={{ title: 'Perfil deportivo' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Eliminar cuenta' }} />
    </Stack.Navigator>
  );
}
