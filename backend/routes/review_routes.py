"""Review routes: submit and get reviews."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db

review_bp = Blueprint('reviews', __name__)

@review_bp.route('/', methods=['POST'])
@jwt_required()
def submit_review():
    user_id = get_jwt_identity()
    data = request.get_json()

    vehicle_id = data.get('vehicle_id')
    booking_id = data.get('booking_id')
    rating = data.get('rating')
    comment = data.get('comment', '').strip()

    if not vehicle_id or not rating:
        return jsonify({'error': 'Vehicle ID and rating are required'}), 400
    if not isinstance(rating, int) or not (1 <= rating <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    conn = get_db()

    # Verify user completed a booking for this vehicle
    if booking_id:
        booking = conn.execute(
            'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND vehicle_id = ? AND status = ?',
            (booking_id, user_id, vehicle_id, 'completed')
        ).fetchone()
        if not booking:
            # Allow for confirmed bookings too
            booking = conn.execute(
                'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND vehicle_id = ? AND status IN (?, ?)',
                (booking_id, user_id, vehicle_id, 'completed', 'confirmed')
            ).fetchone()

    try:
        conn.execute('''
            INSERT INTO reviews (user_id, vehicle_id, booking_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, vehicle_id, booking_id, rating, comment))

        # Update vehicle average rating
        avg = conn.execute(
            'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE vehicle_id = ?',
            (vehicle_id,)
        ).fetchone()
        conn.execute(
            'UPDATE vehicles SET rating = ?, review_count = ? WHERE id = ?',
            (round(avg['avg'], 1), avg['cnt'], vehicle_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Review submitted successfully!'}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': 'You have already reviewed this booking'}), 409

@review_bp.route('/<int:vehicle_id>', methods=['GET'])
def get_reviews(vehicle_id):
    conn = get_db()
    reviews = conn.execute('''
        SELECT r.*, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.vehicle_id = ?
        ORDER BY r.created_at DESC
        LIMIT 20
    ''', (vehicle_id,)).fetchall()
    conn.close()
    return jsonify({'reviews': [dict(r) for r in reviews]}), 200
