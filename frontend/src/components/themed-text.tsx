import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleConfig } from '@/hooks/useRoleConfig';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

// Tamaños base por tipo (sin escalar). Se usan para calcular el tamaño final.
const baseSizes = {
  small: { fontSize: 14, lineHeight: 20 },
  smallBold: { fontSize: 14, lineHeight: 20 },
  default: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 48, lineHeight: 52 },
  subtitle: { fontSize: 32, lineHeight: 44 },
  link: { fontSize: 14, lineHeight: 30 },
  linkPrimary: { fontSize: 14, lineHeight: 30 },
  code: { fontSize: 12, lineHeight: 18 },
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { fontScale } = useRoleConfig();

  const base = baseSizes[type];
  const scaledSize = {
    fontSize: base.fontSize * fontScale,
    lineHeight: base.lineHeight * fontScale,
  };

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        scaledSize,
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: { fontWeight: 500 },
  smallBold: { fontWeight: 700 },
  default: { fontWeight: 500 },
  title: { fontWeight: 600 },
  subtitle: { fontWeight: 600 },
  link: {},
  linkPrimary: { color: '#3c87f7' },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
  },
});