import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

/** First letter of the first and last words ("Ana María Torres" → "AT"). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: number;
}

/** Initials on a brand tint. Decorative: the name is always shown next to it. */
export function Avatar({ name, size = 56 }: AvatarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryTint },
      ]}
    >
      <AppText weight="bold" color="primaryText" style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}>
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
