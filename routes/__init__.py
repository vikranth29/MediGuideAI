"""
MediGuide AI - Routes Package
-----------------------------
Purpose:
Holds route handlers and Flask Blueprints for different modules
(e.g., authentication, dashboard, symptom checking, AI endpoints, hospitals).
"""

from routes.hospital_routes import hospital_bp

__all__ = ["hospital_bp"]
