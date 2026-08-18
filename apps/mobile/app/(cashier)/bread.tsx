import { BreadTray, formatDZD, formatTime } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { BreadTrayModal } from '../../src/components/BreadTrayModal';
import { HeaderBar } from '../../src/components/HeaderBar';
import { getShiftTrays } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function BreadTraysScreen() {
  const { activeShift } = useAppStore();
  const [trays, setTrays] = useState<BreadTray[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (activeShift) {
      loadTrays();
    }
  }, [activeShift]);

  const loadTrays = async () => {
    if (!activeShift) return;
    const tList = await getShiftTrays(activeShift.id);
    setTrays(tList);
  };

  const renderTrayItem = ({ item }: { item: BreadTray }) => {
    const totalQty = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
    const totalRev = item.items?.reduce((sum, i) => sum + i.quantity * i.priceAtTime, 0) || 0;

    return (
      <View style={styles.trayCard}>
        <View style={styles.trayHeader}>
          <Text style={styles.trayNum}>شاريو رقم #{item.trayNumber}</Text>
          <Text style={styles.trayTime}>{formatTime(item.recordedAt, 'ar')}</Text>
        </View>

        <View style={styles.itemsList}>
          {item.items?.map((i) => (
            <View key={i.id} style={styles.itemRow}>
              <Text style={styles.itemRevenue}>{formatDZD(i.quantity * i.priceAtTime, 'ar')}</Text>
              <Text style={styles.itemName}>
                {i.breadTypeName} × {i.quantity} خبزة
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.trayFooter}>
          <Text style={styles.footerTotal}>المداخيل: {formatDZD(totalRev, 'ar')}</Text>
          <Text style={styles.footerQty}>إجمالي الخبز: {totalQty} قطعة</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="سجل الشاريوات (إنتاج الخبز)" />

      <View style={styles.topSection}>
        <BakeryButton title="+ إضافة شاريو جديد (خرج من الفرن)" onPress={() => setModalVisible(true)} disabled={!activeShift} />
      </View>

      {!activeShift ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>الرجاء فتح وردية أولاً لتتمكن من إضافة الشاريوات</Text>
        </View>
      ) : (
        <FlatList
          data={trays}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrayItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>لم يتم تسجيل أي شاريو في هذه الوردية بعد</Text>
            </View>
          }
        />
      )}

      <BreadTrayModal visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={loadTrays} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  listContent: {
    padding: 16
  },
  trayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1
  },
  trayHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 8
  },
  trayNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706'
  },
  trayTime: {
    fontSize: 12,
    color: '#64748b'
  },
  itemsList: {
    marginBottom: 10
  },
  itemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  itemName: {
    fontSize: 14,
    color: '#1e293b'
  },
  itemRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d'
  },
  trayFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4
  },
  footerQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569'
  },
  footerTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b45309'
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
