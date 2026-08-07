"""Auth routes: register, login, get current user."""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from init_db import get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = generate_password_hash(password)
    cursor = conn.execute(
        'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        (name, email, password_hash, phone, 'user')
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    token = create_access_token(identity=str(user_id))
    return jsonify({
        'message': 'Registration successful!',
        'token': token,
        'user': {'id': user_id, 'name': name, 'email': email, 'role': 'user'}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user['is_active']:
        return jsonify({'error': 'Account is deactivated'}), 403

    token = create_access_token(identity=str(user['id']))
    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    conn = get_db()
    user = conn.execute(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
        (user_id,)
    ).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': dict(user)}), 200

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()

    conn = get_db()
    conn.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', (name, phone, user_id))
    conn.commit()
    user = conn.execute('SELECT id, name, email, phone, role FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return jsonify({'message': 'Profile updated', 'user': dict(user)}), 200
