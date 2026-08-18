import { BreadType, ExternalProduct, formatDZD } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { HeaderBar } from '../../src/components/HeaderBar';
import { addBreadType, addExternalProduct, getBreadTypes, getExternalProducts, updateBreadTypePrice, updateExternalProductPrices } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function ProductsManagerScreen() {
  const { currentUser } = useAppStore();
  const [tab, setTab] = useState<'BREAD' | 'EXTERNAL'>('BREAD');
  const [breadTypes, setBreadTypes] = useState<BreadType[]>([]);
  const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>([]);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newName, setNewName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const b = await getBreadTypes();
    const p = await getExternalProducts();
    setBreadTypes(b);
    setExternalProducts(p);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setIsAddingNew(false);
    if (tab === 'BREAD') {
      setNewPrice(String(item.currentPrice));
    } else {
      setNewPurchasePrice(String(item.purchasePrice));
      setNewSellingPrice(String(item.sellingPrice));
    }
    setEditModalVisible(true);
  };

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsAddingNew(true);
    setNewName('');
    setNewPrice('');
    setNewPurchasePrice('');
    setNewSellingPrice('');
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      if (tab === 'BREAD') {
        if (isAddingNew) {
          if (!newName.trim() || !newPrice) return Alert.alert('خطأ', 'أدخل الاسم والسعر');
          await addBreadType(newName.trim(), parseFloat(newPrice));
          Alert.alert('نجاح', 'تمت إضافة نوع الخبز الجديد');
        } else {
          if (!newPrice) return Alert.alert('خطأ', 'أدخل السعر الجديد');
          await updateBreadTypePrice(selectedItem.id, parseFloat(newPrice), currentUser.id);
          Alert.alert('نجاح', 'تم تحديث سعر الخبز وحفظ السعر القديم في الأرشيف');
        }
      } else {
        if (isAddingNew) {
          if (!newName.trim() || !newPurchasePrice || !newSellingPrice) return Alert.alert('خطأ', 'أدخل جميع البيانات');
          await addExternalProduct(newName.trim(), parseFloat(newPurchasePrice), parseFloat(newSellingPrice));
          Alert.alert('نجاح', 'تمت إضافة المنتج الخارجي الجديد');
        } else {
          if (!newPurchasePrice || !newSellingPrice) return Alert.alert('خطأ', 'أدخل أسعار الشراء والبيع الجديدة');
          await updateExternalProductPrices(selectedItem.id, parseFloat(newPurchasePrice), parseFloat(newSellingPrice), currentUser.id);
          Alert.alert('نجاح', 'تم تحديث أسعار المنتج الخارجي');
        }
      }
      loadProducts();
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل التحديث');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="إدارة أسعار الخبز والمنتجات الخارجية" />

      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, tab === 'BREAD' && styles.topTabActive]} onPress={() => setTab('BREAD')}>
          <Text style={[styles.topTabText, tab === 'BREAD' && styles.topTabTextActive]}>أنواع الخبز والأسعار</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, tab === 'EXTERNAL' && styles.topTabActive]} onPress={() => setTab('EXTERNAL')}>
          <Text style={[styles.topTabText, tab === 'EXTERNAL' && styles.topTabTextActive]}>المنتجات الخارجية (الكسرة...)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addBar}>
        <BakeryButton title={tab === 'BREAD' ? '+ إضافة نوع خبز جديد' : '+ إضافة منتج خارجي جديد'} onPress={handleOpenAdd} />
      </View>

      {tab === 'BREAD' ? (
        <FlatList
          data={breadTypes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(item)}>
              <View style={styles.cardMain}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatDZD(item.currentPrice, 'ar')}</Text>
              </View>
              <Text style={styles.editHint}>انقر لتغيير السعر ✏️</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          data={externalProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(item)}>
              <View style={styles.cardMain}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <View style={styles.priceColumn}>
                  <Text style={styles.itemPrice}>البيع: {formatDZD(item.sellingPrice, 'ar')}</Text>
                  <Text style={styles.itemCost}>الشراء: {formatDZD(item.purchasePrice, 'ar')}</Text>
                </View>
              </View>
              <Text style={styles.editHint}>انقر لتغيير الأسعار ✏️</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Edit / Add Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isAddingNew ? 'إضافة صنف جديد' : `تغيير سعر: ${selectedItem?.name}`}
            </Text>

            {isAddingNew && (
              <>
                <Text style={styles.label}>الاسم:</Text>
                <TextInput style={styles.textInput} value={newName} onChangeText={setNewName} textAlign="right" />
              </>
            )}

            {tab === 'BREAD' ? (
              <>
                <Text style={styles.label}>سعر البيع الجديد (د.ج):</Text>
                <TextInput style={styles.amountInput} keyboardType="numeric" value={newPrice} onChangeText={setNewPrice} textAlign="center" />
              </>
            ) : (
              <>
                <Text style={styles.label}>سعر الشراء (التكلفة):</Text>
                <TextInput style={styles.amountInput} keyboardType="numeric" value={newPurchasePrice} onChangeText={setNewPurchasePrice} textAlign="center" />

                <Text style={styles.label}>سعر البيع للزبائن:</Text>
                <TextInput style={styles.amountInput} keyboardType="numeric" value={newSellingPrice} onChangeText={setNewSellingPrice} textAlign="center" />
              </>
            )}

            <View style={styles.actionsRow}>
              <BakeryButton title="حفظ التغييرات" onPress={handleSave} variant="primary" style={{ flex: 1, marginLeft: 8 }} />
              <BakeryButton title="إلغاء" onPress={() => setEditModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topTabs: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  topTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  topTabActive: {
    borderBottomColor: '#d97706'
  },
  topTabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b'
  },
  topTabTextActive: {
    color: '#d97706'
  },
  addBar: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  cardMain: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706'
  },
  priceColumn: {
    alignItems: 'flex-start'
  },
  itemCost: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  editHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'left',
    marginTop: 6
  },
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
    fontSize: 22,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 10
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    marginTop: 16
  }
});
