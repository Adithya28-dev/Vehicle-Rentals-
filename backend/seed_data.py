import sqlite3
from werkzeug.security import generate_password_hash
from init_db import init_db, get_db
from datetime import datetime, timedelta

def seed():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Seed vehicle types
    types = [('Car',), ('Bike',)]
    cursor.executemany("INSERT OR IGNORE INTO vehicle_types (name) VALUES (?)", types)

    # Seed locations (Hyderabad)
    locations = [
        ('Hyderabad', 'Banjara Hills', 'Road No. 12, Banjara Hills', 17.4126, 78.4483),
        ('Hyderabad', 'Jubilee Hills', 'Film Nagar, Jubilee Hills', 17.4317, 78.4082),
        ('Hyderabad', 'Hitech City', 'Madhapur, Hitech City', 17.4435, 78.3772),
        ('Hyderabad', 'Gachibowli', 'Financial District, Gachibowli', 17.4401, 78.3489),
        ('Hyderabad', 'Secunderabad', 'Station Road, Secunderabad', 17.4344, 78.4983),
        ('Hyderabad', 'Kukatpally', 'KPHB Colony, Kukatpally', 17.4947, 78.3996),
        ('Hyderabad', 'Ameerpet', 'SR Nagar, Ameerpet', 17.4378, 78.4483),
        ('Hyderabad', 'Begumpet', 'Raj Bhavan Road, Begumpet', 17.4418, 78.4679),
        ('Hyderabad', 'Kondapur', 'Kondapur Main Road', 17.4600, 78.3574),
        ('Hyderabad', 'Madhapur', 'Durgam Cheruvu, Madhapur', 17.4502, 78.3918),
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO locations (city, area, address, lat, lng) VALUES (?, ?, ?, ?, ?)",
        locations
    )

    # Seed packages
    packages = [
        ('Hourly', 1, 0, 'Pay per hour — perfect for short trips'),
        ('Daily', 24, 10, 'Full day rental with 10% discount'),
        ('Weekend Special', 48, 15, '48-hour rental perfect for weekend getaways with 15% discount'),
        ('Business Trip', 72, 12, '3-day rental tailored for business needs with 12% discount'),
        ('Long Vacation', 120, 25, '5-day rental for extended travels with a massive 25% discount'),
        ('Weekly', 168, 20, '7-day rental with 20% discount'),
        ('Monthly', 720, 35, '30-day rental with 35% discount'),
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO packages (name, duration_hours, discount_pct, description) VALUES (?, ?, ?, ?)",
        packages
    )

    # Admin user
    admin_hash = generate_password_hash('Admin@123')
    cursor.execute('''
        INSERT INTO users (name, email, password_hash, phone, role)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET role='admin', password_hash=excluded.password_hash
    ''', ('Admin', 'admin@carrentalshyd.com', admin_hash, '9000000000', 'admin'))

    # Demo user
    user_hash = generate_password_hash('User@123')
    cursor.execute('''
        INSERT OR IGNORE INTO users (name, email, password_hash, phone, role)
        VALUES (?, ?, ?, ?, ?)
    ''', ('Rajesh Kumar', 'user@carrentalshyd.com', user_hash, '9876543210', 'user'))

    # Seed vehicles - Cars (Self Drive)
    cars_self_drive = [
        ('Maruti Swift', 'Maruti', 'Swift VXI', 2023, 1, 'self_drive', 1, 80, 700, 4200, 14000, 'available',
         '/api/uploads/swift.jpg', 'Petrol', 'Manual', 5, 1, 'Compact hatchback perfect for city rides. Great mileage and easy parking.'),
        ('Hyundai i20', 'Hyundai', 'i20 Sportz', 2023, 1, 'self_drive', 2, 100, 900, 5500, 18000, 'available',
         '/api/uploads/i20.jpg', 'Petrol', 'Manual', 5, 1, 'Stylish premium hatchback with modern features and comfortable ride.'),
        ('Honda City', 'Honda', 'City ZX CVT', 2024, 1, 'self_drive', 3, 150, 1300, 8000, 26000, 'available',
         '/api/uploads/honda_city.png', 'Petrol', 'Automatic', 5, 1, 'Premium sedan with CVT gearbox, perfect for long drives and highway travel.'),
        ('Toyota Innova', 'Toyota', 'Innova Crysta GX', 2023, 1, 'self_drive', 4, 200, 1800, 11000, 36000, 'available',
         '/api/uploads/toyota_innova.jpeg', 'Diesel', 'Manual', 7, 1, 'Spacious MPV for family trips. Powerful diesel engine with great cargo space.'),
        ('Hyundai Creta', 'Hyundai', 'Creta SX', 2024, 1, 'self_drive', 5, 180, 1600, 9500, 31000, 'available',
         '/api/uploads/creta.jpg', 'Petrol', 'Automatic', 5, 1, 'Top-selling SUV in India with premium interiors and panoramic sunroof.'),
        ('Kia Seltos', 'Kia', 'Seltos HTX', 2024, 1, 'self_drive', 6, 170, 1500, 9000, 30000, 'available',
         '/api/uploads/seltos.jpg', 'Petrol', 'Automatic', 5, 1, 'Feature-packed SUV with large touchscreen, ADAS, and sporty design.'),
        ('Tata Nexon EV', 'Tata', 'Nexon EV Max', 2024, 1, 'self_drive', 7, 160, 1400, 8500, 28000, 'available',
         '/api/uploads/nexon_ev_v2.jpeg', 'Electric', 'Automatic', 5, 1, 'India\'s best-selling electric car. Zero emissions, fast charging support.'),
        ('Maruti Ertiga', 'Maruti', 'Ertiga ZXi Plus', 2023, 1, 'self_drive', 8, 140, 1200, 7200, 24000, 'available',
         '/api/uploads/ertiga.jpg', 'Petrol', 'Automatic', 7, 1, 'Comfortable 7-seater MPV, ideal for family outings and group travel.'),
    ]

    for v in cars_self_drive:
        cursor.execute('''
            INSERT OR IGNORE INTO vehicles
            (name, brand, model, year, type_id, category, location_id, price_per_hour, price_per_day,
             price_per_week, price_per_month, status, image_url, fuel_type, transmission, seats, ac, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', v)

    # Cars with Driver
    cars_with_driver = [
        ('Toyota Camry + Driver', 'Toyota', 'Camry Hybrid', 2024, 1, 'with_driver', 1, 300, 2500, 15000, 50000, 'available',
         '/api/uploads/camry.jpg', 'Hybrid', 'Automatic', 5, 1, 'Luxury sedan with experienced professional driver. Perfect for business travel.'),
        ('Mercedes C-Class + Driver', 'Mercedes', 'C 220d', 2023, 1, 'with_driver', 3, 500, 4000, 24000, 80000, 'available',
         '/api/uploads/mercedes.jpg', 'Diesel', 'Automatic', 5, 1, 'Arrive in style with our luxury Mercedes sedan and a trained chauffeur.'),
        ('Innova Crysta + Driver', 'Toyota', 'Innova Crysta ZX', 2024, 1, 'with_driver', 2, 250, 2200, 13000, 42000, 'available',
         '/api/uploads/innova_crysta.jpeg', 'Diesel', 'Automatic', 7, 1, 'Spacious MPV with professional driver, perfect for airport transfers and outstation.'),
    ]

    for v in cars_with_driver:
        cursor.execute('''
            INSERT OR IGNORE INTO vehicles
            (name, brand, model, year, type_id, category, location_id, price_per_hour, price_per_day,
             price_per_week, price_per_month, status, image_url, fuel_type, transmission, seats, ac, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', v)

    # Bikes (Self Drive)
    bikes = [
        ('Royal Enfield Classic 350', 'Royal Enfield', 'Classic 350', 2023, 2, 'self_drive', 9, 60, 500, 3000, 10000, 'available',
         '/api/uploads/classic_350.jpg', 'Petrol', 'Manual', 2, 0, 'Iconic retro-styled motorcycle. Thunderous sound, great for highway cruising.'),
        ('Honda Activa 6G', 'Honda', 'Activa 6G', 2023, 2, 'self_drive', 10, 30, 250, 1500, 5000, 'available',
         '/api/uploads/activa_6g.jpeg', 'Petrol', 'Automatic', 2, 0, 'India\'s most popular scooter. Easy to ride, fuel efficient, ideal for city commutes.'),
        ('Bajaj Pulsar NS200', 'Bajaj', 'Pulsar NS200', 2024, 2, 'self_drive', 1, 50, 420, 2500, 8500, 'available',
         '/api/uploads/pulsar.jpg', 'Petrol', 'Manual', 2, 0, 'Sporty naked streetfighter with liquid-cooled engine. Thrill in every ride.'),
        ('TVS Apache RTR 160', 'TVS', 'Apache RTR 160 4V', 2023, 2, 'self_drive', 2, 40, 350, 2100, 7000, 'available',
         '/api/uploads/apache.avif', 'Petrol', 'Manual', 2, 0, 'Sporty commuter motorcycle with aggressive looks and race-tuned performance.'),
        ('Yamaha R15 V4', 'Yamaha', 'YZF R15 V4', 2024, 2, 'self_drive', 3, 70, 600, 3600, 12000, 'available',
         '/api/uploads/r15.avif', 'Petrol', 'Manual', 2, 0, 'Full-faired supersport with VVA technology. Track-inspired performance meets everyday use.'),
        ('Ola S1 Pro Electric', 'Ola', 'S1 Pro', 2024, 2, 'self_drive', 7, 35, 290, 1750, 5800, 'available',
         '/api/uploads/ola_s1_v2.avif', 'Electric', 'Automatic', 2, 0, 'India\'s top electric scooter. 195km range, fast charging, connected features.'),
    ]

    for b in bikes:
        cursor.execute('''
            INSERT OR IGNORE INTO vehicles
            (name, brand, model, year, type_id, category, location_id, price_per_hour, price_per_day,
             price_per_week, price_per_month, status, image_url, fuel_type, transmission, seats, ac, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', b)

    # Seed coupons
    future_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d %H:%M:%S')
    coupons = [
        ('FIRST10', 10, 1000, 0, future_date, 0, 1),
        ('RIDE20', 20, 500, 0, future_date, 500, 1),
        ('WEEKLY25', 25, 200, 0, future_date, 1000, 1),
        ('ADMIN50', 50, 10, 0, future_date, 2000, 1),
        ('NEWUSER15', 15, 500, 0, future_date, 200, 1),
    ]
    cursor.executemany('''
        INSERT OR IGNORE INTO coupons (code, discount_pct, max_uses, uses_count, valid_until, min_amount, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', coupons)

    conn.commit()
    conn.close()
    print("✅ Seed data inserted successfully!")
    print("\n📋 Demo Credentials:")
    print("   Admin: admin@carrentalshyd.com / Admin@123")
    print("   User:  user@carrentalshyd.com  / User@123")
    print("\n🎟️ Coupon Codes: FIRST10, RIDE20, WEEKLY25, NEWUSER15")

if __name__ == '__main__':
    seed()
