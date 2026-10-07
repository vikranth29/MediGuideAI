"""
MediGuide AI - Main Application Entry Point
-------------------------------------------
This file initializes the Flask web application, configures static and template paths,
loads SQLite database settings from config.py, binds Flask-SQLAlchemy,
configures Flask-Login session management, and registers all routes.
"""

import os
import io
from urllib.parse import urlparse
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify, send_file, session
from flask_login import LoginManager, login_required, logout_user, current_user, login_user
from utils.decorators import admin_required
from config import Config
from models import db, bcrypt
from services.disease_predictor import predict_disease, features as symptom_features
from services.disease_info import get_description
from services.precaution_service import get_precautions
from services.medicine_service import get_medicine
from services.gemini_service import get_ai_advice
from services.report_analyzer_service import (
    analyze_report,
    extract_health_metrics,
    _extract_text_from_pdf,
)
from models.prediction import Prediction
import google.generativeai as genai
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)

from reportlab.lib.styles import getSampleStyleSheet

from reportlab.lib import colors

from reportlab.lib.units import inch

# Security extensions
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

# ==============================================================================
# 1. APPLICATION INITIALIZATION & CONFIGURATION
# ==============================================================================
# Initialize Flask app and explicitly configure templates and static folders
app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

# Load configuration settings from Config object (in config.py)
app.config.from_object(Config)

# Ensure database directory exists before initializing SQLite file
os.makedirs(os.path.join(app.root_path, 'database'), exist_ok=True)

# Initialize Flask-SQLAlchemy database extension (binds db to this app)
db.init_app(app)

# Initialize Flask-Bcrypt for password hashing (binds bcrypt to this app)
bcrypt.init_app(app)

# Initialize CSRF protection
csrf = CSRFProtect()
csrf.init_app(app)

# Initialize rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# Initialize security headers (Flask-Talisman)
# Configure CSP to work with existing resources (Bootstrap, Google Fonts, Leaflet CDN, etc.)
csp = {
    'default-src': "'self'",
    'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://apis.google.com", "https://cdnjs.cloudflare.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
    'img-src': ["'self'", "data:", "https:"],
    'font-src': ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
    'connect-src': ["'self'", "https://generativelanguage.googleapis.com"],
    'frame-src': ["'self'"],
}
Talisman(app, content_security_policy=csp, force_https=False)  # force_https=False for development

# Import all model classes so SQLAlchemy registers their tables before create_all()
from models.user import User  # noqa: F401

# Create SQLite database tables within application context if not present
with app.app_context():
    db.create_all()
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "role" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
                conn.commit()
    except Exception:
        pass


# ==============================================================================
# 2. FLASK-LOGIN CONFIGURATION
# ==============================================================================
# LoginManager manages the user session lifecycle:
#   - Tracks which user is currently logged in.
#   - Redirects unauthenticated users to the login page when they access
#     routes decorated with @login_required.
login_manager = LoginManager()

# Bind the LoginManager to this Flask application instance
login_manager.init_app(app)

# login_view: The route name Flask-Login redirects to when an unauthenticated
# user tries to access a @login_required protected endpoint.
login_manager.login_view = 'login'

# login_message: The flash message category and text shown on redirect.
# 'warning' maps to Bootstrap's alert-warning styling in the templates.
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'warning'


# ==============================================================================
# 3. USER LOADER CALLBACK
# ==============================================================================
@login_manager.user_loader
def load_user(user_id):
    """
    user_loader(user_id: str) -> User | None
    -----------------------------------------
    Flask-Login calls this function on every request to reload the user object
    from the user ID stored in the session cookie.

    Flask-Login stores str(user.id) in the session.
    We cast it to int to match the Integer primary key in the database.

    Returns:
        User: The User object if found, or None if the session is invalid/expired.
    """
    from models.user import User
    return User.query.get(int(user_id))


# ==============================================================================
# 4. CORE & INFORMATION ROUTES
# ==============================================================================

@app.route('/')
def index():
    """
    Home Page Route
    ---------------
    Renders the primary landing page and feature overview for MediGuide AI.
    """
    return render_template('index.html', page_title="Home")


@app.route('/about')
def about():
    """
    About Page Route
    ----------------
    Renders information regarding MediGuide AI's mission, technology, and features.
    """
    return render_template('about.html', page_title="About Us")


