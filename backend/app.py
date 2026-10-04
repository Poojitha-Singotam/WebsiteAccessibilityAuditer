import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from database import init_db
from auth.routes import auth_bp
from routes.audits import audits_bp

def create_app():
    # Frontend directory path
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(Config)

    # Enable CORS for frontend API calls
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "x-access-token"]
        }
    })

    # Initialize Database Schema if needed
    try:
        init_db()
        print("[App] Database initialized successfully.")
    except Exception as e:
        print(f"[App Warning] Database initialization check warning: {e}")

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(audits_bp, url_prefix='/api/audits')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Web Accessibility Auditor API',
            'version': '1.0.0'
        }), 200

    # Frontend Page Serving
    @app.route('/')
    def serve_index():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/<path:filename>')
    def serve_static(filename):
        # Prevent accessing files outside frontend_dir
        safe_path = os.path.join(frontend_dir, filename)
        if os.path.exists(safe_path) and os.path.isfile(safe_path):
            return send_from_directory(frontend_dir, filename)
        # Fallback to index.html for single page navigation
        return send_from_directory(frontend_dir, 'index.html')

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({'success': False, 'message': 'Endpoint not found.'}), 404

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({'success': False, 'message': 'Internal server error occurred.'}), 500

    return app

if __name__ == '__main__':
    application = create_app()
    port = Config.PORT
    print(f"==================================================")
    print(f"WEB ACCESSIBILITY AUDITOR BACKEND")
    print(f"Server starting on http://127.0.0.1:{port}")
    print(f"Database: {Config.MYSQL_HOST}:{Config.MYSQL_PORT}/{Config.MYSQL_DB}")
    print(f"==================================================")
    application.run(host='0.0.0.0', port=port, debug=False)
