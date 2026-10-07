import joblib
import numpy as np

# Load model and feature list
model = joblib.load("ml_model/disease_model.pkl")
features = joblib.load("ml_model/features.pkl")


def predict_disease(selected_symptoms):
    """
    selected_symptoms: list of symptom names
    Example:
    ["itching", "headache", "cough"]
    """

    input_vector = np.zeros(len(features))

    for symptom in selected_symptoms:
        symptom = symptom.strip()
        if symptom in features:
            index = features.index(symptom)
            input_vector[index] = 1

    prediction = model.predict([input_vector])[0]

    return prediction
