"""Booking routes: create, list, detail."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db
from datetime import datetime

booking_bp = Blueprint('bookings', __name__)

@booking_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ['vehicle_id', 'start_time', 'end_time']
    for f in required:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400

    vehicle_id = data['vehicle_id']
    start_time = data['start_time']
    end_time = data['end_time']
    package_id = data.get('package_id')
    coupon_code = data.get('coupon_code', '').upper().strip()
    special_requests = data.get('special_requests', '')
    pickup_location_id = data.get('pickup_location_id')
    drop_location_id = data.get('drop_location_id')

    conn = get_db()

    # Check vehicle exists and is available
    vehicle = conn.execute('SELECT * FROM vehicles WHERE id = ?', (vehicle_id,)).fetchone()
    if not vehicle:
        conn.close()
        return jsonify({'error': 'Vehicle not found'}), 404
    if vehicle['status'] != 'available':
        conn.close()
        return jsonify({'error': 'Vehicle is not available'}), 400

    # Check for overlapping bookings
    conflict = conn.execute('''
        SELECT id FROM bookings
        WHERE vehicle_id = ? AND status IN ('confirmed', 'pending')
        AND NOT (end_time <= ? OR start_time >= ?)
    ''', (vehicle_id, start_time, end_time)).fetchone()
    if conflict:
        conn.close()
        return jsonify({'error': 'Vehicle is already booked for this time period'}), 409

    # Calculate duration and price
    try:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    except ValueError:
        start_dt = datetime.strptime(start_time, '%Y-%m-%dT%H:%M')
        end_dt = datetime.strptime(end_time, '%Y-%m-%dT%H:%M')

    total_hours = max(1.0, (end_dt - start_dt).total_seconds() / 3600)

    # Get package discount
    package_discount = 0
    if package_id:
        pkg = conn.execute('SELECT * FROM packages WHERE id = ?', (package_id,)).fetchone()
        if pkg:
            package_discount = pkg['discount_pct']

    # Calculate base price
    if total_hours < 24:
        base_price = vehicle['price_per_hour'] * total_hours
    elif total_hours < 168:
        base_price = vehicle['price_per_day'] * (total_hours / 24)
    elif total_hours < 720:
        base_price = (vehicle['price_per_week'] or vehicle['price_per_day'] * 7) * (total_hours / 168)
    else:
        base_price = (vehicle['price_per_month'] or vehicle['price_per_day'] * 30) * (total_hours / 720)

    # Apply package discount
    discount_amount = base_price * (package_discount / 100)

    # Apply coupon
    coupon_discount = 0
    if coupon_code:
        coupon = conn.execute('''
            SELECT * FROM coupons
            WHERE code = ? AND is_active = 1 AND uses_count < max_uses
            AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
        ''', (coupon_code,)).fetchone()
        if coupon and (base_price - discount_amount) >= coupon['min_amount']:
            coupon_discount = (base_price - discount_amount) * (coupon['discount_pct'] / 100)
            conn.execute('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?', (coupon['id'],))

    total_discount = discount_amount + coupon_discount
    total_price = max(0, base_price - total_discount)

    with_driver = 1 if vehicle['category'] == 'with_driver' else 0

    cursor = conn.execute('''
        INSERT INTO bookings (user_id, vehicle_id, package_id, pickup_location_id, drop_location_id,
            start_time, end_time, total_hours, base_price, discount_amount, total_price,
            status, coupon_code, special_requests, with_driver)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    ''', (user_id, vehicle_id, package_id, pickup_location_id, drop_location_id,
          start_time, end_time, round(total_hours, 2), round(base_price, 2),
          round(total_discount, 2), round(total_price, 2), coupon_code, special_requests, with_driver))

    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Booking created successfully',
        'booking_id': booking_id,
        'total_price': round(total_price, 2),
        'base_price': round(base_price, 2),
        'discount_amount': round(total_discount, 2),
        'total_hours': round(total_hours, 2)
    }), 201

@booking_bp.route('/my', methods=['GET'])
@jwt_required()
def my_bookings():
    user_id = get_jwt_identity()
    conn = get_db()
    bookings = conn.execute('''
        SELECT b.*, v.name AS vehicle_name, v.image_url, v.category,
               vt.name AS vehicle_type, l.area AS pickup_area,
               p.name AS package_name, pay.status AS payment_status, pay.method AS payment_method,
               inv.invoice_number
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN vehicle_types vt ON v.type_id = vt.id
        JOIN locations l ON v.location_id = l.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN payments pay ON b.id = pay.booking_id
        LEFT JOIN invoices inv ON b.id = inv.booking_id  -- Add this line
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify({'bookings': [dict(b) for b in bookings]}), 200

@booking_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    user_id = get_jwt_identity()
    conn = get_db()

    # Check user access or admin
    user = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
    booking = conn.execute('''
        SELECT b.*, v.name AS vehicle_name, v.brand, v.model, v.image_url,
               v.category, v.fuel_type, v.transmission, v.seats,
               vt.name AS vehicle_type,
               l.area AS location_area, l.city AS location_city, l.address AS location_address,
               p.name AS package_name, p.duration_hours, p.discount_pct,
               pay.status AS payment_status, pay.method AS payment_method,
               pay.transaction_id, pay.paid_at,
               u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
               inv.invoice_number
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN vehicle_types vt ON v.type_id = vt.id
        JOIN locations l ON v.location_id = l.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN payments pay ON b.id = pay.booking_id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN invoices inv ON b.id = inv.booking_id
        WHERE b.id = ?
    ''', (booking_id,)).fetchone()
    conn.close()

    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    if user['role'] != 'admin' and str(booking['user_id']) != str(user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'booking': dict(booking)}), 200

@booking_bp.route('/<int:booking_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(booking_id):
    user_id = get_jwt_identity()
    conn = get_db()
    booking = conn.execute(
        'SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id)
    ).fetchone()
    if not booking:
        conn.close()
        return jsonify({'error': 'Booking not found'}), 404
    if booking['status'] not in ('pending', 'confirmed'):
        conn.close()
        return jsonify({'error': 'Cannot cancel this booking'}), 400

    conn.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))
    conn.execute("UPDATE payments SET status = 'refunded' WHERE booking_id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Booking cancelled successfully'}), 200
