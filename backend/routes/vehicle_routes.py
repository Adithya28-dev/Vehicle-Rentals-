"""Vehicle routes: list, detail, availability."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db

vehicle_bp = Blueprint('vehicles', __name__)

def vehicle_to_dict(v):
    d = dict(v)
    # Parse image URLs
    d['images'] = [u for u in [d.get('image_url'), d.get('image_url2'), d.get('image_url3')] if u]
    return d

@vehicle_bp.route('/', methods=['GET'])
def list_vehicles():
    location_id = request.args.get('location_id')
    type_id = request.args.get('type_id')
    category = request.args.get('category')
    search = request.args.get('search', '')
    status = request.args.get('status', 'available')

    query = '''
        SELECT v.*, vt.name AS type_name, l.area AS location_area, l.city AS location_city,
               l.lat AS loc_lat, l.lng AS loc_lng
        FROM vehicles v
        JOIN vehicle_types vt ON v.type_id = vt.id
        JOIN locations l ON v.location_id = l.id
        WHERE v.is_deleted = 0
    '''
    params = []

    if location_id:
        query += ' AND v.location_id = ?'
        params.append(location_id)
    if type_id:
        query += ' AND v.type_id = ?'
        params.append(type_id)
    if category:
        query += ' AND v.category = ?'
        params.append(category)
    if status:
        query += ' AND v.status = ?'
        params.append(status)
    if search:
        query += ' AND (v.name LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR l.area LIKE ?)'
        params.extend([f'%{search}%'] * 4)

    query += ' ORDER BY v.rating DESC, v.id DESC'

    conn = get_db()
    vehicles = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify({'vehicles': [vehicle_to_dict(v) for v in vehicles]}), 200

@vehicle_bp.route('/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    conn = get_db()
    v = conn.execute('''
        SELECT v.*, vt.name AS type_name, l.area AS location_area, l.city AS location_city,
               l.lat AS loc_lat, l.lng AS loc_lng, l.address AS location_address
        FROM vehicles v
        JOIN vehicle_types vt ON v.type_id = vt.id
        JOIN locations l ON v.location_id = l.id
        WHERE v.id = ? AND v.is_deleted = 0
    ''', (vehicle_id,)).fetchone()
    conn.close()
    if not v:
        return jsonify({'error': 'Vehicle not found'}), 404
    return jsonify({'vehicle': vehicle_to_dict(v)}), 200

@vehicle_bp.route('/<int:vehicle_id>/availability', methods=['GET'])
def check_availability(vehicle_id):
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')

    conn = get_db()
    # Check if any confirmed/pending booking overlaps
    conflict = conn.execute('''
        SELECT id FROM bookings
        WHERE vehicle_id = ?
          AND status IN ('confirmed', 'pending')
          AND NOT (end_time <= ? OR start_time >= ?)
    ''', (vehicle_id, start_time, end_time)).fetchone()

    vehicle = conn.execute('SELECT status FROM vehicles WHERE id = ?', (vehicle_id,)).fetchone()
    conn.close()

    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    available = vehicle['status'] == 'available' and not conflict
    return jsonify({'available': available}), 200

@vehicle_bp.route('/types', methods=['GET'])
def get_types():
    conn = get_db()
    types = conn.execute('SELECT * FROM vehicle_types').fetchall()
    conn.close()
    return jsonify({'types': [dict(t) for t in types]}), 200

@vehicle_bp.route('/locations', methods=['GET'])
def get_locations():
    conn = get_db()
    locs = conn.execute('SELECT * FROM locations WHERE is_active = 1 ORDER BY area').fetchall()
    conn.close()
    return jsonify({'locations': [dict(l) for l in locs]}), 200

@vehicle_bp.route('/packages', methods=['GET'])
def get_packages():
    conn = get_db()
    pkgs = conn.execute('SELECT * FROM packages ORDER BY duration_hours').fetchall()
    conn.close()
    return jsonify({'packages': [dict(p) for p in pkgs]}), 200
