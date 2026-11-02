/* eslint-env jest */

// Ionicons loads its font through expo-font/expo-asset, which have no asset
// registry under Jest. Render a plain Text carrying the same props instead.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  function Ionicons({ name, size = 12, color, style, ...rest }) {
    return React.createElement(Text, { ...rest, style: [{ fontSize: size, color }, style] }, name);
  }
  Ionicons.glyphMap = {};

  return { __esModule: true, default: Ionicons };
});
