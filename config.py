import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:

    # Secret key for sessions and cryptographic signing - fallback for development
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'

    # Database URI - SQLite by default or custom database URL (e.g. PostgreSQL/MySQL)
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL')
        or os.environ.get('SQLALCHEMY_DATABASE_URI')
        or ("sqlite:///" + os.path.join(BASE_DIR, "database", "mediguide.db"))
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Google Gemini AI API key for chatbot and medical report analyzer
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

    # Flask Debug mode (True for local development, False for production)
    FLASK_DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

    # Session configuration
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 1800  # 30 minutes