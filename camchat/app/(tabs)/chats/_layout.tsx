/**
 * Chats Stack Layout
 * Nested navigation for chat list and chat room
 */

import { Stack } from 'expo-router';
import { ColorPalette } from '../../../constants';
import { useColors } from '../../../hooks/useColors';

export default function ChatsLayout() {
  const { colors } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
