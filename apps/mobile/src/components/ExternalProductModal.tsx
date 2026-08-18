import { formatDZD } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addInventoryMovement, getExternalProducts } from '../db/queries';
import { useAppStore } from '../store/useAppStore';
import { BakeryButton } from './BakeryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExternalProductModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { activeShift, currentUser } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'SOLD' | 'RECEIVED'>('SOLD');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    const prods = await getExternalProducts();
    setProducts(prods);
    if (prods.length > 0) {
      setSelectedProductId(prods[0].id);
    }
    setQuantity('');
    setActionType('SOLD');
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSave = async () => {
    if (!activeShift || !currentUser || !selectedProduct) {
      Alert.alert('خطأ', 'يرجى اختيار المنتج والوردية الحالية');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة أكبر من 0');
      return;
    }

    setLoading(true);
    try {
      await addInventoryMovement({
        shiftId: activeShift.id,
        productId: selectedProduct.id,
        movementType: actionType,
        quantity: qty,
        purchasePriceAtTime: selectedProduct.purchasePrice,
        sellingPriceAtTime: selectedProduct.sellingPrice,
        userId: currentUser.id,
        notes: actionType === 'SOLD' ? 'تسجيل مبيعات' : 'استلام بضاعة جديدة'
      });

      Alert.alert('نجاح', actionType === 'SOLD' ? 'تم تسجيل المبيعات بنجاح' : 'تم تسليم البضاعة الجديدة بنجاح');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل تسجيل العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>تسجيل المنتجات الخارجية (الكسرة / البيتزا...)</Text>

          {/* Action type toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, actionType === 'SOLD' && styles.toggleActiveSold]}
              onPress={() => setActionType('SOLD')}
            >
              <Text style={[styles.toggleText, actionType === 'SOLD' && styles.toggleTextActive]}>تسجيل مبيعات للزبائن</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, actionType === 'RECEIVED' && styles.toggleActiveReceived]}
              onPress={() => setActionType('RECEIVED')}
            >
              <Text style={[styles.toggleText, actionType === 'RECEIVED' && styles.toggleTextActive]}>استلام بضاعة جديدة (+مخزون)</Text>
            </TouchableOpacity>
          </View>

          {/* Product selector */}
          <Text style={styles.label}>اختر المنتج:</Text>
          <View style={styles.productsGrid}>
            {products.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={[styles.prodChip, selectedProductId === prod.id && styles.prodChipSelected]}
                onPress={() => setSelectedProductId(prod.id)}
              >
                <Text style={[styles.prodChipText, selectedProductId === prod.id && styles.prodChipTextSelected]}>{prod.name}</Text>
                <Text style={styles.prodChipPrice}>{formatDZD(prod.sellingPrice, 'ar')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity Input */}
          <Text style={styles.label}>الكمية ({actionType === 'SOLD' ? 'المباعة' : 'المُستلَمة'}):</Text>
          <TextInput
            style={styles.qtyInput}
            keyboardType="number-pad"
            placeholder="أدخل العدد..."
            value={quantity}
            onChangeText={setQuantity}
            textAlign="center"
          />

          <View style={styles.actionsRow}>
            <BakeryButton title="حفظ العملية" onPress={handleSave} variant="primary" style={{ flex: 1, marginLeft: 8 }} disabled={loading} />
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
  toggleRow: {
    flexDirection: 'row-reverse',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  toggleActiveSold: {
    backgroundColor: '#2563eb'
  },
  toggleActiveReceived: {
    backgroundColor: '#16a34a'
  },
  toggleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b'
  },
  toggleTextActive: {
    color: '#ffffff'
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
    marginBottom: 8
  },
  productsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  prodChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    alignItems: 'center'
  },
  prodChipSelected: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706'
  },
  prodChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  prodChipTextSelected: {
    color: '#92400e'
  },
  prodChipPrice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#f8fafc'
  },
  actionsRow: {
    flexDirection: 'row-reverse'
  }
});
