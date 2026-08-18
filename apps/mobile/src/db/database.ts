import { Platform } from 'react-native';

let dbInstance: any = null;

export async function getDatabase(): Promise<any> {
  if (dbInstance) return dbInstance;

  if (Platform.OS === 'web') {
    dbInstance = createWebDatabaseAdapter();
    return dbInstance;
  }

  try {
    const SQLite = await import('expo-sqlite');
    dbInstance = await SQLite.openDatabaseAsync('bakery_v1.db');
    await initTablesNative(dbInstance);
    return dbInstance;
  } catch (e: any) {
    console.warn('Native SQLite init error, using web fallback:', e);
    dbInstance = createWebDatabaseAdapter();
    return dbInstance;
  }
}

async function initTablesNative(db: any): Promise<void> {
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // Ignore PRAGMA errors on platforms that do not support it
  }

  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'main',
      bakery_name TEXT NOT NULL DEFAULT 'مخبزة الأصالة',
      address TEXT,
      phone TEXT,
      currency TEXT NOT NULL DEFAULT 'د.ج',
      currency_code TEXT NOT NULL DEFAULT 'DZD',
      morning_shift_name TEXT NOT NULL DEFAULT 'الوردية الصباحية',
      evening_shift_name TEXT NOT NULL DEFAULT 'الوردية المسائية',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING',
      uuid TEXT NOT NULL UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      pin_hash TEXT,
      password_hash TEXT,
      role TEXT NOT NULL CHECK(role IN ('OWNER', 'CASHIER')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS bread_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      current_price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS bread_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      bread_type_id INTEGER NOT NULL,
      price REAL NOT NULL,
      effective_from TEXT NOT NULL DEFAULT (datetime('now')),
      effective_to TEXT,
      changed_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS external_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS external_product_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      effective_from TEXT NOT NULL DEFAULT (datetime('now')),
      effective_to TEXT,
      changed_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      shift_type TEXT NOT NULL CHECK(shift_type IN ('MORNING', 'EVENING')),
      cashier_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      total_bread_revenue REAL,
      total_external_revenue REAL,
      total_external_cost REAL,
      total_worker_payments REAL,
      total_other_expenses REAL,
      net_amount REAL,
      actual_cash_handed REAL,
      cash_difference REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS bread_trays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      shift_id INTEGER NOT NULL,
      tray_number INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      recorded_by_user_id INTEGER NOT NULL,
      notes TEXT,
      is_voided INTEGER NOT NULL DEFAULT 0,
      voided_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS bread_tray_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      tray_id INTEGER NOT NULL,
      bread_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price_at_time REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      shift_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('OPENING', 'RECEIVED', 'SOLD', 'ADJUSTMENT', 'CLOSING')),
      quantity INTEGER NOT NULL,
      purchase_price_at_time REAL NOT NULL,
      selling_price_at_time REAL NOT NULL,
      recorded_by_user_id INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      is_voided INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'DAILY',
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS worker_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      shift_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      payment_type TEXT NOT NULL,
      recorded_by_user_id INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      is_voided INTEGER NOT NULL DEFAULT 0,
      voided_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      shift_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL DEFAULT 'OTHER',
      recorded_by_user_id INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      receipt_photo_uri TEXT,
      is_voided INTEGER NOT NULL DEFAULT 0,
      voided_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL UNIQUE,
      total_bread_revenue REAL NOT NULL DEFAULT 0,
      total_external_revenue REAL NOT NULL DEFAULT 0,
      total_external_cost REAL NOT NULL DEFAULT 0,
      total_worker_payments REAL NOT NULL DEFAULT 0,
      total_other_expenses REAL NOT NULL DEFAULT 0,
      total_net_amount REAL NOT NULL DEFAULT 0,
      total_actual_cash REAL NOT NULL DEFAULT 0,
      total_cash_difference REAL NOT NULL DEFAULT 0,
      morning_shift_id INTEGER,
      evening_shift_id INTEGER,
      report_pdf_uri TEXT,
      generated_at TEXT,
      generated_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      previous_value TEXT,
      new_value TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );`
  ];

  for (const stmt of sqlStatements) {
    try {
      await db.execAsync(stmt);
    } catch (err) {
      console.warn('Table creation statement warning:', err);
    }
  }

  await seedInitialData(db);
}

async function seedInitialData(db: any): Promise<void> {
  try {
    const settingsRow = await db.getFirstAsync('SELECT COUNT(*) as count FROM app_settings;');
    if (settingsRow && settingsRow.count > 0) return;

    await db.runAsync(
      `INSERT INTO app_settings (id, bakery_name, address, phone, currency, currency_code, uuid)
       VALUES ('main', 'مخبزة الأصالة', 'الجزائر العاصمة', '0550000000', 'د.ج', 'DZD', 'sett-001');`
    );

    await db.runAsync(`
      INSERT INTO users (uuid, username, display_name, pin_hash, role) VALUES
      ('u-1', 'owner', 'صاحب المخبزة (المالك)', '1234', 'OWNER'),
      ('u-2', 'ahmed', 'أحمد (أمين صندوق صباحي)', '0000', 'CASHIER'),
      ('u-3', 'mohamed', 'محمد (أمين صندوق مسائي)', '1111', 'CASHIER');
    `);

    await db.runAsync(`
      INSERT INTO bread_types (uuid, name, current_price, sort_order) VALUES
      ('b-1', 'خبز عادي (Pain ordinaire)', 15, 1),
      ('b-2', 'خبز سيپار (Seppar)', 15, 2),
      ('b-3', 'خبز سميد (Pain de semoule)', 20, 3),
      ('b-4', 'خبز مدور (Round bread)', 25, 4);
    `);

    await db.runAsync(`
      INSERT INTO external_products (uuid, name, purchase_price, selling_price, sort_order) VALUES
      ('p-1', 'كسرة (Kesra)', 35, 50, 1),
      ('p-2', 'بيتزا كاري (Pizza carré)', 40, 60, 2),
      ('p-3', 'كرواسون (Croissant)', 30, 45, 3);
    `);

    await db.runAsync(`
      INSERT INTO workers (uuid, name, payment_type) VALUES
      ('w-1', 'علي الخباز', 'DAILY'),
      ('w-2', 'مصطفى المساعد', 'DAILY');
    `);
  } catch (e) {
    console.warn('Seed data warning:', e);
  }
}

function createWebDatabaseAdapter() {
  const store: Record<string, any[]> = {
    app_settings: [
      {
        id: 'main',
        bakery_name: 'مخبزة الأصالة',
        address: 'الجزائر العاصمة',
        phone: '0550000000',
        currency: 'د.ج',
        currency_code: 'DZD',
        morning_shift_name: 'الوردية الصباحية',
        evening_shift_name: 'الوردية المسائية',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'PENDING'
      }
    ],
    users: [
      { id: 1, uuid: 'u-1', username: 'owner', display_name: 'صاحب المخبزة (المالك)', pin_hash: '1234', role: 'OWNER', is_active: 1, created_at: '', updated_at: '', sync_status: 'PENDING' },
      { id: 2, uuid: 'u-2', username: 'ahmed', display_name: 'أحمد (أمين صندوق صباحي)', pin_hash: '0000', role: 'CASHIER', is_active: 1, created_at: '', updated_at: '', sync_status: 'PENDING' },
      { id: 3, uuid: 'u-3', username: 'mohamed', display_name: 'محمد (أمين صندوق مسائي)', pin_hash: '1111', role: 'CASHIER', is_active: 1, created_at: '', updated_at: '', sync_status: 'PENDING' }
    ],
    bread_types: [
      { id: 1, uuid: 'b-1', name: 'خبز عادي (Pain ordinaire)', current_price: 15, is_active: 1, sort_order: 1 },
      { id: 2, uuid: 'b-2', name: 'خبز سيپار (Seppar)', current_price: 15, is_active: 1, sort_order: 2 },
      { id: 3, uuid: 'b-3', name: 'خبز سميد (Pain de semoule)', current_price: 20, is_active: 1, sort_order: 3 },
      { id: 4, uuid: 'b-4', name: 'خبز مدور (Round bread)', current_price: 25, is_active: 1, sort_order: 4 }
    ],
    external_products: [
      { id: 1, uuid: 'p-1', name: 'كسرة (Kesra)', purchase_price: 35, selling_price: 50, is_active: 1, sort_order: 1 },
      { id: 2, uuid: 'p-2', name: 'بيتزا كاري (Pizza carré)', purchase_price: 40, selling_price: 60, is_active: 1, sort_order: 2 },
      { id: 3, uuid: 'p-3', name: 'كرواسون (Croissant)', purchase_price: 30, selling_price: 45, is_active: 1, sort_order: 3 }
    ],
    workers: [
      { id: 1, uuid: 'w-1', name: 'علي الخباز', payment_type: 'DAILY', is_active: 1 },
      { id: 2, uuid: 'w-2', name: 'مصطفى المساعد', payment_type: 'DAILY', is_active: 1 }
    ],
    shifts: [],
    bread_trays: [],
    bread_tray_items: [],
    inventory_movements: [],
    worker_payments: [],
    expenses: [],
    daily_reports: [],
    audit_logs: []
  };

  return {
    async execAsync() {},
    async getFirstAsync(sql: string, params: any[] = []) {
      const all = await this.getAllAsync(sql, params);
      return all[0] || null;
    },
    async getAllAsync(sql: string, params: any[] = []) {
      const lower = sql.toLowerCase();
      if (lower.includes('from app_settings')) return store.app_settings;
      if (lower.includes('from users')) return store.users;
      if (lower.includes('from bread_types')) return store.bread_types;
      if (lower.includes('from external_products')) return store.external_products;
      if (lower.includes('from workers')) return store.workers;
      if (lower.includes('from shifts')) return store.shifts;
      if (lower.includes('from bread_trays')) return store.bread_trays;
      if (lower.includes('from inventory_movements')) return store.inventory_movements;
      if (lower.includes('from worker_payments')) return store.worker_payments;
      if (lower.includes('from expenses')) return store.expenses;
      if (lower.includes('from daily_reports')) return store.daily_reports;
      if (lower.includes('from audit_logs')) return store.audit_logs;
      return [];
    },
    async runAsync(sql: string, params: any[] = []) {
      const lower = sql.toLowerCase();
      const id = Date.now();
      if (lower.includes('into shifts')) {
        const item = { id, uuid: params[0], date: params[1], shift_type: params[2], cashier_id: params[3], status: 'OPEN', started_at: new Date().toISOString() };
        store.shifts.push(item);
      } else if (lower.includes('into bread_trays')) {
        const item = { id, uuid: params[0], shift_id: params[1], tray_number: params[2], recorded_by_user_id: params[3], notes: params[4], recorded_at: new Date().toISOString() };
        store.bread_trays.push(item);
      } else if (lower.includes('into bread_tray_items')) {
        const item = { id, uuid: params[0], tray_id: params[1], bread_type_id: params[2], quantity: params[3], price_at_time: params[4] };
        store.bread_tray_items.push(item);
      } else if (lower.includes('into inventory_movements')) {
        const item = { id, uuid: params[0], shift_id: params[1], product_id: params[2], movement_type: params[3], quantity: params[4], purchase_price_at_time: params[5], selling_price_at_time: params[6], recorded_by_user_id: params[7], notes: params[8] };
        store.inventory_movements.push(item);
      } else if (lower.includes('into worker_payments')) {
        const item = { id, uuid: params[0], shift_id: params[1], worker_id: params[2], amount: params[3], payment_type: params[4], recorded_by_user_id: params[5], notes: params[6] };
        store.worker_payments.push(item);
      } else if (lower.includes('into expenses')) {
        const item = { id, uuid: params[0], shift_id: params[1], title: params[2], amount: params[3], category: params[4], recorded_by_user_id: params[5], notes: params[6] };
        store.expenses.push(item);
      }
      return { lastInsertRowId: id };
    }
  };
}
