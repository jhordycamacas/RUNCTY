import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme, useTypeface } from '@/core/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Optional leading icon (decorative). */
  icon?: IconName;
  /** React 19 passes refs as a regular prop (lets react-hook-form focus the field). */
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: TextFieldProps) {
  const { colors, radii, spacing, typography, fontScale } = useTheme();
  const typeface = useTypeface('regular');
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primaryText : colors.border;
  const iconColor = error ? 'danger' : focused ? 'primaryText' : 'textMuted';

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
            backgroundColor: focused ? colors.surfaceElevated : colors.surface,
            paddingLeft: spacing.md,
            paddingRight: secureTextEntry ? 0 : spacing.md,
          },
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={iconColor} style={{ marginRight: spacing.sm }} /> : null}
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
          style={[
            styles.input,
            { color: colors.text, fontSize: typography.sizes.body * fontScale },
            typeface,
            style,
          ]}
          {...rest}
        />
        {secureTextEntry ? (
          <IconButton
            icon={hidden ? 'eye-outline' : 'eye-off-outline'}
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            color="textMuted"
            size={22}
            onPress={() => setHidden((v) => !v)}
          />
        ) : null}
      </View>
      {error ? (
        <View style={[styles.messageRow, { marginTop: spacing.xs }]}>
          <Icon name="alert-circle" size={16} color="danger" style={{ marginRight: spacing.xs }} />
          <AppText variant="label" color="danger" accessibilityLiveRegion="polite" style={styles.message}>
            {error}
          </AppText>
        </View>
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
    minHeight: MIN_TOUCH_TARGET + 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
  },
});
