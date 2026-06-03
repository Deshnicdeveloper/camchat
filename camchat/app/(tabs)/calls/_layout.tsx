/**
 * Calls Stack Layout
 */

import { Stack } from 'expo-router';
import { ColorPalette } from '../../../constants';
import { useColors } from '../../../hooks/useColors';

export default function CallsLayout() {
  const { colors } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
