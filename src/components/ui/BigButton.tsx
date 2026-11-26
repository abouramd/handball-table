import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { font, paint, RADIUS, TOUCH, textOn } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  /** Secondary line under the label (e.g. what Undo will undo, why something is disabled). */
  sublabel?: string;
  /** Right-aligned value inside the button (e.g. "2 left"). */
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Paint behind the label. */
  color?: string;
  /** Text colour; defaults to the best contrast on `color`. */
  textColor?: string;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'xl';
  align?: 'center' | 'split';
  square?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const HEIGHT = { md: TOUCH, lg: 76, xl: 92 };
const LABEL = { md: 20, lg: 28, xl: 40 };

/** Painted press target. Never smaller than the 64 px touch target. */
export function BigButton({
  label,
  sublabel,
  value,
  icon,
  onPress,
  onLongPress,
  color = paint.band,
  textColor,
  disabled,
  size = 'md',
  align = 'center',
  square,
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  // Disabled keeps its own ink at reduced strength, so a reason like "No timeouts left" stays readable.
  const fg = textColor ?? textOn(color);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [label, value, sublabel].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          backgroundColor: color,
          borderRadius: square ? 0 : RADIUS,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        align === 'split' && styles.split,
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed ? <View style={[StyleSheet.absoluteFill, styles.pressShade, { borderRadius: square ? 0 : RADIUS }]} /> : null}
          <View style={[styles.main, align === 'split' && styles.mainSplit]}>
            {icon ? <Ionicons name={icon} size={LABEL[size] * 0.9} color={fg} /> : null}
            <View style={align === 'split' ? undefined : styles.center}>
              <Text
                style={[align === 'split' ? styles.splitLabel : styles.label, { color: fg }, align !== 'split' && { fontSize: LABEL[size] }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {label}
              </Text>
              {sublabel ? (
                <Text style={[styles.sub, { color: fg }]} numberOfLines={1}>
                  {sublabel}
                </Text>
              ) : null}
            </View>
          </View>
          {value ? (
            <Text style={[styles.value, { color: fg }]} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  split: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pressShade: { backgroundColor: 'rgba(0,0,0,0.18)' },
  main: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainSplit: { flexShrink: 1 },
  center: { alignItems: 'center' },
  label: { fontFamily: font.display, letterSpacing: 1.2, textTransform: 'uppercase' },
  sub: { fontSize: 12, fontWeight: '600', marginTop: 1, opacity: 0.85 },
  // Split rows: the label reads as a label, the value is the number an official glances at.
  splitLabel: { fontSize: 16, fontWeight: '600' },
  value: { fontFamily: font.numeral, fontSize: 26, letterSpacing: 0.5, textTransform: 'uppercase' },
});
