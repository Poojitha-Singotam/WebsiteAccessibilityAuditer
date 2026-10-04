import os
from dotenv import load_dotenv

# Load .env file from backend or root directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
load_dotenv(os.path.join(backend_dir, '.env'))
load_dotenv(os.path.join(root_dir, '.env'))

class Config:
    MYSQL_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3307))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DB = os.getenv('MYSQL_DB', 'accessibility_auditor')
    
    JWT_SECRET = os.getenv('JWT_SECRET', 'a11y-auditor-secret-key-2026-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXP_HOURS = 72
    
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))
