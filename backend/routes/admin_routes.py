"""Admin routes: vehicle CRUD, booking management, stats."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        conn = get_db()
        user = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ── Dashboard Stats ──────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    conn = get_db()
    total_vehicles = conn.execute('SELECT COUNT(*) as c FROM vehicles').fetchone()['c']
    available_vehicles = conn.execute("SELECT COUNT(*) as c FROM vehicles WHERE status='available'").fetchone()['c']
    total_bookings = conn.execute('SELECT COUNT(*) as c FROM bookings').fetchone()['c']
    pending_bookings = conn.execute("SELECT COUNT(*) as c FROM bookings WHERE status='pending'").fetchone()['c']
    confirmed_bookings = conn.execute("SELECT COUNT(*) as c FROM bookings WHERE status='confirmed'").fetchone()['c']
    total_revenue = conn.execute("SELECT COALESCE(SUM(amount), 0) as r FROM payments WHERE status='success'").fetchone()['r']
    total_users = conn.execute("SELECT COUNT(*) as c FROM users WHERE role='user'").fetchone()['c']
    total_reviews = conn.execute('SELECT COUNT(*) as c FROM reviews').fetchone()['c']

    recent_bookings = conn.execute('''
        SELECT b.id, b.status, b.total_price, b.created_at,
               u.name AS user_name, v.name AS vehicle_name
        FROM bookings b JOIN users u ON b.user_id=u.id JOIN vehicles v ON b.vehicle_id=v.id
        ORDER BY b.created_at DESC LIMIT 5
    ''').fetchall()

    monthly_revenue = conn.execute('''
        SELECT strftime('%Y-%m', paid_at) as month, SUM(amount) as revenue
        FROM payments WHERE status='success'
        GROUP BY month ORDER BY month DESC LIMIT 6
    ''').fetchall()

    conn.close()
    return jsonify({
        'stats': {
            'total_vehicles': total_vehicles,
            'available_vehicles': available_vehicles,
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'confirmed_bookings': confirmed_bookings,
            'total_revenue': round(total_revenue, 2),
            'total_users': total_users,
            'total_reviews': total_reviews
        },
        'recent_bookings': [dict(b) for b in recent_bookings],
        'monthly_revenue': [dict(r) for r in monthly_revenue]
    }), 200

# ── Vehicles ─────────────────────────────────────────────────────────────────

@admin_bp.route('/vehicles', methods=['GET'])
@admin_required
def list_all_vehicles():
    conn = get_db()
    vehicles = conn.execute('''
        SELECT v.*, vt.name AS type_name, l.area AS location_area, l.city
        FROM vehicles v
        JOIN vehicle_types vt ON v.type_id = vt.id
        JOIN locations l ON v.location_id = l.id
        WHERE v.is_deleted = 0
        ORDER BY v.id DESC
    ''').fetchall()
    conn.close()
    return jsonify({'vehicles': [dict(v) for v in vehicles]}), 200

@admin_bp.route('/vehicles', methods=['POST'])
@admin_required
def add_vehicle():
    data = request.get_json()
    required = ['name', 'type_id', 'category', 'location_id', 'price_per_hour', 'price_per_day']
    for f in required:
        if data.get(f) is None:
            return jsonify({'error': f'{f} is required'}), 400

    conn = get_db()
    cursor = conn.execute('''
        INSERT INTO vehicles (name, brand, model, year, type_id, category, location_id,
            price_per_hour, price_per_day, price_per_week, price_per_month,
            status, image_url, image_url2, image_url3, description, fuel_type, transmission, seats, ac, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'], data.get('brand', ''), data.get('model', ''), data.get('year'),
        data['type_id'], data['category'], data['location_id'],
        data['price_per_hour'], data['price_per_day'],
        data.get('price_per_week'), data.get('price_per_month'),
        data.get('status', 'available'), 
        data.get('image_url', ''), data.get('image_url2', ''), data.get('image_url3', ''),
        data.get('description', ''), data.get('fuel_type', 'Petrol'),
        data.get('transmission', 'Manual'), data.get('seats', 5),
        data.get('ac', 1), data.get('lat'), data.get('lng')
    ))
    vehicle_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'message': 'Vehicle added successfully', 'vehicle_id': vehicle_id}), 201

@admin_bp.route('/vehicles/<int:vehicle_id>', methods=['PUT'])
@admin_required
def update_vehicle(vehicle_id):
    data = request.get_json()
    conn = get_db()
    vehicle = conn.execute('SELECT id FROM vehicles WHERE id = ?', (vehicle_id,)).fetchone()
    if not vehicle:
        conn.close()
        return jsonify({'error': 'Vehicle not found'}), 404

    fields = ['name', 'brand', 'model', 'year', 'type_id', 'category', 'location_id',
              'price_per_hour', 'price_per_day', 'price_per_week', 'price_per_month',
              'status', 'image_url', 'image_url2', 'image_url3', 
              'description', 'fuel_type', 'transmission', 'seats', 'ac']
    updates = {k: data[k] for k in fields if k in data}
    if not updates:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400

    set_clause = ', '.join(f'{k} = ?' for k in updates)
    conn.execute(f'UPDATE vehicles SET {set_clause} WHERE id = ?',
                 list(updates.values()) + [vehicle_id])
    conn.commit()
    conn.close()
    return jsonify({'message': 'Vehicle updated successfully'}), 200

@admin_bp.route('/vehicles/<int:vehicle_id>', methods=['DELETE'])
@admin_required
def delete_vehicle(vehicle_id):
    conn = get_db()
    try:
        conn.execute('UPDATE vehicles SET is_deleted = 1 WHERE id = ?', (vehicle_id,))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()
    return jsonify({'message': 'Vehicle deleted successfully (soft delete)'}), 200

# ── Bookings ──────────────────────────────────────────────────────────────────

@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def list_all_bookings():
    conn = get_db()
    bookings = conn.execute('''
        SELECT b.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
               v.name AS vehicle_name, v.category,
               pay.status AS payment_status, pay.method AS payment_method, pay.amount AS paid_amount,
               inv.invoice_number
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN payments pay ON b.id = pay.booking_id
        LEFT JOIN invoices inv ON b.id = inv.booking_id
        ORDER BY b.created_at DESC
    ''').fetchall()
    conn.close()
    return jsonify({'bookings': [dict(b) for b in bookings]}), 200

@admin_bp.route('/bookings/<int:booking_id>/status', methods=['PUT'])
@admin_required
def update_booking_status(booking_id):
    data = request.get_json()
    status = data.get('status')
    if status not in ('pending', 'confirmed', 'cancelled', 'completed'):
        return jsonify({'error': 'Invalid status'}), 400

    conn = get_db()
    booking = conn.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,)).fetchone()
    if not booking:
        conn.close()
        return jsonify({'error': 'Booking not found'}), 404

    conn.execute('UPDATE bookings SET status = ? WHERE id = ?', (status, booking_id))
    if status == 'completed':
        conn.execute("UPDATE vehicles SET status = 'available' WHERE id = ?", (booking['vehicle_id'],))
    elif status == 'cancelled':
        conn.execute("UPDATE vehicles SET status = 'available' WHERE id = ?", (booking['vehicle_id'],))
        conn.execute("UPDATE payments SET status = 'refunded' WHERE booking_id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Booking status updated to {status}'}), 200

# ── Payments ──────────────────────────────────────────────────────────────────

@admin_bp.route('/payments', methods=['GET'])
@admin_required
def list_all_payments():
    conn = get_db()
    payments = conn.execute('''
        SELECT pay.*, b.start_time, b.end_time, b.total_price,
               u.name AS user_name, u.email AS user_email,
               v.name AS vehicle_name, inv.invoice_number
        FROM payments pay
        JOIN bookings b ON pay.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN invoices inv ON b.id = inv.booking_id
        ORDER BY pay.created_at DESC
    ''').fetchall()
    conn.close()
    return jsonify({'payments': [dict(p) for p in payments]}), 200

# ── Locations ─────────────────────────────────────────────────────────────────

@admin_bp.route('/locations', methods=['GET'])
@admin_required
def list_locations():
    conn = get_db()
    locs = conn.execute('SELECT * FROM locations ORDER BY area').fetchall()
    conn.close()
    return jsonify({'locations': [dict(l) for l in locs]}), 200

@admin_bp.route('/locations', methods=['POST'])
@admin_required
def add_location():
    data = request.get_json()
    conn = get_db()
    cursor = conn.execute(
        'INSERT INTO locations (city, area, address, lat, lng) VALUES (?, ?, ?, ?, ?)',
        (data.get('city', 'Hyderabad'), data['area'], data.get('address', ''),
         data.get('lat'), data.get('lng'))
    )
    loc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'message': 'Location added', 'location_id': loc_id}), 201

@admin_bp.route('/locations/<int:loc_id>', methods=['PUT'])
@admin_required
def update_location(loc_id):
    data = request.get_json()
    conn = get_db()
    conn.execute(
        'UPDATE locations SET city=?, area=?, address=?, lat=?, lng=?, is_active=? WHERE id=?',
        (data.get('city', 'Hyderabad'), data['area'], data.get('address', ''),
         data.get('lat'), data.get('lng'), data.get('is_active', 1), loc_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Location updated'}), 200

@admin_bp.route('/locations/<int:loc_id>', methods=['DELETE'])
@admin_required
def delete_location(loc_id):
    conn = get_db()
    conn.execute('UPDATE locations SET is_active = 0 WHERE id = ?', (loc_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Location deactivated'}), 200

# ── Users ─────────────────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    conn = get_db()
    users = conn.execute(
        'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    return jsonify({'users': [dict(u) for u in users]}), 200

# ── Coupons ───────────────────────────────────────────────────────────────────

@admin_bp.route('/coupons', methods=['GET'])
@admin_required
def list_coupons():
    conn = get_db()
    coupons = conn.execute('SELECT * FROM coupons ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify({'coupons': [dict(c) for c in coupons]}), 200

@admin_bp.route('/coupons', methods=['POST'])
@admin_required
def add_coupon():
    data = request.get_json()
    conn = get_db()
    try:
        cursor = conn.execute('''
            INSERT INTO coupons (code, discount_pct, max_uses, valid_until, min_amount, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        ''', (data['code'].upper(), data['discount_pct'],
              data.get('max_uses', 100), data.get('valid_until'),
              data.get('min_amount', 0)))
        coupon_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'message': 'Coupon created', 'coupon_id': coupon_id}), 201
    except Exception:
        conn.close()
        return jsonify({'error': 'Coupon code already exists'}), 409
