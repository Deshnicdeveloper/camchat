/**
 * Root Layout
 * Handles font loading, splash screen, auth state, and navigation setup
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants';
import { useAuthStore } from '../store/authStore';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const { isAuthenticated, isInitialized } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Handle auth-based navigation
  useEffect(() => {
    // Wait for navigation and auth state to be ready
    if (!navigationState?.key || !isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth screens - redirect to main app
      router.replace('/(tabs)/chats');
    } else if (!isAuthenticated && inTabsGroup) {
      // User is not authenticated but trying to access protected screens
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isInitialized, segments, navigationState?.key]);

  // Hide splash screen when fonts are loaded and auth is initialized
  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitialized]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="new-chat"
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="new-group"
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="call/[callId]"
            options={{
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="status/view/[userId]"
            options={{
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="profile/[userId]"
            options={{
              presentation: 'card',
            }}
          />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