@app.route('/contact')
def contact():
    """
    Contact Page Route
    ------------------
    Renders the contact form and support information for user inquiries.
    """
    return render_template('contact.html', page_title="Contact Us")


# ==============================================================================
# 5. AUTHENTICATION ROUTES
# ==============================================================================

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")  # Strict limit on login attempts
def login():
    """
    User Login Route
    ----------------
    GET:  Renders the sign-in form.
          Redirects already-authenticated users directly to the dashboard.

    POST: Validates submitted credentials:
          - Looks up the user by email.
          - Verifies the bcrypt password hash.
          - Calls Flask-Login's login_user() to create the session.
          - Supports "remember me" for persistent cookies.
          - Performs a safe redirect to the originally-requested page (next param)
            or falls back to the dashboard.
          On failure: flashes an error and re-renders the form.
    """
    from models.user import User

    # Redirect already-authenticated users away from the login page
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email            = request.form.get('email', '').strip().lower()
        password         = request.form.get('password', '')
        remember         = request.form.get('remember') == 'true'
        next_page        = request.form.get('next') or request.args.get('next', '')

        # ── Basic presence validation ──────────────────────────────
        if not email or not password:
            flash('Email and password are required.', 'danger')
            return render_template('login.html', page_title="Login", email=email)

        # ── Look up user and verify credentials ────────────────────
        user = User.query.filter_by(email=email).first()
        if user is None or not user.check_password(password):
            flash('Invalid email or password. Please try again.', 'danger')
            return render_template('login.html', page_title="Login", email=email)

        # ── Create authenticated session ───────────────────────────
        login_user(user, remember=remember)
        flash(f'Welcome back, {user.full_name}!', 'success')

        # ── Safe redirect (prevent open-redirect attacks) ──────────
        # Only redirect to relative URLs from the same origin.
        if next_page:
            parsed = urlparse(next_page)
            if parsed.scheme or parsed.netloc:
                # Absolute URL — ignore it and go to dashboard
                next_page = ''
        return redirect(next_page or url_for('dashboard'))

    # GET request — render blank form
    return render_template('login.html', page_title="Login", email='')


@app.route('/register', methods=['GET', 'POST'])
@limiter.limit("10 per hour")  # Reasonable limit on registration
def register():
    """
    User Registration Route
    -----------------------
    GET:  Renders the account creation form.
          Redirects already-authenticated users directly to the dashboard.

    POST: Validates form input server-side:
          - Checks required fields are not empty.
          - Verifies passwords match.
          - Enforces minimum password length (8 characters).
          - Checks email is not already registered.
          On success: hashes password, saves user to SQLite, redirects to login.
          On failure: flashes specific error messages and re-renders the form
                      with previously entered values pre-filled.
    """
    from models.user import User

    # Redirect already-authenticated users away from the registration page
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        # ------------------------------------------------------------------
        # 1. Extract form data (strip whitespace from text fields)
        # ------------------------------------------------------------------
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # ------------------------------------------------------------------
        # 2. Server-side validation
        # ------------------------------------------------------------------
        errors = []

        if not full_name:
            errors.append('Full name is required.')
        elif len(full_name) < 2:
            errors.append('Full name must be at least 2 characters.')

        if not email:
            errors.append('Email address is required.')

        if not password:
            errors.append('Password is required.')
        elif len(password) < 12:
            errors.append('Password must be at least 12 characters long.')
        elif not any(c.isupper() for c in password):
            errors.append('Password must contain at least one uppercase letter.')
        elif not any(c.islower() for c in password):
            errors.append('Password must contain at least one lowercase letter.')
        elif not any(c.isdigit() for c in password):
            errors.append('Password must contain at least one digit.')
        elif not any(not c.isalnum() for c in password):
            errors.append('Password must contain at least one special character.')

        if password and confirm_password and password != confirm_password:
            errors.append('Passwords do not match.')

        # Check for duplicate email (case-insensitive)
        if email and not errors:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                errors.append(
                    'An account with this email already exists. Please log in.')

        # ------------------------------------------------------------------
        # 3a. Validation failed — flash all errors and re-render the form
        # ------------------------------------------------------------------
        if errors:
            for error in errors:
                flash(error, 'danger')
            # Re-render with previously entered values so the user
            # does not have to retype everything
            return render_template(
                'register.html',
                page_title="Register Account",
                form_data={'full_name': full_name, 'email': email}
            )

        # ------------------------------------------------------------------
        # 3b. Validation passed — create and persist the new User
        # ------------------------------------------------------------------
        new_user = User(full_name=full_name, email=email)
        new_user.set_password(password)   # bcrypt hash — never plain text

        db.session.add(new_user)
        db.session.commit()

        flash(
            f'Account created successfully! Welcome, {full_name}. Please log in.', 'success')
        return redirect(url_for('login'))

    # GET request — render blank form
    return render_template('register.html', page_title="Register Account", form_data={})


