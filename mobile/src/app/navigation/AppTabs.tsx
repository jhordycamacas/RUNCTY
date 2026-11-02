import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MIN_TOUCH_TARGET, useTheme, useTypeface } from '@/core/theme';
import { Icon, type IconName } from '@/core/ui';

import { HomeScreen } from '../screens/HomeScreen';
import { ProfileNavigator, type ProfileStackParamList } from './ProfileNavigator';
import { RoutesNavigator, type RoutesStackParamList } from './RoutesNavigator';

export type AppTabsParamList = {
  Inicio: undefined;
  Rutas: NavigatorScreenParams<RoutesStackParamList> | undefined;
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
  const insets = useSafeAreaInsets();

  const screenOptions = useMemo<BottomTabNavigationOptions>(() => {
    const labelSize = typography.sizes.caption * fontScale;
    // Icon (24) + label + vertical padding. The bottom inset keeps labels above the
    // Android gesture/navigation bar, and the bar stays at least 48dp tall.
    const contentHeight = Math.max(MIN_TOUCH_TARGET, 24 + labelSize * 1.4 + 12);
    return {
      headerShown: false,
      tabBarActiveTintColor: colors.primaryText,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        height: contentHeight + insets.bottom,
        paddingTop: 6,
        paddingBottom: insets.bottom + 6,
      },
      tabBarLabelStyle: { fontSize: labelSize, ...labelTypeface },
    };
  }, [colors, typography, fontScale, labelTypeface, insets.bottom]);

  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="Inicio"
        options={{ tabBarAccessibilityLabel: 'Inicio', tabBarIcon: tabIcon('home-outline', 'home') }}
      >
        {({ navigation }) => (
          <HomeScreen
            onOpenRoutes={() => navigation.navigate('Rutas', { screen: 'RoutesList' })}
            onOpenRoute={(routeId, slotKey) =>
              // initial: false keeps the catalog below the detail, so Atrás returns to it.
              navigation.navigate('Rutas', { screen: 'RouteDetail', params: { routeId, slotKey }, initial: false })
            }
            onOpenProfile={() => navigation.navigate('Perfil', { screen: 'ProfileHome' })}
            onOpenPreferences={() => navigation.navigate('Perfil', { screen: 'Preferences' })}
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen
        name="Rutas"
        options={{ tabBarAccessibilityLabel: 'Rutas', tabBarIcon: tabIcon('map-outline', 'map') }}
      >
        {({ navigation }) => (
          <RoutesNavigator
            onCompleteProfile={() => navigation.navigate('Perfil', { screen: 'EditPersonalData', initial: false })}
          />
        )}
      </Tabs.Screen>
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
