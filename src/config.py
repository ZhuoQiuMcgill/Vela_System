import os


class Config:
    # Database configuration
    BASEDIR = os.path.abspath(os.path.dirname(__file__))
    PARENT_DIR = os.path.dirname(BASEDIR)
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(PARENT_DIR, "vela.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vela-system-secret-key')

    # App settings
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    TESTING = False

    # API settings
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True

    # Version
    API_VERSION = '1.1.0'  # Updated for categories and long-term balance

    # Category settings
    DEFAULT_CATEGORIES = [
        {"name": "Salary", "description": "Regular employment income"},
        {"name": "Freelance", "description": "Freelance and contract work"},
        {"name": "Investment", "description": "Investment returns"},
        {"name": "Food", "description": "Groceries and dining"},
        {"name": "Housing", "description": "Rent, mortgage, utilities"},
        {"name": "Transportation", "description": "Public transit, car expenses"},
        {"name": "Entertainment", "description": "Movies, games, activities"},
        {"name": "Other", "description": "Miscellaneous expenses"}
    ]


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # In production, SECRET_KEY should be set as environment variable
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # Use stronger security settings in production
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True


# Configure based on environment
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


# Active configuration
def get_config():
    env = os.environ.get('FLASK_ENV', 'default')
    return config_by_name[env]