@app.route('/logout')
@login_required
def logout():
    """
    Logout Route
    ------------
    Terminates the user's authenticated session using Flask-Login's logout_user().
    - Clears the user ID from the session cookie.
    - Redirects the user to the home page with a confirmation flash message.
    - Protected by @login_required so only authenticated users can call it.
    """
    logout_user()
    flash('You have been successfully logged out.', 'success')
    return redirect(url_for('index'))


def _auth_user_payload(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
    }


def _json_auth_error(message, status_code=400, errors=None):
    payload = {"success": False, "error": message}
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code


@app.route('/auth/session', methods=['GET'])
def auth_session():
    response = {
        "success": True,
        "authenticated": current_user.is_authenticated,
        "user": _auth_user_payload(current_user) if current_user.is_authenticated else None,
        "csrf_token": generate_csrf(),
    }
    return jsonify(response)


@app.route('/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def auth_login():
    from models.user import User

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return _json_auth_error("Request body must be valid JSON.")

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    remember = data.get("remember") is True

    if not email or not password:
        return _json_auth_error(
            "Email and password are required.",
            errors={"email": "Email is required." if not email else None,
                    "password": "Password is required." if not password else None},
        )

    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return _json_auth_error("Invalid email or password. Please try again.", 401)

    login_user(user, remember=remember)
    return jsonify({
        "success": True,
        "authenticated": True,
        "user": _auth_user_payload(user),
        "csrf_token": generate_csrf(),
    })


@app.route('/auth/register', methods=['POST'])
@limiter.limit("10 per hour")
def auth_register():
    from models.user import User

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return _json_auth_error("Request body must be valid JSON.")

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    errors = {}

    if not full_name:
        errors["full_name"] = "Full name is required."
    elif len(full_name) < 2:
        errors["full_name"] = "Full name must be at least 2 characters."

    if not email:
        errors["email"] = "Email address is required."

    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 12:
        errors["password"] = "Password must be at least 12 characters long."
    elif not any(c.isupper() for c in password):
        errors["password"] = "Password must contain at least one uppercase letter."
    elif not any(c.islower() for c in password):
        errors["password"] = "Password must contain at least one lowercase letter."
    elif not any(c.isdigit() for c in password):
        errors["password"] = "Password must contain at least one digit."
    elif not any(not c.isalnum() for c in password):
        errors["password"] = "Password must contain at least one special character."

    if password and confirm_password and password != confirm_password:
        errors["confirm_password"] = "Passwords do not match."

    duplicate_email = bool(email and not errors and User.query.filter_by(email=email).first())
    if duplicate_email:
        errors["email"] = "An account with this email already exists. Please log in."

    if errors:
        status_code = 409 if duplicate_email else 400
        return _json_auth_error("Please correct the highlighted fields.", status_code, errors)

    new_user = User(full_name=full_name, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Account created successfully. Please log in.",
    }), 201


@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    if current_user.is_authenticated:
        logout_user()
    return jsonify({
        "success": True,
        "authenticated": False,
        "user": None,
        "csrf_token": generate_csrf(),
    })


# ==============================================================================
# 6. FEATURE MODULE ROUTES
# ==============================================================================

@app.route('/dashboard')
@login_required
def dashboard():

    total_predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).count()

    recent_predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.prediction_date.desc()
    ).limit(5).all()

    return render_template(
        'dashboard.html',
        total_predictions=total_predictions,
        recent_predictions=recent_predictions
    )


