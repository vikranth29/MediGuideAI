from datetime import datetime
from flask_login import UserMixin

from models import db, bcrypt


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(120), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    # Role field: default 'user', with 'admin' as the other option
    role = db.Column(db.String(20), nullable=False, default="user")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, full_name: str, email: str, role: str = "user", **kwargs):
        super().__init__(full_name=full_name, email=email, role=role, **kwargs)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(
            password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
