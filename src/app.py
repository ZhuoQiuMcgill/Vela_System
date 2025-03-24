from flask import Flask
from flask_cors import CORS
from models import db
from routes import api
import os
import logging
import sqlite3
from sqlalchemy import text, inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_db_connection(db_path):
    """Test the SQLite database connection and log the result."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT sqlite_version();")
        version = cursor.fetchone()
        conn.close()
        logger.info(f"Successfully connected to vela.db (SQLite version: {version[0]})")
        return True
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {e}")
        return False


def log_database_info(app):
    """Log information about the database tables and records."""
    with app.app_context():
        try:
            # Get table names using SQLAlchemy inspector
            inspector = inspect(db.engine)
            table_names = inspector.get_table_names()

            if not table_names:
                logger.info("No tables found in the database")
                return

            logger.info(f"Found {len(table_names)} tables in the database:")

            # Log record counts for each table
            for table_name in table_names:
                try:
                    # Execute a count query
                    result = db.session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.scalar()

                    # Get table columns
                    columns = inspector.get_columns(table_name)
                    column_names = [col['name'] for col in columns]

                    logger.info(f"  - Table '{table_name}': {count} records, Columns: {', '.join(column_names)}")

                    # If there are records, show a sample (first row)
                    if count > 0:
                        sample = db.session.execute(text(f"SELECT * FROM {table_name} LIMIT 1")).fetchone()
                        logger.info(f"    Sample record: {sample}")

                except Exception as e:
                    logger.error(f"Error getting info for table {table_name}: {e}")

        except Exception as e:
            logger.error(f"Error querying database metadata: {e}")


def create_app():
    app = Flask(__name__)

    # Configure database - point to vela.db in the project root directory
    # Move up one level from the current directory (src)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    db_path = os.path.join(project_root, "vela.db")

    # Log the database path
    logger.info(f"Database path: {db_path}")

    # Test the database connection
    test_db_connection(db_path)

    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'vela-system-secret-key')

    # Enable CORS
    CORS(app)

    # Initialize database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created or verified successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")

    # Log database information
    log_database_info(app)

    return app


if __name__ == '__main__':
    app = create_app()
    logger.info("VELA SYSTEM starting up...")
    logger.info("API endpoints available at http://127.0.0.1:5000/api/")
    app.run(debug=True)
    