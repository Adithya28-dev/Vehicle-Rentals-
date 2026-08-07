"""Payment routes: process payment, validate coupon."""
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db
from datetime import datetime

payment_bp = Blueprint('payments', __name__)

@payment_bp.route('/', methods=['POST'])
@jwt_required()
def process_payment():
    user_id = get_jwt_identity()
    data = request.get_json()

    booking_id = data.get('booking_id')
    method = data.get('method')  # 'card' or 'upi'
    card_number = data.get('card_number', '')
    card_expiry = data.get('card_expiry', '')
    card_cvv = data.get('card_cvv', '')
    upi_id = data.get('upi_id', '')

    if not booking_id or not method:
        return jsonify({'error': 'Booking ID and payment method are required'}), 400
    if method not in ('card', 'upi'):
        return jsonify({'error': 'Invalid payment method'}), 400

    conn = get_db()

    # Verify ownership
    booking = conn.execute(
        'SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id)
    ).fetchone()
    if not booking:
        conn.close()
        return jsonify({'error': 'Booking not found'}), 404
    if booking['status'] == 'cancelled':
        conn.close()
        return jsonify({'error': 'Booking is cancelled'}), 400

    # Check if already paid
    existing = conn.execute('SELECT * FROM payments WHERE booking_id = ?', (booking_id,)).fetchone()
    if existing and existing['status'] == 'success':
        conn.close()
        return jsonify({'error': 'Payment already completed'}), 400

    # Simulate payment processing
    transaction_id = 'TXN' + uuid.uuid4().hex[:12].upper()
    card_last4 = card_number[-4:] if method == 'card' and len(card_number) >= 4 else None
    amount = booking['total_price']

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if existing:
        conn.execute('''
            UPDATE payments SET method = ?, amount = ?, status = 'success',
            transaction_id = ?, card_last4 = ?, upi_id = ?, paid_at = ?
            WHERE booking_id = ?
        ''', (method, amount, transaction_id, card_last4, upi_id, now, booking_id))
    else:
        conn.execute('''
            INSERT INTO payments (booking_id, method, amount, status, transaction_id, card_last4, upi_id, paid_at)
            VALUES (?, ?, ?, 'success', ?, ?, ?, ?)
        ''', (booking_id, method, amount, transaction_id, card_last4, upi_id, now))

    # Confirm booking and update vehicle status
    conn.execute("UPDATE bookings SET status = 'confirmed' WHERE id = ?", (booking_id,))
    conn.execute("UPDATE vehicles SET status = 'booked' WHERE id = ?", (booking['vehicle_id'],))

    # Generate invoice number
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{booking_id:04d}"
    inv_exists = conn.execute('SELECT id FROM invoices WHERE booking_id = ?', (booking_id,)).fetchone()
    if not inv_exists:
        conn.execute('''
            INSERT INTO invoices (booking_id, invoice_number) VALUES (?, ?)
        ''', (booking_id, invoice_number))

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Payment successful!',
        'transaction_id': transaction_id,
        'invoice_number': invoice_number,
        'amount': amount
    }), 200

@payment_bp.route('/validate-coupon', methods=['POST'])
@jwt_required()
def validate_coupon():
    data = request.get_json()
    code = data.get('code', '').upper().strip()
    amount = data.get('amount', 0)

    if not code:
        return jsonify({'error': 'Coupon code is required'}), 400

    conn = get_db()
    coupon = conn.execute('''
        SELECT * FROM coupons
        WHERE code = ? AND is_active = 1 AND uses_count < max_uses
        AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
    ''', (code,)).fetchone()
    conn.close()

    if not coupon:
        return jsonify({'valid': False, 'error': 'Invalid or expired coupon code'}), 200

    if amount < coupon['min_amount']:
        return jsonify({
            'valid': False,
            'error': f'Minimum booking amount ₹{coupon["min_amount"]:.0f} required for this coupon'
        }), 200

    discount = amount * (coupon['discount_pct'] / 100)
    return jsonify({
        'valid': True,
        'discount_pct': coupon['discount_pct'],
        'discount_amount': round(discount, 2),
        'message': f'{coupon["discount_pct"]:.0f}% discount applied!'
    }), 200

@payment_bp.route('/my', methods=['GET'])
@jwt_required()
def my_payments():
    user_id = get_jwt_identity()
    conn = get_db()
    payments = conn.execute('''
        SELECT pay.*, b.start_time, b.end_time, b.total_price, b.status AS booking_status,
               v.name AS vehicle_name, inv.invoice_number
        FROM payments pay
        JOIN bookings b ON pay.booking_id = b.id
        JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN invoices inv ON b.id = inv.booking_id
        WHERE b.user_id = ?
        ORDER BY pay.created_at DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify({'payments': [dict(p) for p in payments]}), 200
