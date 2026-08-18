import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getDatabase } from '../src/db/database';
import { useAppStore } from '../src/store/useAppStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { loadInitialData } = useAppStore();

  useEffect(() => {
    async function prepare() {
      try {
        await getDatabase();
        await loadInitialData();
        setDbReady(true);
      } catch (e: any) {
        console.error('Failed to initialize database:', e);
        setErrorMsg(e.message || String(e));
        // Still set ready to allow UI to render fallback data
        setDbReady(true);
      }
    }
    prepare();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d97706" />
        <Text style={styles.loadingText}>جاري تحميل قاعدة البيانات المحلية...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#1e293b" />
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>تنبيه النظام: {errorMsg}</Text>
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' }
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(cashier)" />
        <Stack.Screen name="(owner)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16
  },
  errorBanner: {
    backgroundColor: '#dc2626',
    padding: 10,
    alignItems: 'center'
  },
  errorBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
