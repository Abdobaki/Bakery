import {
  AppSettings,
  AuditLog,
  BreadTray,
  BreadTrayItem,
  BreadType,
  DailyReport,
  Expense,
  ExternalProduct,
  InventoryMovement,
  Shift,
  User,
  Worker,
  WorkerPayment
} from '@bakery/core';
import { generateUUID } from '@bakery/core';
import { getDatabase } from './database';

// ============================================
// APP SETTINGS & USERS
// ============================================

export async function getAppSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM app_settings WHERE id = "main"');
  if (!row) {
    return {
      id: 'main',
      bakeryName: 'مخبزة الأصالة',
      address: '',
      phone: '',
      currency: 'د.ج',
      currencyCode: 'DZD',
      morningShiftName: 'الوردية الصباحية',
      eveningShiftName: 'الوردية المسائية',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'PENDING'
    };
  }
  return {
    id: row.id,
    bakeryName: row.bakery_name,
    address: row.address,
    phone: row.phone,
    currency: row.currency,
    currencyCode: row.currency_code,
    morningShiftName: row.morning_shift_name,
    eveningShiftName: row.evening_shift_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status
  };
}

export async function updateAppSettings(data: Partial<AppSettings>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE app_settings SET 
      bakery_name = COALESCE(?, bakery_name),
      address = COALESCE(?, address),
      phone = COALESCE(?, phone),
      currency = COALESCE(?, currency),
      morning_shift_name = COALESCE(?, morning_shift_name),
      evening_shift_name = COALESCE(?, evening_shift_name),
      updated_at = datetime('now')
    WHERE id = 'main'`,
    [data.bakeryName, data.address, data.phone, data.currency, data.morningShiftName, data.eveningShiftName]
  );
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM users WHERE is_active = 1 ORDER BY id ASC');
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    username: r.username,
    displayName: r.display_name,
    pinHash: r.pin_hash,
    passwordHash: r.password_hash,
    role: r.role,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status
  }));
}

export async function addUser(user: { username: string; displayName: string; pin: string; role: 'OWNER' | 'CASHIER' }): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const result = await db.runAsync(
    `INSERT INTO users (uuid, username, display_name, pin_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [uuid, user.username, user.displayName, user.pin, user.role]
  );
  return result.lastInsertRowId;
}

// ============================================
// BREAD TYPES
// ============================================

export async function getBreadTypes(): Promise<BreadType[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM bread_types WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    name: r.name,
    currentPrice: r.current_price,
    isActive: Boolean(r.is_active),
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status
  }));
}

export async function addBreadType(name: string, price: number): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO bread_types (uuid, name, current_price) VALUES (?, ?, ?)`,
    [uuid, name, price]
  );
  return res.lastInsertRowId;
}

export async function updateBreadTypePrice(breadTypeId: number, newPrice: number, userId: number): Promise<void> {
  const db = await getDatabase();
  // Update price in bread_types
  await db.runAsync(`UPDATE bread_types SET current_price = ?, updated_at = datetime('now') WHERE id = ?`, [newPrice, breadTypeId]);
  // Insert price history entry for auditability
  const uuid = generateUUID();
  await db.runAsync(
    `INSERT INTO bread_price_history (uuid, bread_type_id, price, changed_by_user_id) VALUES (?, ?, ?, ?)`,
    [uuid, breadTypeId, newPrice, userId]
  );
}

// ============================================
// EXTERNAL PRODUCTS
// ============================================

export async function getExternalProducts(): Promise<ExternalProduct[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM external_products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    name: r.name,
    purchasePrice: r.purchase_price,
    sellingPrice: r.selling_price,
    isActive: Boolean(r.is_active),
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status
  }));
}

export async function addExternalProduct(name: string, purchasePrice: number, sellingPrice: number): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO external_products (uuid, name, purchase_price, selling_price) VALUES (?, ?, ?, ?)`,
    [uuid, name, purchasePrice, sellingPrice]
  );
  return res.lastInsertRowId;
}