@app.route('/dashboard/summary', methods=['GET'])
def dashboard_summary():
    if not current_user.is_authenticated:
        return jsonify({
            "success": False,
            "error": "Authentication required."
        }), 401

    total_predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).count()
    recent_predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.prediction_date.desc()
    ).limit(5).all()

    return jsonify({
        "success": True,
        "total_predictions": total_predictions,
        "recent_predictions": [
            {
                "id": prediction.id,
                "symptoms": prediction.symptoms,
                "disease": prediction.disease,
                "medicine": prediction.medicine,
                "prediction_date": prediction.prediction_date.isoformat()
                if prediction.prediction_date else None,
            }
            for prediction in recent_predictions
        ],
    })


@app.route('/history/data', methods=['GET'])
def history_data():
    if not current_user.is_authenticated:
        return jsonify({
            "success": False,
            "error": "Authentication required."
        }), 401

    predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.prediction_date.desc()
    ).all()

    return jsonify({
        "success": True,
        "predictions": [
            {
                "id": prediction.id,
                "symptoms": prediction.symptoms,
                "disease": prediction.disease,
                "medicine": prediction.medicine,
                "description": prediction.description,
                "prediction_date": (
                    prediction.prediction_date.isoformat()
                    if prediction.prediction_date else None
                ),
            }
            for prediction in predictions
        ],
    })


@app.route('/symptom-checker/symptoms', methods=['GET'])
def symptom_checker_symptoms():
    return jsonify({
        "success": True,
        "symptoms": symptom_features,
    })


@app.route('/symptom-checker/predict', methods=['POST'])
def symptom_checker_predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be valid JSON.",
        }), 400

    raw_symptoms = data.get("symptoms")
    if isinstance(raw_symptoms, list):
        if not all(isinstance(symptom, str) for symptom in raw_symptoms):
            return jsonify({
                "success": False,
                "error": "Symptoms must be provided as text values.",
            }), 400
        symptoms = ", ".join(symptom.strip() for symptom in raw_symptoms if symptom.strip())
    elif isinstance(raw_symptoms, str):
        symptoms = raw_symptoms.strip()
    else:
        symptoms = ""

    if not symptoms:
        return jsonify({
            "success": False,
            "error": "Please provide at least one symptom.",
            "errors": {"symptoms": "At least one symptom is required."},
        }), 400

    symptom_list = [
        symptom.strip().lower().replace(" ", "_")
        for symptom in symptoms.split(",")
        if symptom.strip()
    ]

    prediction = predict_disease(symptom_list)
    description = get_description(prediction)
    precautions = get_precautions(prediction)
    medicine = get_medicine(prediction)
    try:
        ai_advice = get_ai_advice(prediction, description)
    except Exception:
        ai_advice = (
            "AI advice is temporarily unavailable. Please consult a "
            "qualified doctor or healthcare professional."
        )

    new_prediction = None
    if current_user.is_authenticated:
        new_prediction = Prediction(
            user_id=current_user.id,
            symptoms=symptoms,
            disease=prediction,
            description=description,
            medicine=medicine
        )
        db.session.add(new_prediction)
        db.session.commit()

    return jsonify({
        "success": True,
        "prediction": prediction,
        "description": description,
        "precautions": precautions,
        "medicine": medicine,
        "ai_advice": ai_advice,
        "disclaimer": (
            "These medicines are general recommendations from the dataset used in "
            "this project. They are not a medical prescription. Please consult a "
            "qualified doctor or healthcare professional before taking any medication."
        ),
        "prediction_id": new_prediction.id if new_prediction else None,
        "prediction_date": (
            new_prediction.prediction_date.isoformat()
            if new_prediction and new_prediction.prediction_date else None
        ),
    })


