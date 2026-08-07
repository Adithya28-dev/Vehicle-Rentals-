"""Main Flask application entry point."""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from init_db import init_db

from routes.auth_routes import auth_bp
from routes.vehicle_routes import vehicle_bp
from routes.booking_routes import booking_bp
from routes.payment_routes import payment_bp
from routes.admin_routes import admin_bp
from routes.invoice_routes import invoice_bp
from routes.review_routes import review_bp
from routes.upload_routes import upload_bp
from routes.support_routes import support_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    # Initialize database
    with app.app_context():
        init_db()

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(vehicle_bp, url_prefix='/api/vehicles')
    app.register_blueprint(booking_bp, url_prefix='/api/bookings')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(invoice_bp, url_prefix='/api/invoices')
    app.register_blueprint(review_bp, url_prefix='/api/reviews')
    app.register_blueprint(upload_bp, url_prefix='/api/uploads')
    app.register_blueprint(support_bp, url_prefix='/api/support')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'Car Rentals HYD API is running'}, 200

    return app

app = create_app()

if __name__ == '__main__':
    print("\nCar Rentals HYD - Backend API")
    print("=" * 40)
    print("API URL: http://localhost:5001")
    print("Health: http://localhost:5001/api/health")
    print("=" * 40 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5001)
