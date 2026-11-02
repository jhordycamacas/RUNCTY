import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { MIN_TOUCH_TARGET } from '@/core/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { ProfileNavigator } from './ProfileNavigator';

export type AppTabsParamList = {
  Inicio: undefined;
  Perfil: undefined;
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        // No icon set yet: label-only tabs, still >= 48 dp tall.
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 16, fontWeight: '700' },
        tabBarItemStyle: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
      }}
    >
      <Tabs.Screen name="Inicio" component={HomeScreen} options={{ tabBarAccessibilityLabel: 'Inicio' }} />
      <Tabs.Screen
        name="Perfil"
        component={ProfileNavigator}
        options={{ headerShown: false, tabBarAccessibilityLabel: 'Perfil' }}
      />
    </Tabs.Navigator>
  );
}