@app.route("/symptom-checker", methods=["GET", "POST"])
@app.route("/predict", methods=["GET", "POST"])
def symptom_checker():

    prediction = None
    description = None
    precautions = []
    medicine = None
    ai_advice = None

    if request.method == "POST":

        symptoms = request.form.get("symptoms", "")
        _duration = request.form.get("duration")
        _severity = request.form.get("severity")
        _age = request.form.get("age")
        _gender = request.form.get("gender")

        # Convert comma-separated symptoms into a list
        symptom_list = [
            s.strip().lower().replace(" ", "_")
            for s in (symptoms or "").split(",")
            if s.strip()
        ]

        # Machine Learning Prediction
        prediction = predict_disease(symptom_list)

        # Get disease information
        description = get_description(prediction)
        precautions = get_precautions(prediction)
        medicine = get_medicine(prediction)

        # Gemini AI Advice
        try:
            ai_advice = get_ai_advice(prediction, description)
        except Exception:
            ai_advice = None

        if current_user.is_authenticated:
            new_prediction = Prediction(
                user_id=current_user.id,
                symptoms=symptoms,
                disease=prediction,
                description=description,
                medicine=medicine
            )
            db.session.add(new_prediction)
            db.session.commit()

        print("Prediction:", prediction)

    return render_template(
        "symptom_checker.html",
        prediction=prediction,
        description=description,
        precautions=precautions,
        medicine=medicine,
        ai_advice=ai_advice,
        symptoms_list=symptom_features
    )


@app.route("/history")
@login_required
def history():

    predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.prediction_date.desc()
    ).all()

    return render_template(
        "history.html",
        predictions=predictions
    )


@app.route("/download-report/<int:prediction_id>")
@login_required
def download_report(prediction_id):

    prediction = Prediction.query.filter_by(
        id=prediction_id,
        user_id=current_user.id
    ).first_or_404()

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=(8.27 * inch, 11.69 * inch),
        rightMargin=35,
        leftMargin=35,
        topMargin=40,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()

    story = []

    # -------------------------------------------------
    # TITLE
    # -------------------------------------------------

    title = Paragraph(
        "<font color='darkblue'><b><font size=22>"
        "MEDIGUIDE AI</font></b></font>",
        styles["Title"]
    )

    story.append(title)

    subtitle = Paragraph(
        "<b>AI Healthcare Prediction Report</b>",
        styles["Heading2"]
    )

    story.append(subtitle)

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # REPORT INFORMATION
    # -------------------------------------------------

    report_table = Table([
        ["Report ID", str(prediction.id)],
        ["Generated On",
         prediction.prediction_date.strftime("%d-%m-%Y") if prediction.prediction_date else "N/A"],
        ["Time",
         prediction.prediction_date.strftime("%I:%M %p") if prediction.prediction_date else "N/A"]
    ], colWidths=[150, 250])

    report_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightblue),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8)
    ]))

    story.append(report_table)

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # PATIENT INFORMATION
    # -------------------------------------------------

    story.append(
        Paragraph("<b><font size=15>"
                  "Patient Information</font></b>",
                  styles["Heading2"])
    )

    patient_table = Table([
        ["Patient", "Registered User"],
        ["Age", "Not Provided"],
        ["Gender", "Not Provided"]
    ], colWidths=[150, 250])

    patient_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey)
    ]))

    story.append(patient_table)

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # SYMPTOMS
    # -------------------------------------------------

    story.append(
        Paragraph("<b>Symptoms</b>", styles["Heading2"])
    )

    symptom_text = "<br/>".join(
        f"• {s.strip().title()}"
        for s in prediction.symptoms.split(",")
    )

    story.append(
        Paragraph(symptom_text, styles["BodyText"])
    )

    story.append(Spacer(1, 15))

    # -------------------------------------------------
    # DISEASE
    # -------------------------------------------------

    story.append(
        Paragraph("<b>Predicted Disease</b>",
                  styles["Heading2"])
    )

    disease_table = Table([
        [prediction.disease]
    ])

    disease_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.lightgreen),
        ("GRID", (0, 0), (-1, -1), 1, colors.green),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10)
    ]))

    story.append(disease_table)

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # DESCRIPTION
    # -------------------------------------------------

    story.append(
        Paragraph("<b>Disease Description</b>",
                  styles["Heading2"])
    )

    story.append(
        Paragraph(prediction.description,
                  styles["BodyText"])
    )

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # MEDICINE
    # -------------------------------------------------

    story.append(
        Paragraph("<b>Recommended Medicine</b>",
                  styles["Heading2"])
    )

    story.append(
        Paragraph(prediction.medicine,
                  styles["BodyText"])
    )

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # PRECAUTIONS
    # -------------------------------------------------

    story.append(
        Paragraph("<b>Health Precautions</b>",
                  styles["Heading2"])
    )

    precautions = """
    ✓ Drink plenty of water<br/>
    ✓ Get enough rest<br/>
    ✓ Follow your doctor's advice<br/>
    ✓ Take medicines on time<br/>
    ✓ Eat healthy food
    """

    story.append(
        Paragraph(precautions,
                  styles["BodyText"])
    )

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # AI ADVICE
    # -------------------------------------------------

    story.append(
        Paragraph("<b>AI Health Advice</b>",
                  styles["Heading2"])
    )

    story.append(
        Paragraph(
            "This prediction is generated using Artificial Intelligence and Machine Learning. "
            "It should be considered an informational aid and not a substitute for professional medical diagnosis.",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -------------------------------------------------
    # DISCLAIMER
    # -------------------------------------------------

    disclaimer = Table([[
        "⚠ MEDICAL DISCLAIMER\n\n"
        "This report is generated by MediGuide AI.\n\n"
        "It is intended for educational purposes only.\n\n"
        "Please consult a qualified healthcare professional "
        "before taking any medication."
    ]])

    disclaimer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.mistyrose),
        ("GRID", (0, 0), (-1, -1), 1, colors.red),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12)
    ]))

    story.append(disclaimer)

    story.append(Spacer(1, 25))

    # -------------------------------------------------
    # FOOTER
    # -------------------------------------------------

    footer = Paragraph(
        "<center><font color='grey'>"
        "<b>Generated by MediGuide AI</b><br/>"
        "Artificial Intelligence Powered Healthcare System<br/>"
        "Version 1.0 | © 2026"
        "</font></center>",
        styles["Normal"]
    )

    story.append(footer)

    # -------------------------------------------------

    doc.build(story)

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"MediGuide_Report_{prediction.id}.pdf",
        mimetype="application/pdf"
    )


