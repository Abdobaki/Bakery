import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('bakery_v1.db');
  await initTables(dbInstance);
  return dbInstance;
}

async function initTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_settings (
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
    );

    CREATE TABLE IF NOT EXISTS users (
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
    );

    CREATE TABLE IF NOT EXISTS bread_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      current_price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS bread_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      bread_type_id INTEGER NOT NULL,
      price REAL NOT NULL,
      effective_from TEXT NOT NULL DEFAULT (datetime('now')),
      effective_to TEXT,
      changed_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS external_products (
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
    );

    CREATE TABLE IF NOT EXISTS external_product_price_history (
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
    );

    CREATE TABLE IF NOT EXISTS shifts (
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
    );

    CREATE TABLE IF NOT EXISTS bread_trays (
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
    );

    CREATE TABLE IF NOT EXISTS bread_tray_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      tray_id INTEGER NOT NULL,
      bread_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price_at_time REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
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
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'DAILY',
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS worker_payments (
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
    );

    CREATE TABLE IF NOT EXISTS expenses (
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
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
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
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
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
    );
  `);

  await seedInitialData(db);
}

async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  const settingsRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM app_settings;');
  if (settingsRow && settingsRow.count > 0) return;

  // Insert default App Settings
  await db.runAsync(
    `INSERT INTO app_settings (id, bakery_name, address, phone, currency, currency_code, uuid)
     VALUES ('main', 'مخبزة الأصالة', 'الجزائر العاصمة', '0550000000', 'د.ج', 'DZD', 'sett-001');`
  );

  // Insert default Users (Owner + 2 Cashiers)
  await db.runAsync(`
    INSERT INTO users (uuid, username, display_name, pin_hash, role) VALUES
    ('u-1', 'owner', 'صاحب المخبزة (المالك)', '1234', 'OWNER'),
    ('u-2', 'ahmed', 'أحمد (أمين صندوق صباحي)', '0000', 'CASHIER'),
    ('u-3', 'mohamed', 'محمد (أمين صندوق مسائي)', '1111', 'CASHIER');
  `);

  // Insert Bread types
  await db.runAsync(`
    INSERT INTO bread_types (uuid, name, current_price, sort_order) VALUES
    ('b-1', 'خبز عادي (Pain ordinaire)', 15, 1),
    ('b-2', 'خبز سيپار (Seppar)', 15, 2),
    ('b-3', 'خبز سميد (Pain de semoule)', 20, 3),
    ('b-4', 'خبز مدور (Round bread)', 25, 4);
  `);

  // Insert External products
  await db.runAsync(`
    INSERT INTO external_products (uuid, name, purchase_price, selling_price, sort_order) VALUES
    ('p-1', 'كسرة (Kesra)', 35, 50, 1),
    ('p-2', 'بيتزا كاري (Pizza carré)', 40, 60, 2),
    ('p-3', 'كرواسون (Croissant)', 30, 45, 3);
  `);

  // Insert Workers
  await db.runAsync(`
    INSERT INTO workers (uuid, name, payment_type) VALUES
    ('w-1', 'علي الخباز', 'DAILY'),
    ('w-2', 'مصطفى المساعد', 'DAILY');
  `);
}