export async function updateExternalProductPrices(productId: number, purchasePrice: number, sellingPrice: number, userId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE external_products SET purchase_price = ?, selling_price = ?, updated_at = datetime('now') WHERE id = ?`,
    [purchasePrice, sellingPrice, productId]
  );
  const uuid = generateUUID();
  await db.runAsync(
    `INSERT INTO external_product_price_history (uuid, product_id, purchase_price, selling_price, changed_by_user_id) VALUES (?, ?, ?, ?, ?)`,
    [uuid, productId, purchasePrice, sellingPrice, userId]
  );
}

// ============================================
// SHIFTS
// ============================================

export async function getActiveShift(): Promise<Shift | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM shifts WHERE status = "OPEN" LIMIT 1');
  if (!row) return null;
  return mapShiftRow(row);
}

export async function getShiftById(shiftId: number): Promise<Shift | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM shifts WHERE id = ?', [shiftId]);
  if (!row) return null;
  return mapShiftRow(row);
}

export async function getAllShifts(limit = 30): Promise<Shift[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM shifts ORDER BY id DESC LIMIT ?', [limit]);
  return rows.map(mapShiftRow);
}

export async function createShift(date: string, shiftType: 'MORNING' | 'EVENING', cashierId: number): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO shifts (uuid, date, shift_type, cashier_id, status, started_at) VALUES (?, ?, ?, ?, 'OPEN', datetime('now'))`,
    [uuid, date, shiftType, cashierId]
  );
  return res.lastInsertRowId;
}

export async function updateShiftClosedData(shiftId: number, totals: {
  totalBreadRevenue: number;
  totalExternalRevenue: number;
  totalExternalCost: number;
  totalWorkerPayments: number;
  totalOtherExpenses: number;
  netAmount: number;
  actualCashHanded: number;
  cashDifference: number;
  notes?: string;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE shifts SET
      status = 'CLOSED',
      closed_at = datetime('now'),
      total_bread_revenue = ?,
      total_external_revenue = ?,
      total_external_cost = ?,
      total_worker_payments = ?,
      total_other_expenses = ?,
      net_amount = ?,
      actual_cash_handed = ?,
      cash_difference = ?,
      notes = ?,
      updated_at = datetime('now')
    WHERE id = ?`,
    [
      totals.totalBreadRevenue,
      totals.totalExternalRevenue,
      totals.totalExternalCost,
      totals.totalWorkerPayments,
      totals.totalOtherExpenses,
      totals.netAmount,
      totals.actualCashHanded,
      totals.cashDifference,
      totals.notes || null,
      shiftId
    ]
  );
}

function mapShiftRow(row: any): Shift {
  return {
    id: row.id,
    uuid: row.uuid,
    date: row.date,
    shiftType: row.shift_type,
    cashierId: row.cashier_id,
    status: row.status,
    startedAt: row.started_at,
    closedAt: row.closed_at,
    totalBreadRevenue: row.total_bread_revenue,
    totalExternalRevenue: row.total_external_revenue,
    totalExternalCost: row.total_external_cost,
    totalWorkerPayments: row.total_worker_payments,
    totalOtherExpenses: row.total_other_expenses,
    netAmount: row.net_amount,
    actualCashHanded: row.actual_cash_handed,
    cashDifference: row.cash_difference,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status
  };
}

// ============================================
// BREAD TRAYS
// ============================================

export async function getShiftTrays(shiftId: number): Promise<BreadTray[]> {
  const db = await getDatabase();
  const trayRows = await db.getAllAsync<any>('SELECT * FROM bread_trays WHERE shift_id = ? AND is_voided = 0 ORDER BY tray_number ASC', [shiftId]);

  const result: BreadTray[] = [];
  for (const t of trayRows) {
    const itemRows = await db.getAllAsync<any>(
      `SELECT bti.*, bt.name as bread_type_name 
       FROM bread_tray_items bti 
       LEFT JOIN bread_types bt ON bti.bread_type_id = bt.id 
       WHERE bti.tray_id = ?`,
      [t.id]
    );

    result.push({
      id: t.id,
      uuid: t.uuid,
      shiftId: t.shift_id,
      trayNumber: t.tray_number,
      recordedAt: t.recorded_at,
      recordedByUserId: t.recorded_by_user_id,
      notes: t.notes,
      isVoided: Boolean(t.is_voided),
      voidedReason: t.voided_reason,
      createdAt: t.created_at,
      syncStatus: t.sync_status,
      items: itemRows.map((i) => ({
        id: i.id,
        uuid: i.uuid,
        trayId: i.tray_id,
        breadTypeId: i.bread_type_id,
        breadTypeName: i.bread_type_name,
        quantity: i.quantity,
        priceAtTime: i.price_at_time,
        createdAt: i.created_at,
        syncStatus: i.sync_status
      }))
    });
  }

  return result;
}

export async function addBreadTray(shiftId: number, userId: number, items: { breadTypeId: number; quantity: number; priceAtTime: number }[], notes?: string): Promise<number> {
  const db = await getDatabase();
  const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bread_trays WHERE shift_id = ?', [shiftId]);
  const trayNumber = (countRow?.count || 0) + 1;

  const trayUuid = generateUUID();
  const trayRes = await db.runAsync(
    `INSERT INTO bread_trays (uuid, shift_id, tray_number, recorded_by_user_id, notes) VALUES (?, ?, ?, ?, ?)`,
    [trayUuid, shiftId, trayNumber, userId, notes || null]
  );

  const trayId = trayRes.lastInsertRowId;
  for (const item of items) {
    const itemUuid = generateUUID();
    await db.runAsync(
      `INSERT INTO bread_tray_items (uuid, tray_id, bread_type_id, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)`,
      [itemUuid, trayId, item.breadTypeId, item.quantity, item.priceAtTime]
    );
  }

  return trayId;
}

// ============================================
// INVENTORY MOVEMENTS
// ============================================

export async function getShiftInventoryMovements(shiftId: number): Promise<InventoryMovement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT im.*, ep.name as product_name 
     FROM inventory_movements im
     LEFT JOIN external_products ep ON im.product_id = ep.id
     WHERE im.shift_id = ? AND im.is_voided = 0
     ORDER BY im.id ASC`,
    [shiftId]
  );

  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    shiftId: r.shift_id,
    productId: r.product_id,
    productName: r.product_name,
    movementType: r.movement_type,
    quantity: r.quantity,
    purchasePriceAtTime: r.purchase_price_at_time,
    sellingPriceAtTime: r.selling_price_at_time,
    recordedByUserId: r.recorded_by_user_id,
    recordedAt: r.recorded_at,
    notes: r.notes,
    isVoided: Boolean(r.is_voided),
    createdAt: r.created_at,
    syncStatus: r.sync_status
  }));
}