@app.route('/medicine')
def medicine():
    return render_template(
        'medicine.html',
        page_title="Medicine Information"
    )


@app.route('/medicine/search', methods=['GET'])
def medicine_search():
    disease_values = request.args.getlist('disease')
    if len(disease_values) != 1 or not isinstance(disease_values[0], str):
        return jsonify({
            "success": False,
            "error": "Please provide a disease name."
        }), 400

    disease = disease_values[0]
    if not disease.strip():
        return jsonify({
            "success": False,
            "error": "Please provide a disease name."
        }), 400

    return jsonify({
        "success": True,
        "disease": disease,
        "medicine": get_medicine(disease),
    })


@app.route('/emergency')
def emergency():
    """
    Emergency Contacts Route
    ------------------------
    Renders urgent medical helplines and emergency assistance contacts.
    """
    return render_template('emergency.html', page_title="Emergency Contacts")


@app.route('/chatbot', methods=['GET', 'POST'])
def chatbot():

    if "chat_history" not in session:
        session["chat_history"] = []

    if request.method == "POST":

        message = request.form.get("message")

        if message:

            try:
                model = genai.GenerativeModel("models/gemini-3.6-flash")

                prompt = f"""
You are MediGuide AI.

Rules:
- Answer in simple English.
- Be friendly.
- Explain clearly.
- Never prescribe medicines.
- Keep answers under 150 words.
- End with:
⚠️ Consult a healthcare professional for medical advice.

Question:
{message}
"""

                response = model.generate_content(prompt)

                history = session.get("chat_history", [])
                history.append({
                    "user": message,
                    "bot": response.text
                })
                session["chat_history"] = history
                session.modified = True

            except Exception as e:
                history = session.get("chat_history", [])
                history.append({
                    "user": message,
                    "bot": f"Error: {e}"
                })
                session["chat_history"] = history
                session.modified = True

    return render_template(
        "chatbot.html",
        chat_history=session["chat_history"]
    )


@app.route('/profile')
@login_required
def profile():
    """
    User Profile Route - PROTECTED
    --------------------------------
    Requires an authenticated session. Unauthenticated users are redirected
    to the login page automatically by Flask-Login.
    Renders user profile settings, personal info, and health preferences.
    """
    return render_template('profile.html', page_title="User Profile")


@app.route('/profile/data', methods=['GET'])
def profile_data():
    if not current_user.is_authenticated:
        return jsonify({
            "success": False,
            "error": "Authentication required."
        }), 401

    return jsonify({
        "success": True,
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at else None
            ),
        },
    })


