/**
 * Settings Stack Layout
 */

import { Stack } from 'expo-router';
import { useColors } from '../../../hooks/useColors';

export default function SettingsLayout() {
  const { colors } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="account" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="security" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="storage" />
      <Stack.Screen name="language" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
