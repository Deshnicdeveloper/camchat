import { useMemo } from 'react';
/**
 * App Index
 * Entry point that redirects to the appropriate screen based on auth state
 */

import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { ColorPalette } from '../constants';
import { useColors } from '../hooks/useColors';

export default function Index() {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Show loading while auth state is being determined
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
