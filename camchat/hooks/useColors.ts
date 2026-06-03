/**
 * useColors Hook
 * Returns the active color palette based on the user's theme preference
 * (light / dark / system). Components build their styles from `colors` so they
 * react to theme changes at runtime.
 */

import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Colors, DarkColors, ColorPalette } from '../constants';
import { useSettingsStore, ThemePreference } from '../store/settingsStore';

interface UseColorsReturn {
  colors: ColorPalette;
  isDark: boolean;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export function useColors(): UseColorsReturn {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme)
    );
    return () => sub.remove();
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  return {
    colors: isDark ? DarkColors : Colors,
    isDark,
    theme,
    setTheme,
  };
}

export default useColors;
