-- ============================================
-- BAKERY MANAGEMENT SYSTEM - PRODUCTION SUPABASE SQL SCHEMA
-- Copy & Paste this into your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    bakery_name TEXT NOT NULL DEFAULT 'مخبزة الأصالة',
    address TEXT,
    phone TEXT,
    currency TEXT NOT NULL DEFAULT 'د.ج',
    currency_code TEXT NOT NULL DEFAULT 'DZD',
    morning_shift_name TEXT NOT NULL DEFAULT 'الوردية الصباحية',
    evening_shift_name TEXT NOT NULL DEFAULT 'الوردية المسائية',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uuid UUID UNIQUE DEFAULT uuid_generate_v4()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    pin_hash TEXT,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'CASHIER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bread Types Table
CREATE TABLE IF NOT EXISTS public.bread_types (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL CHECK (current_price > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bread Price History Table
CREATE TABLE IF NOT EXISTS public.bread_price_history (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    bread_type_id BIGINT REFERENCES public.bread_types(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    changed_by_user_id BIGINT REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. External Products Table
CREATE TABLE IF NOT EXISTS public.external_products (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. External Product Price History Table
CREATE TABLE IF NOT EXISTS public.external_product_price_history (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES public.external_products(id) ON DELETE CASCADE,
    purchase_price NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    changed_by_user_id BIGINT REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('MORNING', 'EVENING')),
    cashier_id BIGINT REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    total_bread_revenue NUMERIC(12, 2),
    total_external_revenue NUMERIC(12, 2),
    total_external_cost NUMERIC(12, 2),
    total_worker_payments NUMERIC(12, 2),
    total_other_expenses NUMERIC(12, 2),
    net_amount NUMERIC(12, 2),
    actual_cash_handed NUMERIC(12, 2),
    cash_difference NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Bread Trays Table
CREATE TABLE IF NOT EXISTS public.bread_trays (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
    tray_number INT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by_user_id BIGINT REFERENCES public.users(id),
    notes TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Bread Tray Items Table
CREATE TABLE IF NOT EXISTS public.bread_tray_items (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    tray_id BIGINT REFERENCES public.bread_trays(id) ON DELETE CASCADE,
    bread_type_id BIGINT REFERENCES public.bread_types(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_time NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.external_products(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('OPENING', 'RECEIVED', 'SOLD', 'ADJUSTMENT', 'CLOSING')),
    quantity INT NOT NULL,
    purchase_price_at_time NUMERIC(10, 2) NOT NULL,
    selling_price_at_time NUMERIC(10, 2) NOT NULL,
    recorded_by_user_id BIGINT REFERENCES public.users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Workers Table
CREATE TABLE IF NOT EXISTS public.workers (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'DAILY' CHECK (payment_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'OTHER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Worker Payments Table
CREATE TABLE IF NOT EXISTS public.worker_payments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
    worker_id BIGINT REFERENCES public.workers(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL,
    recorded_by_user_id BIGINT REFERENCES public.users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    shift_id BIGINT REFERENCES public.shifts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN (
        'INGREDIENTS', 'FLOUR', 'YEAST', 'OIL', 'ELECTRICITY',
        'REPAIRS', 'CLEANING', 'MAINTENANCE', 'TRANSPORTATION',
        'EQUIPMENT', 'OTHER'
    )),
    recorded_by_user_id BIGINT REFERENCES public.users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    receipt_photo_uri TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Daily Reports Table
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_bread_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_external_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_external_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_worker_payments NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_other_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_actual_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_cash_difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
    morning_shift_id BIGINT REFERENCES public.shifts(id),
    evening_shift_id BIGINT REFERENCES public.shifts(id),
    report_pdf_uri TEXT,
    generated_at TIMESTAMPTZ,
    generated_by_user_id BIGINT REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SEED DEFAULT DATA
-- ============================================

INSERT INTO public.app_settings (id, bakery_name, address, phone, currency, currency_code)
VALUES ('main', 'مخبزة الأصالة', 'الجزائر العاصمة', '0550000000', 'د.ج', 'DZD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (uuid, username, display_name, pin_hash, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'owner', 'صاحب المخبزة', '1234', 'OWNER'),
    ('22222222-2222-2222-2222-222222222222', 'cashier1', 'أحمد (أمين الصندوق الصباحي)', '0000', 'CASHIER'),
    ('33333333-3333-3333-3333-333333333333', 'cashier2', 'محمد (أمين الصندوق المسائي)', '1111', 'CASHIER')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.bread_types (uuid, name, current_price, sort_order)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'خبز عادي (Pain ordinaire)', 15.00, 1),
    ('a2222222-2222-2222-2222-222222222222', 'خبز سيپار (Seppar)', 15.00, 2),
    ('a3333333-3333-3333-3333-333333333333', 'خبز سميد (Pain de semoule)', 20.00, 3),
    ('a4444444-4444-4444-4444-444444444444', 'خبز مدور (Round bread)', 25.00, 4)
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO public.external_products (uuid, name, purchase_price, selling_price, sort_order)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'كسرة (Kesra)', 35.00, 50.00, 1),
    ('b2222222-2222-2222-2222-222222222222', 'بيتزا كاري (Pizza carré)', 40.00, 60.00, 2),
    ('b3333333-3333-3333-3333-333333333333', 'كرواسون (Croissant)', 30.00, 45.00, 3)
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO public.workers (uuid, name, payment_type)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'علي الخباز', 'DAILY'),
    ('c2222222-2222-2222-2222-222222222222', 'مصطفى المساعد', 'DAILY')
ON CONFLICT (uuid) DO NOTHING;
