import { formatDZD, ShiftSummaryCalculation } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PDFService } from '../services/PDFService';
import { ShiftService } from '../services/ShiftService';
import { useAppStore } from '../store/useAppStore';
import { BakeryButton } from './BakeryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pdfUri?: string) => void;
}

export const CloseShiftModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { activeShift, currentUser, triggerRefresh } = useAppStore();
  const [summary, setSummary] = useState<ShiftSummaryCalculation | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && activeShift) {
      loadSummary();
    }
  }, [visible, activeShift]);

  const loadSummary = async () => {
    if (!activeShift) return;
    const calc = await ShiftService.getShiftSummary(activeShift.id, parseFloat(actualCash) || 0);
    setSummary(calc);
  };

  const handleCashChange = (val: string) => {
    setActualCash(val);
    if (summary) {
      const parsed = parseFloat(val) || 0;
      const diff = parsed - summary.expectedCash;
      setSummary({ ...summary, actualCash: parsed, cashDifference: diff });
    }
  };

  const handleConfirmClose = async () => {
    if (!activeShift || !currentUser) return;

    const parsedCash = parseFloat(actualCash);
    if (isNaN(parsedCash)) {
      Alert.alert('تنبيه', 'يرجى إدخال المبلغ النقدي المستلم فعلياً من الكاسي');
      return;
    }

    setLoading(true);
    try {
      // 1. Close shift in database and save closing stock
      const finalSummary = await ShiftService.closeShift(activeShift.id, parsedCash, currentUser.id, notes);

      // 2. Generate PDF report automatically
      const pdfUri = await PDFService.generateShiftReportPDF(activeShift.id, finalSummary);

      Alert.alert('تم غلق الوردية بنجاح', `تم حساب الأقاس وتوليد التقرير.\nالفرق النقدي: ${formatDZD(finalSummary.cashDifference, 'ar')}`, [
        {
          text: 'مشاركة التقرير الآن',
          onPress: async () => {
            await PDFService.sharePDF(pdfUri);
            triggerRefresh();
            onSuccess(pdfUri);
            onClose();
          }
        },
        {
          text: 'موافق',
          onPress: () => {
            triggerRefresh();
            onSuccess(pdfUri);
            onClose();
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('خطأ أثناء غلق الوردية', e.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>مراجعة وتأكيد غلق الوردية</Text>
          <Text style={styles.subtitle}>الرجاء مراجعة الحسابات قبل إدخال الصندوق وغلق الوردية</Text>

          <ScrollView style={styles.scroll}>
            {/* Calculation Breakdown Table */}
            <View style={styles.card}>
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
                <Text style={styles.lbl}>مستحقات وتشوفاج العمال:</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.valDanger}>- {formatDZD(summary.otherExpenses, 'ar')}</Text>
                <Text style={styles.lbl}>المصاريف التشغيلية والأخرى:</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.rowHighlight}>
                <Text style={styles.netVal}>{formatDZD(summary.netAmount, 'ar')}</Text>
                <Text style={styles.netLbl}>الصافي المستحق للمخبزة (Net):</Text>
              </View>
            </View>

            {/* Expected vs Actual Cash */}
            <View style={styles.cashBox}>
              <Text style={styles.cashTitle}>المبلغ النقدي الصافي المتوقع استلامه في الصندوق:</Text>
              <Text style={styles.expectedCashText}>{formatDZD(summary.expectedCash, 'ar')}</Text>

              <Text style={styles.label}>المبلغ النقدي المسلَّم فعلياً (الأقاس الفعلي):</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                placeholder="أدخل المبلغ النقدي..."
                value={actualCash}
                onChangeText={handleCashChange}
                textAlign="center"
              />

              {actualCash.length > 0 && (
                <View style={styles.diffRow}>
                  <Text
                    style={[
                      styles.diffVal,
                      summary.cashDifference === 0
                        ? styles.diffZero
                        : summary.cashDifference > 0
                        ? styles.diffPositive
                        : styles.diffNegative
                    ]}
                  >
                    {formatDZD(summary.cashDifference, 'ar')} (
                    {summary.cashDifference === 0 ? 'مطابق تماماً' : summary.cashDifference > 0 ? 'فائض نقد' : 'عجز نقد'})
                  </Text>
                  <Text style={styles.diffLbl}>الفرق النقدي:</Text>
                </View>
              )}
            </View>

            <Text style={styles.label}>ملاحظات ختامية للوردية:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ملاحظات حول الأقاس، عجز، أو أحداث الوردية..."
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
            />
          </ScrollView>

          <View style={styles.actionsRow}>
            <BakeryButton
              title="تأكيد غلق الوردية وتوليد التقرير"
              onPress={handleConfirmClose}
              variant="danger"
              style={{ flex: 1, marginLeft: 8 }}
              disabled={loading}
            />
            <BakeryButton title="إلغاء" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 16
  },
  scroll: {
    marginBottom: 16
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 16
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8
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
    backgroundColor: '#cbd5e1',
    marginVertical: 10
  },
  rowHighlight: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  cashBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 16
  },
  cashTitle: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center'
  },
  expectedCashText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b45309',
    textAlign: 'center',
    marginVertical: 4
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 6
  },
  cashInput: {
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 10,
    fontSize: 26,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#ffffff'
  },
  diffRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  diffLbl: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e'
  },
  diffVal: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  diffZero: {
    color: '#16a34a'
  },
  diffPositive: {
    color: '#2563eb'
  },
  diffNegative: {
    color: '#dc2626'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#ffffff'
  },
  actionsRow: {
    flexDirection: 'row-reverse'
  }
});
