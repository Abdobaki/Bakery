import { formatDZD, ShiftSummaryCalculation } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { CloseShiftModal } from '../../src/components/CloseShiftModal';
import { HeaderBar } from '../../src/components/HeaderBar';
import { PDFService } from '../../src/services/PDFService';
import { ShiftService } from '../../src/services/ShiftService';
import { useAppStore } from '../../src/store/useAppStore';

export default function ShiftSummaryScreen() {
  const { activeShift } = useAppStore();
  const [summary, setSummary] = useState<ShiftSummaryCalculation | null>(null);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [lastPdfUri, setLastPdfUri] = useState<string | null>(null);

  useEffect(() => {
    if (activeShift) {
      loadSummary();
    }
  }, [activeShift]);

  const loadSummary = async () => {
    if (!activeShift) return;
    const calc = await ShiftService.getShiftSummary(activeShift.id, 0);
    setSummary(calc);
  };

  const handleShareReport = async () => {
    if (!summary || !activeShift) return;
    try {
      let pdfUri = lastPdfUri;
      if (!pdfUri) {
        pdfUri = await PDFService.generateShiftReportPDF(activeShift.id, summary);
        setLastPdfUri(pdfUri);
      }
      await PDFService.sharePDF(pdfUri);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل مشاركة التقرير');
    }
  };

  if (!activeShift) {
    return (
      <View style={styles.container}>
        <HeaderBar title="تقرير وغلق الوردية" />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد وردية مفتوحة حالياً لإنشاء تقرير لها</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="تقرير الوردية المباشر وغلق الصندوق" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>الملخص المالي العام للوردية الحالية</Text>

            <View style={styles.row}>
              <Text style={styles.val}>{formatDZD(summary.breadRevenue, 'ar')}</Text>
              <Text style={styles.lbl}>مداخيل الخبز (الشاريوات):</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.val}>{formatDZD(summary.externalRevenue, 'ar')}</Text>
              <Text style={styles.lbl}>مداخيل الكسرة والمنتجات الخارجية:</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.valDanger}>- {formatDZD(summary.externalCost, 'ar')}</Text>
              <Text style={styles.lbl}>تكلفة شراء البضاعة المباعة:</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.valDanger}>- {formatDZD(summary.workerPayments, 'ar')}</Text>
              <Text style={styles.lbl}>مستحقات العمال:</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.valDanger}>- {formatDZD(summary.otherExpenses, 'ar')}</Text>
              <Text style={styles.lbl}>المصاريف التشغيلية الأُخرى:</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.netRow}>
              <Text style={styles.netVal}>{formatDZD(summary.netAmount, 'ar')}</Text>
              <Text style={styles.netLbl}>الصافي المستحق للمخبزة (Net):</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsBox}>
          <BakeryButton title="غلق الوردية وحساب الصندوق (الأقاس)" onPress={() => setCloseModalVisible(true)} variant="danger" />
          <BakeryButton title="معاينة ومشاركة تقرير الوردية (PDF)" onPress={handleShareReport} variant="secondary" style={{ marginTop: 10 }} />
        </View>
      </ScrollView>

      <CloseShiftModal
        visible={closeModalVisible}
        onClose={() => setCloseModalVisible(false)}
        onSuccess={(uri) => {
          if (uri) setLastPdfUri(uri);
        }}
      />
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 14
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  lbl: {
    fontSize: 14,
    color: '#475569'
  },
  val: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  valDanger: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12
  },
  netRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  netLbl: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  netVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  actionsBox: {
    marginTop: 8
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
