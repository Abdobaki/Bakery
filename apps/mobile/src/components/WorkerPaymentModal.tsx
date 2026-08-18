import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addWorkerPayment, getAllWorkers } from '../db/queries';
import { useAppStore } from '../store/useAppStore';
import { BakeryButton } from './BakeryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkerPaymentModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { activeShift, currentUser } = useAppStore();
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadWorkers();
    }
  }, [visible]);

  const loadWorkers = async () => {
    const w = await getAllWorkers();
    setWorkers(w);
    if (w.length > 0) setSelectedWorkerId(w[0].id);
    setAmount('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!activeShift || !currentUser || !selectedWorkerId) {
      Alert.alert('خطأ', 'يرجى اختيار العامل');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('تنبيه', 'أدخل مبلغاً صحيحاً أكبر من 0');
      return;
    }

    const worker = workers.find((w) => w.id === selectedWorkerId);

    setLoading(true);
    try {
      await addWorkerPayment({
        shiftId: activeShift.id,
        workerId: selectedWorkerId,
        amount: amt,
        paymentType: worker?.paymentType || 'DAILY',
        userId: currentUser.id,
        notes
      });

      Alert.alert('نجاح', 'تم تسجيل دفع مستحقات العامل بنجاح');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل حفظ المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>تسجيل مستحقات / شوفاج عمال المخبزة</Text>

          <Text style={styles.label}>اختر العامل:</Text>
          <View style={styles.grid}>
            {workers.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.chip, selectedWorkerId === w.id && styles.chipSelected]}
                onPress={() => setSelectedWorkerId(w.id)}
              >
                <Text style={[styles.chipText, selectedWorkerId === w.id && styles.chipTextSelected]}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>المبلغ المدفوع (د.ج):</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            placeholder="مثال: 3500"
            value={amount}
            onChangeText={setAmount}
            textAlign="center"
          />

          <Text style={styles.label}>ملاحظات (اختياري):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="مثال: تسقيع يومي، إلخ..."
            value={notes}
            onChangeText={setNotes}
            textAlign="right"
          />

          <View style={styles.actionsRow}>
            <BakeryButton title="تسجيل الدفع" onPress={handleSave} variant="primary" style={{ flex: 1, marginLeft: 8 }} disabled={loading} />
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
    padding: 20
  },
  title: {
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
    marginBottom: 8
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  chip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4
  },
  chipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb'
  },
  chipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  chipTextSelected: {
    color: '#ffffff'
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f8fafc'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 16
  },
  actionsRow: {
    flexDirection: 'row-reverse'
  }
});
