import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#94a3b8'
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'لوحة التحكم',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text>
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'الأرشيف والسجل',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📁</Text>
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'الأسعار والمنتجات',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏷️</Text>
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'العمال',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👷</Text>
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات والنسخ',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f172a',
    borderTopColor: '#1e293b',
    height: 60,
    paddingBottom: 8,
    paddingTop: 4
  }
});
