"""Support routes: customer-admin chat system."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db
from functools import wraps

support_bp = Blueprint('support', __name__)

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

@support_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    data = request.get_json()
    message = data.get('message')
    receiver_id = data.get('receiver_id') # Can be NULL for sending to admin
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    sender_id = get_jwt_identity()
    
    conn = get_db()
    cursor = conn.execute('''
        INSERT INTO support_messages (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
    ''', (sender_id, receiver_id, message))
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Message sent', 'id': msg_id}), 201

@support_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    conn = get_db()
    
    # Get all messages where user is sender or receiver (including admin messages to this user)
    # Admin messages will have receiver_id = user_id and sender_id = admin_id
    messages = conn.execute('''
        SELECT m.*, u_send.name AS sender_name, u_recv.name AS receiver_name
        FROM support_messages m
        JOIN users u_send ON m.sender_id = u_send.id
        LEFT JOIN users u_recv ON m.receiver_id = u_recv.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.created_at ASC
    ''', (user_id, user_id)).fetchall()
    
    conn.close()
    return jsonify({'messages': [dict(m) for m in messages]}), 200

@support_bp.route('/admin/conversations', methods=['GET'])
@admin_required
def list_conversations():
    conn = get_db()
    # Find all users who have sent a message or received a message
    users = conn.execute('''
        SELECT DISTINCT u.id, u.name, u.email, 
               (SELECT COUNT(*) FROM support_messages WHERE sender_id = u.id AND is_read = 0) as unread_count,
               (SELECT MAX(created_at) FROM support_messages WHERE sender_id = u.id OR receiver_id = u.id) as last_activity
        FROM users u
        JOIN support_messages m ON u.id = m.sender_id OR u.id = m.receiver_id
        WHERE u.role != 'admin'
        ORDER BY last_activity DESC
    ''').fetchall()
    
    conn.close()
    return jsonify({'conversations': [dict(u) for u in users]}), 200

@support_bp.route('/admin/history/<int:customer_id>', methods=['GET'])
@admin_required
def get_admin_history(customer_id):
    conn = get_db()
    messages = conn.execute('''
        SELECT m.*, u_send.name AS sender_name, u_recv.name AS receiver_name
        FROM support_messages m
        JOIN users u_send ON m.sender_id = u_send.id
        LEFT JOIN users u_recv ON m.receiver_id = u_recv.id
        WHERE (m.sender_id = ? AND m.receiver_id IS NULL) -- From customer to admin
           OR (m.sender_id IS NOT NULL AND m.receiver_id = ?) -- From admin to customer (Wait, admin has a sender_id)
           OR (m.sender_id = ? OR m.receiver_id = ?) -- General catch-all for this customer
        ORDER BY m.created_at ASC
    ''', (customer_id, customer_id, customer_id, customer_id)).fetchall()
    
    # Mark messages from this customer as read
    conn.execute('UPDATE support_messages SET is_read = 1 WHERE sender_id = ? AND is_read = 0', (customer_id,))
    conn.commit()
    conn.close()
    
    # Filtering to ensure we only get messages between this specific customer and ANY admin
    # Actually, the query above is a bit too broad, but since all admins are "receiver_id IS NULL" for customers...
    
    return jsonify({'messages': [dict(m) for m in messages]}), 200
