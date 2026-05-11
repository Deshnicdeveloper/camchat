/**
 * Status Stack Layout
 */

import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function StatusLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
