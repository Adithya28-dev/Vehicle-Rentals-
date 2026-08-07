import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'car-rentals-hyd-secret-key-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-car-rentals-hyd-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
    DATABASE = os.path.join(os.path.dirname(__file__), 'rental.db')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    INVOICE_FOLDER = os.path.join(os.path.dirname(__file__), 'invoices')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload


