import { calculateExternalProductSummaries, formatDZD, ProductInventorySummary } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { ExternalProductModal } from '../../src/components/ExternalProductModal';
import { HeaderBar } from '../../src/components/HeaderBar';
import { getExternalProducts, getShiftInventoryMovements } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function ExternalProductsScreen() {
  const { activeShift } = useAppStore();
  const [summaries, setSummaries] = useState<ProductInventorySummary[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (activeShift) {
      loadInventory();
    }
  }, [activeShift]);

  const loadInventory = async () => {
    if (!activeShift) return;
    const prods = await getExternalProducts();
    const movs = await getShiftInventoryMovements(activeShift.id);
    const calculated = calculateExternalProductSummaries(prods, movs);
    setSummaries(calculated);
  };

  const renderProductItem = ({ item }: { item: ProductInventorySummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.prodName}>{item.productName}</Text>
        <Text style={styles.priceTag}>البيع: {formatDZD(item.sellingPrice, 'ar')}</Text>
      </View>

      {/* Stock movement equation grid */}
      <View style={styles.stockGrid}>
        <View style={styles.stockBox}>
          <Text style={styles.stockVal}>{item.openingQty}</Text>
          <Text style={styles.stockLbl}>الافتتاحي</Text>
        </View>
        <Text style={styles.sign}>+</Text>
        <View style={styles.stockBox}>
          <Text style={styles.stockValPlus}>{item.addedQty}</Text>
          <Text style={styles.stockLbl}>مُستلم</Text>
        </View>
        <Text style={styles.sign}>-</Text>
        <View style={styles.stockBox}>
          <Text style={styles.stockValMinus}>{item.soldQty}</Text>
          <Text style={styles.stockLbl}>مباع</Text>
        </View>
        <Text style={styles.sign}>=</Text>
        <View style={[styles.stockBox, styles.stockBoxRemaining]}>
          <Text style={styles.stockValRem}>{item.remainingQty}</Text>
          <Text style={styles.stockLblRem}>المتبقي (ينتقل)</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.profitText}>الربح الصافي: {formatDZD(item.profitOfSold, 'ar')}</Text>
        <Text style={styles.revenueText}>إجمالي المداخيل: {formatDZD(item.revenueOfSold, 'ar')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderBar title="المنتجات الخارجية (الكسرة / البيتزا...)" />

      <View style={styles.topBtnRow}>
        <BakeryButton title="+ تسجيل بضاعة / مبيعات جديدة" onPress={() => setModalVisible(true)} disabled={!activeShift} />
      </View>

      {!activeShift ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>الرجاء فتح وردية أولاً لتتمكن من متابعة مخزون ومبيعات المنتجات الخارجية</Text>
        </View>
      ) : (
        <FlatList
          data={summaries}
          keyExtractor={(item) => String(item.productId)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.list}
        />
      )}

      <ExternalProductModal visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={loadInventory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topBtnRow: {
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  prodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  priceTag: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  stockGrid: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10
  },
  stockBox: {
    alignItems: 'center',
    flex: 1
  },
  stockBoxRemaining: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingVertical: 4
  },
  stockVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155'
  },
  stockValPlus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  stockValMinus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  stockValRem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b45309'
  },
  stockLbl: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  stockLblRem: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginTop: 2
  },
  sign: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  footerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  revenueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  profitText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16a34a'
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
