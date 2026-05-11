/**
 * Chats Stack Layout
 * Nested navigation for chat list and chat room
 */

import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
