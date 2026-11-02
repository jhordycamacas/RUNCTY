import { Image, StyleSheet } from 'react-native';

import logo from '../../../assets/splash-icon.png';

export interface BrandMarkProps {
  size?: number;
}

/** RUNCTY logo (red pin with a runner). Decorative: the app name is shown next to it. */
export function BrandMark({ size = 72 }: BrandMarkProps) {
  return (
    <Image
      source={logo}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      style={[styles.image, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
