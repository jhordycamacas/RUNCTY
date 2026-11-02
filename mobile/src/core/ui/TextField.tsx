import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** React 19 passes refs as a regular prop (lets react-hook-form focus the field). */
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  error,
  hint,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: TextFieldProps) {
  const { colors, radii, spacing, typography, fontScale } = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primaryText : colors.border;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" weight="medium" style={{ marginBottom: spacing.xs }}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          allowFontScaling
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text, fontSize: typography.sizes.body * fontScale }, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
          >
            <AppText variant="label" weight="bold" color="primaryText">
              {hidden ? 'Mostrar' : 'Ocultar'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText
          variant="label"
          color="danger"
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="label" color="textMuted" style={{ marginTop: spacing.xs }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: MIN_TOUCH_TARGET,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  toggle: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
