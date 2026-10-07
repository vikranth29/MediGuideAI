"""
MediGuide AI - Custom Decorators
---------------------------------
Provides route decorators such as @admin_required for role-based access control.
"""

from functools import wraps
from flask import abort, flash, redirect, url_for, request
from flask_login import current_user


def admin_required(f):
    """
    Decorator for views that require administrator privileges.

    - If the user is unauthenticated, redirects to the login page.
    - If the user is authenticated but not an admin, aborts with 403 Forbidden.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Please log in to access this area.", "warning")
            return redirect(url_for("login", next=request.path))

        if getattr(current_user, "role", "user") != "admin":
            flash("Access denied: administrator privileges required.", "danger")
            abort(403)

        return f(*args, **kwargs)

    return decorated_function
