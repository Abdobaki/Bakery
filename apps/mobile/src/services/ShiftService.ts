import { calculateShiftSummary, ShiftSummaryCalculation } from '@bakery/core';
import {
  addAuditLog,
  addInventoryMovement,
  createShift,
  getActiveShift,
  getBreadTypes,
  getExternalProducts,
  getLatestClosingInventoryMovements,
  getShiftExpenses,
  getShiftInventoryMovements,
  getShiftTrays,
  getShiftWorkerPayments,
  updateShiftClosedData
} from '../db/queries';

export class ShiftService {
  /**
   * Opens a new shift for the cashier.
   * IMPLEMENTS SPEC §11 & §12: Automatically transfers remaining unsold inventory
   * from the last closed shift as OPENING stock for the new shift.
   */
  static async openNewShift(date: string, shiftType: 'MORNING' | 'EVENING', cashierId: number): Promise<number> {
    const existing = await getActiveShift();
    if (existing) {
      throw new Error('توجد وردية مفتوحة بالفعل! يرجى غلق الوردية الحالية أولاً.');
    }

    const shiftId = await createShift(date, shiftType, cashierId);

    // Carry over remaining inventory from previous shift
    const lastClosingMovements = await getLatestClosingInventoryMovements();
    if (lastClosingMovements.length > 0) {
      for (const m of lastClosingMovements) {
        if (m.quantity > 0) {
          await addInventoryMovement({
            shiftId,
            productId: m.productId,
            movementType: 'OPENING',
            quantity: m.quantity,
            purchasePriceAtTime: m.purchasePriceAtTime,
            sellingPriceAtTime: m.sellingPriceAtTime,
            userId: cashierId,
            notes: 'تحويل تلقائي للمخزون المتبقي من الوردية السابقة'
          });
        }
      }
    } else {
      // If no previous shift, create OPENING stock = 0 for active external products
      const activeProducts = await getExternalProducts();
      for (const p of activeProducts) {
        await addInventoryMovement({
          shiftId,
          productId: p.id,
          movementType: 'OPENING',
          quantity: 0,
          purchasePriceAtTime: p.purchasePrice,
          sellingPriceAtTime: p.sellingPrice,
          userId: cashierId,
          notes: 'مخزون افتتاحي أولي'
        });
      }
    }

    await addAuditLog({
      userId: cashierId,
      action: 'SHIFT_OPENED',
      entityType: 'shift',
      entityId: String(shiftId),
      newValue: { date, shiftType, cashierId }
    });

    return shiftId;
  }

  /**
   * Computes the current financial summary for a shift.
   */
  static async getShiftSummary(shiftId: number, actualCash = 0): Promise<ShiftSummaryCalculation> {
    const trays = await getShiftTrays(shiftId);
    const products = await getExternalProducts();
    const movements = await getShiftInventoryMovements(shiftId);
    const payments = await getShiftWorkerPayments(shiftId);
    const expenses = await getShiftExpenses(shiftId);

    return calculateShiftSummary({
      trays,
      products,
      movements,
      payments,
      expenses,
      actualCash
    });
  }

  /**
   * Closes a shift, saves the calculated financial results, records closing inventory movements,
   * and creates an audit log.
   */
  static async closeShift(shiftId: number, actualCashHanded: number, cashierId: number, notes?: string): Promise<ShiftSummaryCalculation> {
    const summary = await this.getShiftSummary(shiftId, actualCashHanded);

    // Save CLOSING stock movements for each product so the next shift can inherit it (§11 & §12)
    for (const prod of summary.productSummaries) {
      await addInventoryMovement({
        shiftId,
        productId: prod.productId,
        movementType: 'CLOSING',
        quantity: prod.remainingQty,
        purchasePriceAtTime: prod.purchasePrice,
        sellingPriceAtTime: prod.sellingPrice,
        userId: cashierId,
        notes: `مخزون متبقي في نهاية الوردية (${prod.remainingQty} قطعة)`
      });
    }

    // Update shift record to CLOSED
    await updateShiftClosedData(shiftId, {
      totalBreadRevenue: summary.breadRevenue,
      totalExternalRevenue: summary.externalRevenue,
      totalExternalCost: summary.externalCost,
      totalWorkerPayments: summary.workerPayments,
      totalOtherExpenses: summary.otherExpenses,
      netAmount: summary.netAmount,
      actualCashHanded,
      cashDifference: summary.cashDifference,
      notes
    });

    await addAuditLog({
      userId: cashierId,
      action: 'SHIFT_CLOSED',
      entityType: 'shift',
      entityId: String(shiftId),
      newValue: {
        actualCashHanded,
        expectedCash: summary.expectedCash,
        cashDifference: summary.cashDifference,
        netAmount: summary.netAmount
      }
    });

    return summary;
  }
}
