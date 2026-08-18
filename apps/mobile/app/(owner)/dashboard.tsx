import { formatDZD, Shift } from '@bakery/core';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderBar } from '../../src/components/HeaderBar';
import { getAllShifts } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function OwnerDashboard() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const shifts = await getAllShifts(10);
    setRecentShifts(shifts);
  };

  const totalTodayBreadRev = recentShifts.reduce((sum, s) => sum + (s.totalBreadRevenue || 0), 0);
  const totalTodayExtRev = recentShifts.reduce((sum, s) => sum + (s.totalExternalRevenue || 0), 0);
  const totalExpenses = recentShifts.reduce((sum, s) => sum + (s.totalWorkerPayments || 0) + (s.totalOtherExpenses || 0), 0);
  const totalNetProfit = recentShifts.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const totalCashDiff = recentShifts.reduce((sum, s) => sum + (s.cashDifference || 0), 0);

  const handleLogout = () => {
    setCurrentUser(null);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="لوحة المالِك (Owner Dashboard)" onLogout={handleLogout} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Total Financial Summary Cards */}
        <Text style={styles.sectionHeader}>ملخص النشاط التجاري العام:</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#1e293b' }]}>
            <Text style={styles.kpiTitle}>صافي الأرباح العام</Text>
            <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{formatDZD(totalNetProfit, 'ar')}</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCardHalf}>
              <Text style={styles.kpiTitleSub}>مداخيل الخبز</Text>
              <Text style={styles.kpiValSub}>{formatDZD(totalTodayBreadRev, 'ar')}</Text>
            </View>
            <View style={styles.kpiCardHalf}>
              <Text style={styles.kpiTitleSub}>مداخيل الكسرة والمنتجات</Text>
              <Text style={styles.kpiValSub}>{formatDZD(totalTodayExtRev, 'ar')}</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCardHalf}>
              <Text style={styles.kpiTitleSub}>إجمالي المصاريف والعمال</Text>
              <Text style={[styles.kpiValSub, { color: '#dc2626' }]}>- {formatDZD(totalExpenses, 'ar')}</Text>
            </View>
            <View style={styles.kpiCardHalf}>
              <Text style={styles.kpiTitleSub}>فروق الصندوق (الأقاس)</Text>
              <Text style={[styles.kpiValSub, { color: totalCashDiff >= 0 ? '#16a34a' : '#dc2626' }]}>
                {formatDZD(totalCashDiff, 'ar')}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Shifts Log */}
        <Text style={styles.sectionHeader}>آخر الورديات المُسجلة:</Text>
        {recentShifts.map((s) => (
          <View key={s.id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftDate}>
                {s.date} - {s.shiftType === 'MORNING' ? 'وردية صباحية' : 'وردية مسائية'}
              </Text>
              <View style={[styles.statusTag, s.status === 'OPEN' ? styles.statusOpen : styles.statusClosed]}>
                <Text style={styles.statusText}>{s.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}</Text>
              </View>
            </View>

            <View style={styles.shiftDetails}>
              <Text style={styles.detailText}>الصافي: {formatDZD(s.netAmount || 0, 'ar')}</Text>
              <Text style={styles.detailText}>المستلم فعلياً: {formatDZD(s.actualCashHanded || 0, 'ar')}</Text>
              <Text style={[styles.detailText, { color: (s.cashDifference || 0) >= 0 ? '#16a34a' : '#dc2626' }]}>
                الفرق: {formatDZD(s.cashDifference || 0, 'ar')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8
  },
  kpiGrid: {
    marginBottom: 16
  },
  kpiCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10
  },
  kpiTitle: {
    fontSize: 13,
    color: '#94a3b8'
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  kpiCardHalf: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-end'
  },
  kpiTitleSub: {
    fontSize: 12,
    color: '#64748b'
  },
  kpiValSub: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4
  },
  shiftCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  shiftHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusOpen: {
    backgroundColor: '#fef3c7'
  },
  statusClosed: {
    backgroundColor: '#dcfce7'
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  shiftDetails: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between'
  },
  detailText: {
    fontSize: 12,
    color: '#475569'
  }
});
