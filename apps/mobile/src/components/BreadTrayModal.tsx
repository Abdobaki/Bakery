import { formatDZD } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addBreadTray, getBreadTypes } from '../db/queries';
import { useAppStore } from '../store/useAppStore';
import { BakeryButton } from './BakeryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BreadTrayModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { activeShift, currentUser } = useAppStore();
  const [breadTypes, setBreadTypes] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBreadTypes();
    }
  }, [visible]);

  const loadBreadTypes = async () => {
    const types = await getBreadTypes();
    setBreadTypes(types);
    const initialQty: Record<number, number> = {};
    types.forEach((t) => (initialQty[t.id] = 0));
    setQuantities(initialQty);
    setNotes('');
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [id]: updated };
    });
  };

  const handleSave = async () => {
    if (!activeShift || !currentUser) {
      Alert.alert('خطأ', 'لا توجد وردية مفتوحة');
      return;
    }

    const itemsToSave = breadTypes
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({
        breadTypeId: t.id,
        quantity: quantities[t.id],
        priceAtTime: t.currentPrice
      }));

    if (itemsToSave.length === 0) {
      Alert.alert('تنبيه', 'يرجى إدخال كمية الخبز لواحد من الأنواع على الأقل');
      return;
    }

    setLoading(true);
    try {
      await addBreadTray(activeShift.id, currentUser.id, itemsToSave, notes);
      Alert.alert('نجاح', 'تم تسجيل الشاريو بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل حفظ الشاريو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>إضافة شاريو خبز جديد (خرج من الفرن)</Text>
          <Text style={styles.subtitle}>أدخل كمية كل نوع خبز تم إخراجه في هذا الشاريو</Text>

          <ScrollView style={styles.scrollList}>
            {breadTypes.map((type) => {
              const qty = quantities[type.id] || 0;
              return (
                <View key={type.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.breadName}>{type.name}</Text>
                    <Text style={styles.priceTag}>{formatDZD(type.currentPrice, 'ar')}</Text>
                  </View>

                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepBtnLarge} onPress={() => updateQuantity(type.id, 50)}>
                      <Text style={styles.stepText}>+50</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(type.id, 10)}>
                      <Text style={styles.stepText}>+10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(type.id, 1)}>
                      <Text style={styles.stepText}>+1</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyDisplay}>{qty}</Text>

                    <TouchableOpacity style={styles.stepBtnMinus} onPress={() => updateQuantity(type.id, -1)}>
                      <Text style={styles.stepText}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtnMinus} onPress={() => updateQuantity(type.id, -10)}>
                      <Text style={styles.stepText}>-10</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <Text style={styles.label}>ملاحظات إضافية (اختياري)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: شاريو محروق قليلاً، إلخ..."
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
            />
          </ScrollView>

          <View style={styles.actionsRow}>
            <BakeryButton title="حفظ الشاريو" onPress={handleSave} variant="primary" style={{ flex: 1, marginLeft: 8 }} disabled={loading} />
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
  scrollList: {
    marginBottom: 16
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  breadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  priceTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  stepperRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center'
  },
  stepBtnLarge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center'
  },
  stepBtnMinus: {
    backgroundColor: '#64748b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center'
  },
  stepText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  qtyDisplay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    minWidth: 50,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff'
  },
  actionsRow: {
    flexDirection: 'row-reverse'
  }
});
