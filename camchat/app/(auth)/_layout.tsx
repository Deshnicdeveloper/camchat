/**
 * Auth Layout
 * Layout for authentication flow screens
 */

import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
