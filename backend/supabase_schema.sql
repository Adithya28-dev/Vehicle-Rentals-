-- Supabase (PostgreSQL) Migration Schema
-- Execute this file inside your Supabase project's SQL Editor to set up your tables.

-- Drop tables if they exist (in reverse order of dependencies) to prevent foreign key issues
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS vehicle_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'user',
    profile_pic TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicle Types Table
CREATE TABLE vehicle_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 3. Locations Table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    is_active INTEGER DEFAULT 1
);

-- 4. Packages Table
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    duration_hours INTEGER NOT NULL,
    discount_pct REAL DEFAULT 0,
    description TEXT
);

-- 5. Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
    category TEXT NOT NULL CHECK(category IN ('self_drive', 'with_driver')),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    price_per_hour REAL NOT NULL,
    price_per_day REAL NOT NULL,
    price_per_week REAL,
    price_per_month REAL,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'booked', 'maintenance')),
    image_url TEXT,
    image_url2 TEXT,
    image_url3 TEXT,
    description TEXT,
    fuel_type TEXT DEFAULT 'Petrol',
    transmission TEXT DEFAULT 'Manual',
    seats INTEGER DEFAULT 5,
    ac INTEGER DEFAULT 1,
    lat REAL,
    lng REAL,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Coupons Table
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_pct REAL NOT NULL,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    min_amount REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    package_id INTEGER REFERENCES packages(id),
    pickup_location_id INTEGER REFERENCES locations(id),
    drop_location_id INTEGER REFERENCES locations(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_hours REAL,
    base_price REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    coupon_code TEXT,
    special_requests TEXT,
    with_driver INTEGER DEFAULT 0,
    driving_license TEXT,
    personal_rc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
    method TEXT NOT NULL CHECK(method IN ('card', 'upi', 'cash')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_id TEXT,
    card_last4 TEXT,
    upi_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Invoices Table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
    invoice_number TEXT NOT NULL UNIQUE,
    pdf_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    booking_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, booking_id)
);

-- 11. Support Messages Table
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id), -- NULL means send to admin
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
