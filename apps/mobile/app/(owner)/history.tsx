import { DailyReport, formatDate, formatDZD } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { HeaderBar } from '../../src/components/HeaderBar';
import { getAllDailyReports } from '../../src/db/queries';
import { PDFService } from '../../src/services/PDFService';

export default function HistoryScreen() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const rList = await getAllDailyReports();
    setReports(rList);
  };

  const filteredReports = reports.filter((r) => r.date.includes(searchQuery) || searchQuery === '');

  const handleShareReport = async (report: DailyReport) => {
    if (!report.reportPdfUri) {
      Alert.alert('تنبيه', 'لم يتم العثور على ملف PDF مخزن لهذا التقرير');
      return;
    }
    try {
      await PDFService.sharePDF(report.reportPdfUri);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل مشاركة التقرير');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="الأرشيف والسجل التاريخي (18 شهراً)" />

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بتاريخ التقرير (مثال: 2026-08)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{formatDate(item.date, 'ar')}</Text>
              <Text style={styles.netBadge}>الصافي: {formatDZD(item.totalNetAmount, 'ar')}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detail}>مداخيل الخبز: {formatDZD(item.totalBreadRevenue, 'ar')}</Text>
              <Text style={styles.detail}>مداخيل المنتجات: {formatDZD(item.totalExternalRevenue, 'ar')}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailDanger}>المصاريف: {formatDZD(item.totalOtherExpenses, 'ar')}</Text>
              <Text style={styles.detailDanger}>العمال: {formatDZD(item.totalWorkerPayments, 'ar')}</Text>
            </View>

            <View style={styles.cardFooter}>
              {item.reportPdfUri && (
                <BakeryButton title="مشاركة التقرير (PDF)" onPress={() => handleShareReport(item)} variant="secondary" style={styles.shareBtn} />
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>لا توجد تقارير يومية مؤرشفة تنطبق على البحث</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  searchBar: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  netBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  detailsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  detail: {
    fontSize: 13,
    color: '#475569'
  },
  detailDanger: {
    fontSize: 13,
    color: '#dc2626'
  },
  cardFooter: {
    marginTop: 8,
    alignItems: 'flex-start'
  },
  shareBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center'
  }
});
