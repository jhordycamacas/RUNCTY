import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useMemo } from 'react';

import { MIN_TOUCH_TARGET, useTheme, useTypeface } from '@/core/theme';
import { Icon, type IconName } from '@/core/ui';

import { HomeScreen } from '../screens/HomeScreen';
import { RoutesPlaceholderScreen } from '../screens/RoutesPlaceholderScreen';
import { ProfileNavigator, type ProfileStackParamList } from './ProfileNavigator';

export type AppTabsParamList = {
  Inicio: undefined;
  Rutas: undefined;
  Perfil: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();

/** Outline icon at rest, filled when the tab is focused. */
function tabIcon(outline: IconName, filled: IconName): BottomTabNavigationOptions['tabBarIcon'] {
  return function TabIcon({ focused, size }) {
    return (
      <Icon name={focused ? filled : outline} size={size} color={focused ? 'primaryText' : 'textMuted'} />
    );
  };
}

export function AppTabs() {
  const { colors, typography, fontScale } = useTheme();
  const labelTypeface = useTypeface('semibold');

  const screenOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primaryText,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: typography.sizes.caption * fontScale, ...labelTypeface },
      tabBarItemStyle: { minHeight: MIN_TOUCH_TARGET },
    }),
    [colors, typography, fontScale, labelTypeface],
  );

  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="Inicio"
        options={{ tabBarAccessibilityLabel: 'Inicio', tabBarIcon: tabIcon('home-outline', 'home') }}
      >
        {({ navigation }) => (
          <HomeScreen
            onOpenRoutes={() => navigation.navigate('Rutas')}
            onOpenProfile={() => navigation.navigate('Perfil', { screen: 'ProfileHome' })}
            onOpenPreferences={() => navigation.navigate('Perfil', { screen: 'Preferences' })}
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen
        name="Rutas"
        component={RoutesPlaceholderScreen}
        options={{ tabBarAccessibilityLabel: 'Rutas', tabBarIcon: tabIcon('map-outline', 'map') }}
      />
      <Tabs.Screen
        name="Perfil"
        component={ProfileNavigator}
        options={{
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: tabIcon('person-circle-outline', 'person-circle'),
        }}
      />
    </Tabs.Navigator>
  );
}
