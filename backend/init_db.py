import sqlite3
import os
from config import Config

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(Config.DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize the database with all tables."""
    conn = get_db()
    cursor = conn.cursor()

    # Create upload directories
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.INVOICE_FOLDER, exist_ok=True)

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'user',
            profile_pic TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Vehicle types table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicle_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    ''')

    # Locations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            area TEXT NOT NULL,
            address TEXT,
            lat REAL,
            lng REAL,
            is_active INTEGER DEFAULT 1
        )
    ''')

    # Packages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            duration_hours INTEGER NOT NULL,
            discount_pct REAL DEFAULT 0,
            description TEXT
        )
    ''')

    # Vehicles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT,
            model TEXT,
            year INTEGER,
            type_id INTEGER NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('self_drive', 'with_driver')),
            location_id INTEGER NOT NULL,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (type_id) REFERENCES vehicle_types(id),
            FOREIGN KEY (location_id) REFERENCES locations(id)
        )
    ''')

    # Coupons table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            discount_pct REAL NOT NULL,
            max_uses INTEGER DEFAULT 100,
            uses_count INTEGER DEFAULT 0,
            valid_until TIMESTAMP,
            min_amount REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vehicle_id INTEGER NOT NULL,
            package_id INTEGER,
            pickup_location_id INTEGER,
            drop_location_id INTEGER,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
            FOREIGN KEY (package_id) REFERENCES packages(id),
            FOREIGN KEY (pickup_location_id) REFERENCES locations(id),
            FOREIGN KEY (drop_location_id) REFERENCES locations(id)
        )
    ''')

    # Payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL UNIQUE,
            method TEXT NOT NULL CHECK(method IN ('card', 'upi', 'cash')),
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
            transaction_id TEXT,
            card_last4 TEXT,
            upi_id TEXT,
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
    ''')

    # Invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL UNIQUE,
            invoice_number TEXT NOT NULL UNIQUE,
            pdf_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
    ''')

    # Reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vehicle_id INTEGER NOT NULL,
            booking_id INTEGER,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
            UNIQUE(user_id, booking_id)
        )
    ''')

    # Support Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS support_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER, -- NULL means send to admin
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
