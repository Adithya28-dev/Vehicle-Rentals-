import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from config import Config

upload_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'avif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        # Create a unique filename to prevent overwrites
        filename = f"{uuid.uuid4().hex}.{secure_filename(ext)}"
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(file_path)
        return jsonify({'message': 'File uploaded', 'url': f"/api/uploads/{filename}"}), 201
    return jsonify({'error': 'File type not allowed'}), 400

@upload_bp.route('/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)
