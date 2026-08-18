import { formatDZD } from '@bakery/core';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { BreadTrayModal } from '../../src/components/BreadTrayModal';
import { ExternalProductModal } from '../../src/components/ExternalProductModal';

import { HeaderBar } from '../../src/components/HeaderBar';
import { ShiftService } from '../../src/services/ShiftService';
import { useAppStore } from '../../src/store/useAppStore';

export default function CashierDashboard() {
  const router = useRouter();
  const { activeShift, currentUser, setActiveShift, setCurrentUser } = useAppStore();
  const [summary, setSummary] = useState<any>(null);
  const [trayModalVisible, setTrayModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);

  useEffect(() => {
    if (activeShift) {
      loadShiftSummary();
    }
  }, [activeShift]);

  const loadShiftSummary = async () => {
    if (!activeShift) return;
    const calc = await ShiftService.getShiftSummary(activeShift.id, 0);
    setSummary(calc);
  };

  const handleOpenShift = (type: 'MORNING' | 'EVENING') => {
    if (!currentUser) return;
    const dateStr = new Date().toISOString().split('T')[0];

    Alert.alert('تأكيد فتح وردية', `هل تريد فتح ${type === 'MORNING' ? 'الوردية الصباحية' : 'الوردية المسائية'} بتاريخ ${dateStr}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'فتح الوردية',
        onPress: async () => {
          try {
            const shiftId = await ShiftService.openNewShift(dateStr, type, currentUser.id);
            setActiveShift({
              id: shiftId,
              uuid: 'new-shift',
              date: dateStr,
              shiftType: type,
              cashierId: currentUser.id,
              status: 'OPEN',
              startedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'PENDING'
            });
            Alert.alert('نجاح', 'تم فتح الوردية بنجاح ونقل المخزون المتبقي تلقائياً');
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل فتح الوردية');
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="لوحة التحكم اليومية" onLogout={handleLogout} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {!activeShift ? (
          <View style={styles.noShiftBox}>
            <Text style={styles.noShiftTitle}>لا توجد وردية مفتوحة حالياً!</Text>
            <Text style={styles.noShiftSub}>يرجى فتح وردية جديدة للبدء في تسجيل الإنتاج والمبيعات</Text>

            <View style={styles.shiftChoiceRow}>
              <BakeryButton
                title="فتح وردية صباحية"
                onPress={() => handleOpenShift('MORNING')}
                variant="primary"
                style={{ flex: 1, marginLeft: 8 }}
              />
              <BakeryButton
                title="فتح وردية مسائية"
                onPress={() => handleOpenShift('EVENING')}
                variant="warning"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Quick Action Grid */}
            <Text style={styles.sectionHeader}>إجراءات سريعة بنقرة واحدة:</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#d97706' }]} onPress={() => setTrayModalVisible(true)}>
                <Text style={styles.actionIcon}>🥖</Text>
                <Text style={styles.actionTitle}>إضافة شاريو خبز</Text>
                <Text style={styles.actionDesc}>تسجيل الخبز الخارج من الفرن</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#2563eb' }]} onPress={() => setProductModalVisible(true)}>
                <Text style={styles.actionIcon}>🍕</Text>
                <Text style={styles.actionTitle}>تسجيل بضاعة / مبيعات</Text>
                <Text style={styles.actionDesc}>كسرة، بيتزا، كرواسون</Text>
              </TouchableOpacity>
            </View>

            {/* Shift KPI Live Metrics */}
            {summary && (
              <View style={styles.kpiContainer}>
                <Text style={styles.sectionHeader}>ملخص الوردية الحالية المباشر:</Text>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>مداخيل الخبز</Text>
                    <Text style={styles.kpiVal}>{formatDZD(summary.breadRevenue, 'ar')}</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>مداخيل المنتجات</Text>
                    <Text style={styles.kpiVal}>{formatDZD(summary.externalRevenue, 'ar')}</Text>
                  </View>
                </View>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>مستحقات العمال</Text>
                    <Text style={styles.kpiValDanger}>- {formatDZD(summary.workerPayments, 'ar')}</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>المصاريف التشغيلية</Text>
                    <Text style={styles.kpiValDanger}>- {formatDZD(summary.otherExpenses, 'ar')}</Text>
                  </View>
                </View>

                <View style={styles.netCard}>
                  <Text style={styles.netLabel}>الصافي المتوقع حالياً في الصندوق:</Text>
                  <Text style={styles.netValue}>{formatDZD(summary.expectedCash, 'ar')}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <BreadTrayModal visible={trayModalVisible} onClose={() => setTrayModalVisible(false)} onSuccess={loadShiftSummary} />
      <ExternalProductModal visible={productModalVisible} onClose={() => setProductModalVisible(false)} onSuccess={loadShiftSummary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scroll: {
    padding: 16
  },
  noShiftBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20
  },
  noShiftTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  noShiftSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20
  },
  shiftChoiceRow: {
    flexDirection: 'row-reverse',
    width: '100%'
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8
  },
  actionGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 3
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 6
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  actionDesc: {
    fontSize: 11,
    color: '#fef3c7',
    textAlign: 'center',
    marginTop: 4
  },
  kpiContainer: {
    marginTop: 8
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-end'
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b'
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4
  },
  kpiValDanger: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 4
  },
  netCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8
  },
  netLabel: {
    fontSize: 13,
    color: '#94a3b8'
  },
  netValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 4
  }
});
