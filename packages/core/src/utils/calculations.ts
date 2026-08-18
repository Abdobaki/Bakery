import {
  BreadTray,
  BreadTrayItem,
  Expense,
  InventoryMovement,
  ProductInventorySummary,
  ShiftSummaryCalculation,
  WorkerPayment
} from '../types/index.js';

/**
 * Calculates total bread produced & total revenue for a set of bread trays.
 * Preserves the exact priceAtTime recorded for each item.
 */
export function calculateBreadSummary(trays: BreadTray[]): {
  totalRevenue: number;
  totalQuantity: number;
  totalsByType: Record<string, { breadTypeId: number; name: string; quantity: number; revenue: number }>;
} {
  let totalRevenue = 0;
  let totalQuantity = 0;
  const totalsByType: Record<string, { breadTypeId: number; name: string; quantity: number; revenue: number }> = {};

  for (const tray of trays) {
    if (tray.isVoided) continue;
    if (!tray.items) continue;

    for (const item of tray.items) {
      const itemRevenue = item.quantity * item.priceAtTime;
      totalRevenue += itemRevenue;
      totalQuantity += item.quantity;

      const typeKey = String(item.breadTypeId);
      if (!totalsByType[typeKey]) {
        totalsByType[typeKey] = {
          breadTypeId: item.breadTypeId,
          name: item.breadTypeName || `Bread #${item.breadTypeId}`,
          quantity: 0,
          revenue: 0
        };
      }

      totalsByType[typeKey].quantity += item.quantity;
      totalsByType[typeKey].revenue += itemRevenue;
    }
  }

  return { totalRevenue, totalQuantity, totalsByType };
}

/**
 * Calculates external product opening, added, sold, remaining, revenue, cost, and profit.
 * CRITICAL BUSINESS RULE (§11 & §12):
 * Remaining stock = Opening + Added - Sold
 * Unsold remaining stock is NOT counted as revenue or cost of goods sold.
 * Revenue = Sold * Selling Price
 * Cost = Sold * Purchase Price
 * Profit = Revenue - Cost
 */
export function calculateExternalProductSummaries(
  products: { id: number; name: string; purchasePrice: number; sellingPrice: number }[],
  movements: InventoryMovement[]
): ProductInventorySummary[] {
  const map = new Map<number, ProductInventorySummary>();

  // Initialize map with active products
  for (const p of products) {
    map.set(p.id, {
      productId: p.id,
      productName: p.name,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      openingQty: 0,
      addedQty: 0,
      soldQty: 0,
      remainingQty: 0,
      costOfSold: 0,
      revenueOfSold: 0,
      profitOfSold: 0
    });
  }

  // Process movements
  for (const m of movements) {
    if (m.isVoided) continue;

    let summary = map.get(m.productId);
    if (!summary) {
      summary = {
        productId: m.productId,
        productName: m.productName || `Product #${m.productId}`,
        purchasePrice: m.purchasePriceAtTime,
        sellingPrice: m.sellingPriceAtTime,
        openingQty: 0,
        addedQty: 0,
        soldQty: 0,
        remainingQty: 0,
        costOfSold: 0,
        revenueOfSold: 0,
        profitOfSold: 0
      };
      map.set(m.productId, summary);
    }

    if (m.movementType === 'OPENING') {
      summary.openingQty += m.quantity;
    } else if (m.movementType === 'RECEIVED') {
      summary.addedQty += m.quantity;
    } else if (m.movementType === 'SOLD') {
      summary.soldQty += m.quantity;
      // Revenue and cost are based strictly on sold quantity using stored price snapshots
      const rev = m.quantity * m.sellingPriceAtTime;
      const cost = m.quantity * m.purchasePriceAtTime;
      summary.revenueOfSold += rev;
      summary.costOfSold += cost;
      summary.profitOfSold += (rev - cost);
    } else if (m.movementType === 'ADJUSTMENT') {
      summary.addedQty += m.quantity;
    }
  }

  // Calculate final remaining quantity for each product
  const results: ProductInventorySummary[] = [];
  for (const summary of map.values()) {
    summary.remainingQty = Math.max(0, summary.openingQty + summary.addedQty - summary.soldQty);
    results.push(summary);
  }

  return results;
}

/**
 * Calculates complete shift financial summary.
 */
export function calculateShiftSummary(params: {
  trays: BreadTray[];
  products: { id: number; name: string; purchasePrice: number; sellingPrice: number }[];
  movements: InventoryMovement[];
  payments: WorkerPayment[];
  expenses: Expense[];
  actualCash: number;
}): ShiftSummaryCalculation {
  const { trays, products, movements, payments, expenses, actualCash } = params;

  // 1. Bread summary
  const breadRes = calculateBreadSummary(trays);

  // 2. External product summary
  const prodSummaries = calculateExternalProductSummaries(products, movements);
  let totalExtRevenue = 0;
  let totalExtCost = 0;
  let totalExtProfit = 0;

  for (const p of prodSummaries) {
    totalExtRevenue += p.revenueOfSold;
    totalExtCost += p.costOfSold;
    totalExtProfit += p.profitOfSold;
  }

  // 3. Worker payments total
  let totalWorkerPayments = 0;
  for (const w of payments) {
    if (!w.isVoided) {
      totalWorkerPayments += w.amount;
    }
  }

  // 4. Other expenses total
  let totalOtherExpenses = 0;
  for (const e of expenses) {
    if (!e.isVoided) {
      totalOtherExpenses += e.amount;
    }
  }

  // 5. Financial results
  // Total Revenue collected = Bread Revenue + External Sales Revenue
  // Net Amount (Actual Net Bakery Earnings for shift) = Bread Revenue + External Revenue - External Cost - Worker Payments - Other Expenses
  // Expected Cash = Cash collected after paying cash expenses out of register:
  // Expected Cash handed over = Bread Revenue + External Sales Revenue - Worker Payments - Other Expenses
  const netAmount = breadRes.totalRevenue + totalExtRevenue - totalExtCost - totalWorkerPayments - totalOtherExpenses;
  const expectedCash = breadRes.totalRevenue + totalExtRevenue - totalWorkerPayments - totalOtherExpenses;
  const cashDifference = actualCash - expectedCash;

  return {
    breadRevenue: breadRes.totalRevenue,
    externalRevenue: totalExtRevenue,
    externalCost: totalExtCost,
    externalProfit: totalExtProfit,
    workerPayments: totalWorkerPayments,
    otherExpenses: totalOtherExpenses,
    netAmount,
    expectedCash,
    actualCash,
    cashDifference,
    breadTotalsByType: breadRes.totalsByType,
    productSummaries: prodSummaries
  };
}
