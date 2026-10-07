"""
MediGuide AI - Database Package (database/__init__.py)
------------------------------------------------------
Instantiates the Flask-SQLAlchemy extension `db` to decouple model definitions
from app initialization and prevent circular imports.
"""

from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance without binding to app instance yet
db = SQLAlchemy()