export async function addInventoryMovement(movement: {
  shiftId: number;
  productId: number;
  movementType: 'OPENING' | 'RECEIVED' | 'SOLD' | 'ADJUSTMENT' | 'CLOSING';
  quantity: number;
  purchasePriceAtTime: number;
  sellingPriceAtTime: number;
  userId: number;
  notes?: string;
}): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO inventory_movements (uuid, shift_id, product_id, movement_type, quantity, purchase_price_at_time, selling_price_at_time, recorded_by_user_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuid,
      movement.shiftId,
      movement.productId,
      movement.movementType,
      movement.quantity,
      movement.purchasePriceAtTime,
      movement.sellingPriceAtTime,
      movement.userId,
      movement.notes || null
    ]
  );
  return res.lastInsertRowId;
}

export async function getLatestClosingInventoryMovements(): Promise<InventoryMovement[]> {
  const db = await getDatabase();
  // Get the most recent closing shift's CLOSING inventory movements
  const lastClosedShift = await db.getFirstAsync<any>('SELECT id FROM shifts WHERE status = "CLOSED" ORDER BY id DESC LIMIT 1');
  if (!lastClosedShift) return [];

  return getShiftInventoryMovements(lastClosedShift.id);
}

// ============================================
// WORKERS & PAYMENTS
// ============================================

export async function getAllWorkers(): Promise<Worker[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM workers WHERE is_active = 1 ORDER BY name ASC');
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    name: r.name,
    paymentType: r.payment_type,
    isActive: Boolean(r.is_active),
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status
  }));
}

export async function addWorker(name: string, paymentType: string): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(`INSERT INTO workers (uuid, name, payment_type) VALUES (?, ?, ?)`, [uuid, name, paymentType]);
  return res.lastInsertRowId;
}

