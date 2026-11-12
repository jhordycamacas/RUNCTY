import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouteDetailScreen } from '@/features/routes/presentation/screens/RouteDetailScreen';
import { RoutesListScreen } from '@/features/routes/presentation/screens/RoutesListScreen';

import { useStackScreenOptions } from './navigationStyles';

export type RoutesStackParamList = {
  RoutesList: undefined;
  /** `slotKey` is the time slot window chosen in the catalog ("05:00-07:00"). */
  RouteDetail: { routeId: string; slotKey?: string | null };
};

const Stack = createNativeStackNavigator<RoutesStackParamList>();

export interface RoutesNavigatorProps {
  onCompleteProfile: () => void;
}

export function RoutesNavigator({ onCompleteProfile }: RoutesNavigatorProps) {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* The catalog draws its own large header. */}
      <Stack.Screen name="RoutesList" options={{ title: 'Rutas', headerShown: false }}>
        {({ navigation }) => (
          <RoutesListScreen
            onOpenRoute={(routeId, slotKey) => navigation.navigate('RouteDetail', { routeId, slotKey })}
            onCompleteProfile={onCompleteProfile}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RouteDetail" options={{ title: 'Detalle de la ruta' }}>
        {({ route }) => (
          // key: opening another route from Inicio resets the selected slot.
          <RouteDetailScreen
            key={route.params.routeId}
            routeId={route.params.routeId}
            initialSlotKey={route.params.slotKey}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
