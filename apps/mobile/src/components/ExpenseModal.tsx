import { EXPENSE_CATEGORIES } from '@bakery/core';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addExpense } from '../db/queries';
import { useAppStore } from '../store/useAppStore';
import { BakeryButton } from './BakeryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { activeShift, currentUser } = useAppStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('OTHER');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!activeShift || !currentUser) {
      Alert.alert('خطأ', 'لا توجد وردية مفتوحة');
      return;
    }

    if (!title.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان المصروف (مثلاً: شراء فرينة، ملح، كهرباء)');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('تنبيه', 'أدخل مبلغاً صحيحاً أكبر من 0');
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        shiftId: activeShift.id,
        title: title.trim(),
        amount: amt,
        category,
        userId: currentUser.id,
        notes
      });

      Alert.alert('نجاح', 'تم تسجيل المصروف بنجاح');
      setTitle('');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل حفظ المصروف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>تسجيل مصروفات المخبزة التشغيلية</Text>

          <ScrollView>
            <Text style={styles.label}>عنوان المصروف:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: كيس فرينة، زيت، تصليح خلاط..."
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />

            <Text style={styles.label}>المبلغ (د.ج):</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              textAlign="center"
            />

            <Text style={styles.label}>الفئة:</Text>
            <View style={styles.categoriesGrid}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, category === cat.id && styles.catChipSelected]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, category === cat.id && styles.catChipTextSelected]}>{cat.labelAr}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ملاحظات (اختياري):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ملاحظات حول الوصل أو البائع..."
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
            />
          </ScrollView>

          <View style={styles.actionsRow}>
            <BakeryButton title="تسجيل المصروف" onPress={handleSave} variant="primary" style={{ flex: 1, marginLeft: 8 }} disabled={loading} />
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
    maxHeight: '85%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#ffffff'
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f8fafc'
  },
  categoriesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap'
  },
  catChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 3
  },
  catChipSelected: {
    backgroundColor: '#d97706',
    borderColor: '#b45309'
  },
  catChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155'
  },
  catChipTextSelected: {
    color: '#ffffff'
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    marginTop: 16
  }
});
