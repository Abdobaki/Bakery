import { Expense, formatDZD, formatTime, WorkerPayment } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { ExpenseModal } from '../../src/components/ExpenseModal';
import { HeaderBar } from '../../src/components/HeaderBar';
import { WorkerPaymentModal } from '../../src/components/WorkerPaymentModal';
import { getShiftExpenses, getShiftWorkerPayments } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function ExpensesScreen() {
  const { activeShift } = useAppStore();
  const [tab, setTab] = useState<'WORKERS' | 'EXPENSES'>('WORKERS');
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  useEffect(() => {
    if (activeShift) {
      loadData();
    }
  }, [activeShift]);

  const loadData = async () => {
    if (!activeShift) return;
    const p = await getShiftWorkerPayments(activeShift.id);
    const e = await getShiftExpenses(activeShift.id);
    setPayments(p);
    setExpenses(e);
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="مستحقات العمال والمصاريف التشغيلية" />

      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, tab === 'WORKERS' && styles.topTabActive]} onPress={() => setTab('WORKERS')}>
          <Text style={[styles.topTabText, tab === 'WORKERS' && styles.topTabTextActive]}>مستحقات وتشوفاج العمال</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, tab === 'EXPENSES' && styles.topTabActive]} onPress={() => setTab('EXPENSES')}>
          <Text style={[styles.topTabText, tab === 'EXPENSES' && styles.topTabTextActive]}>المصاريف التشغيلية الأُخرى</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.btnBar}>
        {tab === 'WORKERS' ? (
          <BakeryButton title="+ تسجيل مدفوعات للعامل" onPress={() => setWorkerModalVisible(true)} disabled={!activeShift} />
        ) : (
          <BakeryButton title="+ تسجيل مصروف تشغيلي جديد" onPress={() => setExpenseModalVisible(true)} disabled={!activeShift} />
        )}
      </View>

      {!activeShift ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>الرجاء فتح وردية لتتمكن من تسجيل المصاريف ومستحقات العمال</Text>
        </View>
      ) : tab === 'WORKERS' ? (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.workerName}>{item.workerName}</Text>
                <Text style={styles.amountText}>- {formatDZD(item.amount, 'ar')}</Text>
              </View>
              <View style={styles.cardSub}>
                <Text style={styles.subTime}>{formatTime(item.recordedAt, 'ar')}</Text>
                <Text style={styles.subNote}>{item.notes || 'تسقيع يومي'}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>لم يتم تسجيل أي مدفوعات للعمال في هذه الوردية</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.workerName}>{item.title}</Text>
                <Text style={styles.amountText}>- {formatDZD(item.amount, 'ar')}</Text>
              </View>
              <View style={styles.cardSub}>
                <Text style={styles.subTime}>{formatTime(item.recordedAt, 'ar')}</Text>
                <Text style={styles.catBadge}>{item.category}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>لم يتم تسجيل أي مصاريف تشغيلية في هذه الوردية</Text>
            </View>
          }
        />
      )}

      <WorkerPaymentModal visible={workerModalVisible} onClose={() => setWorkerModalVisible(false)} onSuccess={loadData} />
      <ExpenseModal visible={expenseModalVisible} onClose={() => setExpenseModalVisible(false)} onSuccess={loadData} />
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
  btnBar: {
    padding: 16,
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
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  cardSub: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subTime: {
    fontSize: 12,
    color: '#94a3b8'
  },
  subNote: {
    fontSize: 12,
    color: '#64748b'
  },
  catBadge: {
    fontSize: 11,
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
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
