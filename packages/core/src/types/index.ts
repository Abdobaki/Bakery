export type UserRole = 'OWNER' | 'CASHIER';

export type ShiftType = 'MORNING' | 'EVENING';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type MovementType = 'OPENING' | 'RECEIVED' | 'SOLD' | 'ADJUSTMENT' | 'CLOSING';

export type WorkerPaymentType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'OTHER';

export type ExpenseCategory =
  | 'INGREDIENTS'
  | 'FLOUR'
  | 'YEAST'
  | 'OIL'
  | 'ELECTRICITY'
  | 'REPAIRS'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'TRANSPORTATION'
  | 'EQUIPMENT'
  | 'OTHER';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface User {
  id: number;
  uuid: string;
  username: string;
  displayName: string;
  pinHash?: string;
  passwordHash?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface AppSettings {
  id: string;
  bakeryName: string;
  address?: string;
  phone?: string;
  currency: string;
  currencyCode: string;
  morningShiftName: string;
  eveningShiftName: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface BreadType {
  id: number;
  uuid: string;
  name: string;
  currentPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface BreadPriceHistory {
  id: number;
  uuid: string;
  breadTypeId: number;
  price: number;
  effectiveFrom: string;
  effectiveTo?: string;
  changedByUserId?: number;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface ExternalProduct {
  id: number;
  uuid: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Shift {
  id: number;
  uuid: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  cashierId: number;
  status: ShiftStatus;
  startedAt: string;
  closedAt?: string;
  totalBreadRevenue?: number;
  totalExternalRevenue?: number;
  totalExternalCost?: number;
  totalWorkerPayments?: number;
  totalOtherExpenses?: number;
  netAmount?: number;
  actualCashHanded?: number;
  cashDifference?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface BreadTray {
  id: number;
  uuid: string;
  shiftId: number;
  trayNumber: number;
  recordedAt: string;
  recordedByUserId: number;
  notes?: string;
  isVoided: boolean;
  voidedReason?: string;
  createdAt: string;
  syncStatus: SyncStatus;
  items?: BreadTrayItem[];
}

export interface BreadTrayItem {
  id: number;
  uuid: string;
  trayId: number;
  breadTypeId: number;
  breadTypeName?: string;
  quantity: number;
  priceAtTime: number;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface InventoryMovement {
  id: number;
  uuid: string;
  shiftId: number;
  productId: number;
  productName?: string;
  movementType: MovementType;
  quantity: number;
  purchasePriceAtTime: number;
  sellingPriceAtTime: number;
  recordedByUserId: number;
  recordedAt: string;
  notes?: string;
  isVoided: boolean;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface ProductInventorySummary {
  productId: number;
  productName: string;
  purchasePrice: number;
  sellingPrice: number;
  openingQty: number;
  addedQty: number;
  soldQty: number;
  remainingQty: number;
  costOfSold: number;
  revenueOfSold: number;
  profitOfSold: number;
}

export interface Worker {
  id: number;
  uuid: string;
  name: string;
  paymentType: WorkerPaymentType;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface WorkerPayment {
  id: number;
  uuid: string;
  shiftId: number;
  workerId: number;
  workerName?: string;
  amount: number;
  paymentType: string;
  recordedByUserId: number;
  recordedAt: string;
  notes?: string;
  isVoided: boolean;
  voidedReason?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface Expense {
  id: number;
  uuid: string;
  shiftId: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  recordedByUserId: number;
  recordedAt: string;
  notes?: string;
  receiptPhotoUri?: string;
  isVoided: boolean;
  voidedReason?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface ShiftSummaryCalculation {
  breadRevenue: number;
  externalRevenue: number;
  externalCost: number;
  externalProfit: number;
  workerPayments: number;
  otherExpenses: number;
  netAmount: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  breadTotalsByType: Record<string, { quantity: number; revenue: number }>;
  productSummaries: ProductInventorySummary[];
}

export interface DailyReport {
  id: number;
  uuid: string;
  date: string;
  totalBreadRevenue: number;
  totalExternalRevenue: number;
  totalExternalCost: number;
  totalWorkerPayments: number;
  totalOtherExpenses: number;
  totalNetAmount: number;
  totalActualCash: number;
  totalCashDifference: number;
  morningShiftId?: number;
  eveningShiftId?: number;
  reportPdfUri?: string;
  generatedAt?: string;
  generatedByUserId?: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface AuditLog {
  id: number;
  uuid: string;
  userId: number;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  syncStatus: SyncStatus;
}
