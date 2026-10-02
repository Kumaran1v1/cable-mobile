import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CollectionScreen } from '../screens/collection/CollectionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const bottomPadding = Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomPadding;

  const initials = (user?.name || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18, color }}>📊</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CollectionTab"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'Collections',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18, color }}>💳</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'You',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.avatarTabBox,
                {
                  borderColor: focused ? colors.primary : 'transparent',
                  backgroundColor: colors.primary,
                },
              ]}>
              <Text style={styles.avatarTabText}>{initials}</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  tabIconBoxActive: {
    transform: [{ scale: 1.1 }],
  },
  avatarTabBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarTabText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default MainTabs;
