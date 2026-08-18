import { Worker } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { HeaderBar } from '../../src/components/HeaderBar';
import { addWorker, getAllWorkers } from '../../src/db/queries';

export default function WorkersManagerScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [paymentType, setPaymentType] = useState('DAILY');

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    const w = await getAllWorkers();
    setWorkers(w);
  };

  const handleAddWorker = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل اسم العامل');
    try {
      await addWorker(name.trim(), paymentType);
      Alert.alert('نجاح', 'تمت إضافة العامل بنجاح');
      setName('');
      setModalVisible(false);
      loadWorkers();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل إضافة العامل');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="إدارة عمال المخبزة" />

      <View style={styles.topBar}>
        <BakeryButton title="+ إضافة عامل جديد للمخبزة" onPress={() => setModalVisible(true)} />
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.workerName}>{item.name}</Text>
            <Text style={styles.paymentBadge}>{item.paymentType === 'DAILY' ? 'يومي' : 'أسبوعي'}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>إضافة عامل جديد</Text>

            <Text style={styles.label}>اسم العامل الكامل:</Text>
            <TextInput style={styles.input} placeholder="مثال: علي الخباز..." value={name} onChangeText={setName} textAlign="right" />

            <View style={styles.actionsRow}>
              <BakeryButton title="حفظ العامل" onPress={handleAddWorker} variant="primary" style={{ flex: 1, marginLeft: 8 }} />
              <BakeryButton title="إلغاء" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
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
  topBar: {
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
    borderColor: '#cbd5e1',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  paymentBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
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
    marginBottom: 6
  },
  input: {
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
