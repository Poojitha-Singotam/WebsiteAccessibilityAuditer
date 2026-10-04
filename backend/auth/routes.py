import re
import datetime
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from config import Config

auth_bp = Blueprint('auth', __name__)

def generate_token(user):
    """Generate JWT token for authenticated user."""
    payload = {
        'id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=Config.JWT_EXP_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)

def token_required(f):
    """Decorator to protect routes requiring authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1].strip()
        elif 'x-access-token' in request.headers:
            token = request.headers.get('x-access-token').strip()

        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing. Please log in.'}), 401

        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM])
            current_user = {
                'id': payload['id'],
                'email': payload['email'],
                'name': payload['name']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired. Please log in again.'}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({'success': False, 'message': 'Invalid authentication token.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Full name, email, and password are required.'}), 400

    if len(name) < 2:
        return jsonify({'success': False, 'message': 'Name must be at least 2 characters.'}), 400

    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return jsonify({'success': False, 'message': 'Please provide a valid email address.'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400

    db = get_db()
    try:
        with db.cursor() as cursor:
            # Check if email is already registered
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 409

            password_hash = generate_password_hash(password)
            cursor.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                (name, email, password_hash)
            )
            user_id = cursor.lastrowid

            user = {'id': user_id, 'name': name, 'email': email}
            token = generate_token(user)

            return jsonify({
                'success': True,
                'message': 'Account registered successfully.',
                'token': token,
                'user': user
            }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500
    finally:
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate existing user."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = %s", (email,))
            user_record = cursor.fetchone()

            if not user_record or not check_password_hash(user_record['password_hash'], password):
                return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

            user = {
                'id': user_record['id'],
                'name': user_record['name'],
                'email': user_record['email']
            }
            token = generate_token(user)

            return jsonify({
                'success': True,
                'message': 'Login successful.',
                'token': token,
                'user': user
            }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500
    finally:
        db.close()

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    """Return active user profile and aggregate audit statistics."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = %s", (current_user['id'],))
            user = cursor.fetchone()
            if not user:
                return jsonify({'success': False, 'message': 'User profile not found.'}), 404

            # Format created_at to ISO string
            if user.get('created_at'):
                user['created_at'] = user['created_at'].isoformat()

            # Aggregate user statistics
            cursor.execute("""
                SELECT 
                    COUNT(a.id) AS total_audits,
                    COALESCE(ROUND(AVG(a.score)), 100) AS avg_score,
                    COALESCE(SUM(s.critical_count), 0) AS total_critical,
                    COALESCE(SUM(s.error_count), 0) AS total_errors,
                    COALESCE(SUM(s.warning_count), 0) AS total_warnings,
                    COALESCE(SUM(s.info_count), 0) AS total_info,
                    COALESCE(SUM(s.pass_count), 0) AS total_pass
                FROM audits a
                LEFT JOIN audit_summary s ON a.id = s.audit_id
                WHERE a.user_id = %s
            """, (current_user['id'],))
            stats = cursor.fetchone() or {}

            return jsonify({
                'success': True,
                'user': user,
                'stats': {
                    'total_audits': int(stats.get('total_audits') or 0),
                    'avg_score': int(stats.get('avg_score') or 100),
                    'total_critical': int(stats.get('total_critical') or 0),
                    'total_errors': int(stats.get('total_errors') or 0),
                    'total_warnings': int(stats.get('total_warnings') or 0),
                    'total_info': int(stats.get('total_info') or 0),
                    'total_pass': int(stats.get('total_pass') or 0)
                }
            }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to retrieve profile: {str(e)}'}), 500
    finally:
        db.close()