export async function getShiftWorkerPayments(shiftId: number): Promise<WorkerPayment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT wp.*, w.name as worker_name 
     FROM worker_payments wp
     LEFT JOIN workers w ON wp.worker_id = w.id
     WHERE wp.shift_id = ? AND wp.is_voided = 0
     ORDER BY wp.id ASC`,
    [shiftId]
  );
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    shiftId: r.shift_id,
    workerId: r.worker_id,
    workerName: r.worker_name,
    amount: r.amount,
    paymentType: r.payment_type,
    recordedByUserId: r.recorded_by_user_id,
    recordedAt: r.recorded_at,
    notes: r.notes,
    isVoided: Boolean(r.is_voided),
    voidedReason: r.voided_reason,
    createdAt: r.created_at,
    syncStatus: r.sync_status
  }));
}

export async function addWorkerPayment(payment: {
  shiftId: number;
  workerId: number;
  amount: number;
  paymentType: string;
  userId: number;
  notes?: string;
}): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO worker_payments (uuid, shift_id, worker_id, amount, payment_type, recorded_by_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uuid, payment.shiftId, payment.workerId, payment.amount, payment.paymentType, payment.userId, payment.notes || null]
  );
  return res.lastInsertRowId;
}

// ============================================
// EXPENSES
// ============================================

export async function getShiftExpenses(shiftId: number): Promise<Expense[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM expenses WHERE shift_id = ? AND is_voided = 0 ORDER BY id ASC', [shiftId]);
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    shiftId: r.shift_id,
    title: r.title,
    amount: r.amount,
    category: r.category,
    recordedByUserId: r.recorded_by_user_id,
    recordedAt: r.recorded_at,
    notes: r.notes,
    receiptPhotoUri: r.receipt_photo_uri,
    isVoided: Boolean(r.is_voided),
    voidedReason: r.voided_reason,
    createdAt: r.created_at,
    syncStatus: r.sync_status
  }));
}

export async function addExpense(exp: {
  shiftId: number;
  title: string;
  amount: number;
  category: string;
  userId: number;
  notes?: string;
  receiptPhotoUri?: string;
}): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO expenses (uuid, shift_id, title, amount, category, recorded_by_user_id, notes, receipt_photo_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, exp.shiftId, exp.title, exp.amount, exp.category, exp.userId, exp.notes || null, exp.receiptPhotoUri || null]
  );
  return res.lastInsertRowId;
}

// ============================================
// DAILY REPORTS & AUDIT LOGS
// ============================================

export async function saveDailyReport(report: Partial<DailyReport>): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const res = await db.runAsync(
    `INSERT INTO daily_reports (
      uuid, date, total_bread_revenue, total_external_revenue, total_external_cost, 
      total_worker_payments, total_other_expenses, total_net_amount, total_actual_cash, 
      total_cash_difference, morning_shift_id, evening_shift_id, report_pdf_uri, generated_by_user_id, generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      total_bread_revenue = excluded.total_bread_revenue,
      total_external_revenue = excluded.total_external_revenue,
      total_external_cost = excluded.total_external_cost,
      total_worker_payments = excluded.total_worker_payments,
      total_other_expenses = excluded.total_other_expenses,
      total_net_amount = excluded.total_net_amount,
      total_actual_cash = excluded.total_actual_cash,
      total_cash_difference = excluded.total_cash_difference,
      morning_shift_id = COALESCE(excluded.morning_shift_id, morning_shift_id),
      evening_shift_id = COALESCE(excluded.evening_shift_id, evening_shift_id),
      report_pdf_uri = COALESCE(excluded.report_pdf_uri, report_pdf_uri),
      updated_at = datetime('now')`,
    [
      uuid,
      report.date,
      report.totalBreadRevenue || 0,
      report.totalExternalRevenue || 0,
      report.totalExternalCost || 0,
      report.totalWorkerPayments || 0,
      report.totalOtherExpenses || 0,
      report.totalNetAmount || 0,
      report.totalActualCash || 0,
      report.totalCashDifference || 0,
      report.morningShiftId || null,
      report.eveningShiftId || null,
      report.reportPdfUri || null,
      report.generatedByUserId || null
    ]
  );
  return res.lastInsertRowId;
}

export async function getAllDailyReports(): Promise<DailyReport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM daily_reports ORDER BY date DESC');
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    date: r.date,
    totalBreadRevenue: r.total_bread_revenue,
    totalExternalRevenue: r.total_external_revenue,
    totalExternalCost: r.total_external_cost,
    totalWorkerPayments: r.total_worker_payments,
    totalOtherExpenses: r.total_other_expenses,
    totalNetAmount: r.total_net_amount,
    totalActualCash: r.total_actual_cash,
    totalCashDifference: r.total_cash_difference,
    morningShiftId: r.morning_shift_id,
    eveningShiftId: r.evening_shift_id,
    reportPdfUri: r.report_pdf_uri,
    generatedAt: r.generated_at,
    generatedByUserId: r.generated_by_user_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status
  }));
}

export async function addAuditLog(log: { userId: number; action: string; entityType: string; entityId?: string; previousValue?: any; newValue?: any }): Promise<void> {
  const db = await getDatabase();
  const uuid = generateUUID();
  await db.runAsync(
    `INSERT INTO audit_logs (uuid, user_id, action, entity_type, entity_id, previous_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuid,
      log.userId,
      log.action,
      log.entityType,
      log.entityId || null,
      log.previousValue ? JSON.stringify(log.previousValue) : null,
      log.newValue ? JSON.stringify(log.newValue) : null
    ]
  );
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT al.*, u.display_name as user_name 
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.id DESC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    userId: r.user_id,
    userName: r.user_name,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    previousValue: r.previous_value,
    newValue: r.new_value,
    timestamp: r.timestamp,
    syncStatus: r.sync_status
  }));
}