@app.route('/admin')
@admin_required
def admin_panel():
    """
    Admin Panel Route - ADMIN ONLY
    -------------------------------
    Requires an authenticated session AND the 'admin' role.
    Non-admin authenticated users receive a 403 Forbidden response via
    the @admin_required decorator in utils/decorators.py.

    Passes the full user list to the admin template for management.
    """
    from models.user import User
    users = User.query.order_by(User.created_at.desc()).all()
    total_users = User.query.count()
    admin_count = User.query.filter_by(role='admin').count()
    return render_template(
        'admin.html',
        page_title="Admin Panel",
        users=users,
        total_users=total_users,
        admin_count=admin_count,
    )


@app.route('/admin/data', methods=['GET'])
def admin_data():
    if not current_user.is_authenticated:
        return jsonify({
            "success": False,
            "error": "Authentication required.",
        }), 401

    if current_user.role != "admin":
        return jsonify({
            "success": False,
            "error": "Administrator privileges required.",
        }), 403

    from models.user import User

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        "success": True,
        "summary": {
            "total_users": User.query.count(),
            "admin_count": User.query.filter_by(role="admin").count(),
            "total_predictions": Prediction.query.count(),
        },
        "users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "status": "active",
            }
            for user in users
        ],
    })


# ==============================================================================
# 7. ERROR HANDLERS
# ==============================================================================

@app.errorhandler(404)
def page_not_found(e):
    """
    Custom 404 Error Handler
    ------------------------
    Renders a clean user-friendly 404 page when a route is not found.
    """
    return render_template('404.html', page_title="Page Not Found"), 404


@app.errorhandler(403)
def forbidden(e):
    """
    Custom 403 Error Handler
    ------------------------
    Renders custom 403 page when access is denied (e.g. admin_required).
    """
    return render_template('403.html', page_title="Access Denied"), 403


@app.route("/clear-chat")
def clear_chat():

    session.pop("chat_history", None)

    return redirect(url_for("chatbot"))


# ==============================================================================
# 8. REPORT ANALYZER ROUTE
# ==============================================================================

def _extract_health_metrics(analysis):
    """Compatibility wrapper for callers that used the route helper."""
    return extract_health_metrics(analysis)


@app.route('/report-analyzer', methods=['GET', 'POST'])
def report_analyzer():
    """
    Medical Report Analyzer Route
    ------------------------------
    GET : Renders the upload / paste form.
    POST: Accepts either a pasted text block or an uploaded PDF/TXT file,
          sends it to Gemini AI for structured medical analysis, and
          renders the results page with findings, risk flags, and
          recommendations.
    """
    analysis       = None
    report_text    = ""
    error          = None
    health_metrics = []

    if request.method == 'POST':
        # ── 1. Collect report text from form ─────────────────────────
        pasted_text = request.form.get('report_text', '').strip()
        uploaded    = request.files.get('report_file')

        if uploaded and uploaded.filename:
            filename = uploaded.filename.lower()
            raw_bytes = uploaded.read()
            if filename.endswith('.pdf'):
                report_text = _extract_text_from_pdf(raw_bytes)
            else:
                # Treat as plain text (txt, csv, etc.)
                report_text = raw_bytes.decode('utf-8', errors='ignore')
        elif pasted_text:
            report_text = pasted_text
        else:
            error = 'Please paste your report text or upload a file.'

        # ── 2. Call Gemini AI analyzer ────────────────────────────────
        if report_text and not error:
            analysis = analyze_report(report_text)
            if 'error' in analysis:
                error    = analysis['error']
                analysis = None
            else:
                health_metrics = analysis.get('health_metrics', [])

    return render_template(
        'report_analyzer.html',
        page_title     = 'Report Analyzer',
        analysis       = analysis,
        report_text    = report_text,
        error          = error,
        health_metrics = health_metrics
    )


# ==============================================================================
# 9. BLUEPRINT REGISTRATION
# ==============================================================================
from routes.hospital_routes import hospital_bp

app.register_blueprint(hospital_bp)
csrf.exempt(hospital_bp)


if __name__ == "__main__":
    # Disable debug mode in production, allow override via FLASK_DEBUG env var
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode)
