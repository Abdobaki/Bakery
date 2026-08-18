import { calculateBreadSummary, calculateExternalProductSummaries, calculateShiftSummary } from '../utils/calculations';
import { BreadTray, InventoryMovement } from '../types';

describe('Bakery Management System Accounting Logic (§44 & §45)', () => {
  test('1. Bread Revenue Calculation preserves exact price at transaction time (§9)', () => {
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

    const result = calculateBreadSummary(mockTrays);
    expect(result.totalQuantity).toBe(200);
    expect(result.totalRevenue).toBe(3400);
    expect(result.totalsByType['1'].revenue).toBe(1800);
    expect(result.totalsByType['3'].revenue).toBe(1600);
  });

  test('2. Real-World Scenario Test from Spec §45 (Kesra Inventory Carry-Over)', () => {
    const products = [{ id: 1, name: 'كسرة (Kesra)', purchasePrice: 35, sellingPrice: 50 }];

    const morningMovements: InventoryMovement[] = [
      { id: 1, uuid: 'm-1', shiftId: 1, productId: 1, movementType: 'OPENING', quantity: 0, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
      { id: 2, uuid: 'm-2', shiftId: 1, productId: 1, movementType: 'RECEIVED', quantity: 20, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
      { id: 3, uuid: 'm-3', shiftId: 1, productId: 1, movementType: 'SOLD', quantity: 12, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
    ];

    const morningSummary = calculateExternalProductSummaries(products, morningMovements);
    const kesraMorning = morningSummary.find((p) => p.productId === 1)!;

    expect(kesraMorning.openingQty).toBe(0);
    expect(kesraMorning.addedQty).toBe(20);
    expect(kesraMorning.soldQty).toBe(12);
    expect(kesraMorning.remainingQty).toBe(8);
    expect(kesraMorning.revenueOfSold).toBe(600);
    expect(kesraMorning.costOfSold).toBe(420);
    expect(kesraMorning.profitOfSold).toBe(180);

    const eveningMovements: InventoryMovement[] = [
      { id: 4, uuid: 'm-4', shiftId: 2, productId: 1, movementType: 'OPENING', quantity: kesraMorning.remainingQty, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
      { id: 5, uuid: 'm-5', shiftId: 2, productId: 1, movementType: 'RECEIVED', quantity: 10, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
      { id: 6, uuid: 'm-6', shiftId: 2, productId: 1, movementType: 'SOLD', quantity: 15, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 3, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
    ];

    const eveningSummary = calculateExternalProductSummaries(products, eveningMovements);
    const kesraEvening = eveningSummary.find((p) => p.productId === 1)!;

    expect(kesraEvening.openingQty).toBe(8);
    expect(kesraEvening.addedQty).toBe(10);
    expect(kesraEvening.soldQty).toBe(15);
    expect(kesraEvening.remainingQty).toBe(3);

    const totalDailySold = kesraMorning.soldQty + kesraEvening.soldQty;
    expect(totalDailySold).toBe(27);
    expect(kesraEvening.remainingQty).toBe(3);
  });

  test('3. Shift Financial Summary and Cash Discrepancy Calculation (§15 & §16)', () => {
    const mockTrays: BreadTray[] = [
      {
        id: 1,
        uuid: 't-1',
        shiftId: 1,
        trayNumber: 1,
        recordedAt: '',
        recordedByUserId: 2,
        isVoided: false,
        createdAt: '',
        syncStatus: 'PENDING',
        items: [
          { id: 1, uuid: 'i-1', trayId: 1, breadTypeId: 1, breadTypeName: 'Bread', quantity: 100, priceAtTime: 15, createdAt: '', syncStatus: 'PENDING' }
        ]
      }
    ];

    const mockMovements: InventoryMovement[] = [
      { id: 1, uuid: 'm-1', shiftId: 1, productId: 1, movementType: 'OPENING', quantity: 0, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' },
      { id: 2, uuid: 'm-2', shiftId: 1, productId: 1, movementType: 'SOLD', quantity: 20, purchasePriceAtTime: 35, sellingPriceAtTime: 50, recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
    ];

    const result = calculateShiftSummary({
      trays: mockTrays,
      products: [{ id: 1, name: 'Kesra', purchasePrice: 35, sellingPrice: 50 }],
      movements: mockMovements,
      payments: [
        { id: 1, uuid: 'p-1', shiftId: 1, workerId: 1, amount: 500, paymentType: 'DAILY', recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
      ],
      expenses: [
        { id: 1, uuid: 'e-1', shiftId: 1, title: 'Yeast', amount: 200, category: 'YEAST', recordedByUserId: 2, recordedAt: '', isVoided: false, createdAt: '', syncStatus: 'PENDING' }
      ],
      actualCash: 1750
    });

    expect(result.breadRevenue).toBe(1500);
    expect(result.externalRevenue).toBe(1000);
    expect(result.externalCost).toBe(700);
    expect(result.netAmount).toBe(1100);
    expect(result.expectedCash).toBe(1800);
    expect(result.actualCash).toBe(1750);
    expect(result.cashDifference).toBe(-50);
  });
});
