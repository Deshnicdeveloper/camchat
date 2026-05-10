/**
 * Tab Navigator Layout
 * Bottom tab navigation for Chats, Status, Calls, and Settings
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants';
import { t } from '../../lib/i18n';
import { Platform, StyleSheet } from 'react-native';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export default function TabLayout() {
  const getTabBarIcon = (routeName: string) => {
    return ({ focused, color, size }: TabBarIconProps) => {
      let iconName: IoniconsName;

      switch (routeName) {
        case 'chats':
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          break;
        case 'status':
          iconName = focused ? 'radio' : 'radio-outline';
          break;
        case 'calls':
          iconName = focused ? 'call' : 'call-outline';
          break;
        case 'settings':
          iconName = focused ? 'settings' : 'settings-outline';
          break;
        default:
          iconName = 'help-outline';
      }

      return <Ionicons name={iconName} size={size} color={color} />;
    };
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTintColor: Colors.textInverse,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: t('tabs.chats'),
          tabBarIcon: getTabBarIcon('chats'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: t('tabs.status'),
          tabBarIcon: getTabBarIcon('status'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: t('tabs.calls'),
          tabBarIcon: getTabBarIcon('calls'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: getTabBarIcon('settings'),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
  },
  header: {
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
  },
});
