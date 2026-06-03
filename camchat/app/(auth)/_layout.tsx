/**
 * Auth Layout
 * Layout for authentication flow screens
 */

import { Stack } from 'expo-router';
import { ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';

export default function AuthLayout() {
  const { colors } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
