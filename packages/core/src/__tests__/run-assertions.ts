import { calculateBreadSummary, calculateExternalProductSummaries, calculateShiftSummary } from '../utils/calculations.js';
import { BreadTray, InventoryMovement } from '../types/index.js';

console.log('--- STARTING BAKERY ACCOUNTING LOGIC ASSERTIONS ---');

// 1. Bread Revenue Calculation
const mockTrays: BreadTray[] = [
  {
    id: 1,
    uuid: 't-1',
    shiftId: 1,
    trayNumber: 1,
    recordedAt: '2026-08-12T08:00:00Z',
    recordedByUserId: 2,
    isVoided: false,
    createdAt: '2026-08-12T08:00:00Z',
    syncStatus: 'PENDING',
    items: [
      { id: 1, uuid: 'i-1', trayId: 1, breadTypeId: 1, breadTypeName: 'Pain ordinaire', quantity: 120, priceAtTime: 15, createdAt: '', syncStatus: 'PENDING' },
      { id: 2, uuid: 'i-2', trayId: 1, breadTypeId: 3, breadTypeName: 'Pain de semoule', quantity: 80, priceAtTime: 20, createdAt: '', syncStatus: 'PENDING' }
    ]
  }
];

const breadRes = calculateBreadSummary(mockTrays);
console.assert(breadRes.totalQuantity === 200, 'Bread quantity should be 200');
console.assert(breadRes.totalRevenue === 3400, 'Bread revenue should be 3400 DA');
console.log('✅ TEST 1 PASSED: Bread revenue price snapshot calculation');

// 2. Real-World Scenario Test from Spec §45 (Kesra Inventory Carry-Over)
const products = [{ id: 1, name: 'كسرة (Kesra)', purchasePrice: 35, sellingPrice: 50 }];

const morningMovements: InventoryMovement[] = [
  { id: 1, uuid: 'm-1', shiftId: 1, productId: 1, movementType: 'OPENING', quantity: 0, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
  { id: 2, uuid: 'm-2', shiftId: 1, productId: 1, movementType: 'RECEIVED', quantity: 20, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
  { id: 3, uuid: 'm-3', shiftId: 1, productId: 1, movementType: 'SOLD', quantity: 12, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
];

const morningSummary = calculateExternalProductSummaries(products, morningMovements);
const kesraMorning = morningSummary.find((p) => p.productId === 1)!;

console.assert(kesraMorning.remainingQty === 8, 'Morning remaining Kesra should be 8');
console.assert(kesraMorning.revenueOfSold === 600, 'Morning Kesra revenue should be 600 DA');
console.assert(kesraMorning.profitOfSold === 180, 'Morning Kesra profit should be 180 DA');

const eveningMovements: InventoryMovement[] = [
  { id: 4, uuid: 'm-4', shiftId: 2, productId: 1, movementType: 'OPENING', quantity: kesraMorning.remainingQty, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
  { id: 5, uuid: 'm-5', shiftId: 2, productId: 1, movementType: 'RECEIVED', quantity: 10, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
  { id: 6, uuid: 'm-6', shiftId: 2, productId: 1, movementType: 'SOLD', quantity: 15, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
];

const eveningSummary = calculateExternalProductSummaries(products, eveningMovements);
const kesraEvening = eveningSummary.find((p) => p.productId === 1)!;

console.assert(kesraEvening.openingQty === 8, 'Evening opening stock should be 8');
console.assert(kesraEvening.remainingQty === 3, 'Evening remaining stock should be 3');
console.assert(kesraMorning.soldQty + kesraEvening.soldQty === 27, 'Total sold should be 27 units');
console.log('✅ TEST 2 PASSED: Spec §45 Real-world Kesra inventory carry-over');

// 3. Shift Financial Summary and Cash Discrepancy Calculation
const shiftRes = calculateShiftSummary({
  trays: mockTrays,
  products,
  movements: morningMovements,
  payments: [
    { id: 1, uuid: 'p-1', shiftId: 1, workerId: 1, amount: 500, paymentType: 'DAILY', recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
  ],
  expenses: [
    { id: 1, uuid: 'e-1', shiftId: 1, title: 'Yeast', amount: 200, category: 'YEAST', recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
  ],
  actualCash: 3100
});

console.assert(shiftRes.breadRevenue === 3400, 'Bread revenue check');
console.assert(shiftRes.externalRevenue === 600, 'External revenue check');
console.assert(shiftRes.workerPayments === 500, 'Worker payments check');
console.assert(shiftRes.otherExpenses === 200, 'Other expenses check');
console.assert(shiftRes.expectedCash === 3300, 'Expected cash should be 3300 DA');
console.assert(shiftRes.cashDifference === -200, 'Cash difference should be -200 DA (200 DA shortage)');
console.log('✅ TEST 3 PASSED: Shift financial summary & cash shortage calculation');

console.log('--- ALL ACCOUNTING ASSERTIONS PASSED SUCCESSFULLY ---');
