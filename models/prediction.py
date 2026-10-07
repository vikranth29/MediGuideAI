from datetime import datetime
from models import db


class Prediction(db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    symptoms = db.Column(db.Text, nullable=False)

    disease = db.Column(db.String(100), nullable=False)

    description = db.Column(db.Text)

    medicine = db.Column(db.Text)

    prediction_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __init__(
        self,
        symptoms: str,
        disease: str,
        user_id: int | None = None,
        description: str | None = None,
        medicine: str | None = None,
        **kwargs,
    ):
        super().__init__(
            user_id=user_id,
            symptoms=symptoms,
            disease=disease,
            description=description,
            medicine=medicine,
            **kwargs,
        )

    def __repr__(self):
        return f"<Prediction {self.disease}>"
