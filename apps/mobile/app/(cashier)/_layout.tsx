import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CashierLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#94a3b8'
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>
        }}
      />
      <Tabs.Screen
        name="bread"
        options={{
          title: 'الخبز (الشاريو)',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🥖</Text>
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'المنتجات الخارجية',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🍕</Text>
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'العمال والمصاريف',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💸</Text>
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'غلق الوردية والتقرير',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text>
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
    height: 60,
    paddingBottom: 8,
    paddingTop: 4
  }
});
