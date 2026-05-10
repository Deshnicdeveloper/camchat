/**
 * CamChat Typography System
 * Uses Inter font family for clean, readable text
 */

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type FontFamilyKeys = keyof typeof Typography.fontFamily;
export type FontSizeKeys = keyof typeof Typography.size;
export type LineHeightKeys = keyof typeof Typography.lineHeight;

export default Typography;
