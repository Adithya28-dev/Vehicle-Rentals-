"""Invoice routes: generate and download PDF invoice."""
import os
from flask import Blueprint, send_file, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from init_db import get_db
from utils.pdf_generator import generate_invoice_pdf

invoice_bp = Blueprint('invoices', __name__)

@invoice_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def download_invoice(booking_id):
    user_id = get_jwt_identity()
    conn = get_db()

    # Verify access
    user = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
    booking = conn.execute('''
        SELECT b.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
               v.name AS vehicle_name, v.brand, v.model, v.category, v.fuel_type, v.transmission,
               vt.name AS vehicle_type,
               l.area AS location_area, l.city AS location_city,
               p.name AS package_name,
               pay.method AS payment_method, pay.transaction_id, pay.paid_at,
               inv.invoice_number, inv.pdf_path
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

    # Generate PDF
    invoice_folder = current_app.config['INVOICE_FOLDER']
    pdf_path = os.path.join(invoice_folder, f"invoice_{booking_id}.pdf")

    if not os.path.exists(pdf_path):
        generate_invoice_pdf(dict(booking), pdf_path)

    # Update PDF path in DB
    db = get_db()
    db.execute('UPDATE invoices SET pdf_path = ? WHERE booking_id = ?', (pdf_path, booking_id))
    db.commit()
    db.close()

    invoice_number = booking['invoice_number'] or f'INV-{booking_id:04d}'
    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=f"{invoice_number}.pdf",
        mimetype='application/pdf'
    )
