import pymysql
from pymysql.cursors import DictCursor
import os
from config import Config

def get_connection(database=None):
    """
    Establish a connection to MySQL.
    Tries the configured port first, then falls back to 3306 if different.
    """
    ports_to_try = [Config.MYSQL_PORT]
    if Config.MYSQL_PORT != 3306:
        ports_to_try.append(3306)

    last_error = None
    for port in ports_to_try:
        try:
            conn = pymysql.connect(
                host=Config.MYSQL_HOST,
                port=port,
                user=Config.MYSQL_USER,
                password=Config.MYSQL_PASSWORD,
                database=database,
                cursorclass=DictCursor,
                autocommit=True,
                charset='utf8mb4'
            )
            return conn
        except Exception as e:
            last_error = e

    raise ConnectionError(f"Could not connect to MySQL server on host {Config.MYSQL_HOST}, ports {ports_to_try}: {last_error}")

def get_db():
    """Returns a connection to the application database."""
    return get_connection(database=Config.MYSQL_DB)

def init_db():
    """
    Ensures database exists and executes schema.sql if tables are not initialized.
    """
    # 1. Connect without specific DB to ensure DB exists
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    finally:
        conn.close()

    # 2. Check if tables exist
    db_conn = get_db()
    try:
        with db_conn.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'audits';")
            table_exists = cursor.fetchone()
            if not table_exists:
                schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'schema.sql')
                if os.path.exists(schema_path):
                    with open(schema_path, 'r', encoding='utf-8') as f:
                        sql_script = f.read()
                    statements = sql_script.split(';')
                    for statement in statements:
                        cleaned = statement.strip()
                        if cleaned and not cleaned.lower().startswith('create database') and not cleaned.lower().startswith('use '):
                            cursor.execute(cleaned)
                    print("[Database] Schema successfully initialized.")
    finally:
        db_conn.close()
