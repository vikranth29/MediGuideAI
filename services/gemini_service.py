import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use the available model
model = genai.GenerativeModel("models/gemini-3.6-flash")


def get_ai_advice(disease, description):
    prompt = f"""
You are an AI healthcare assistant.

A machine learning model predicted the following disease:

Disease:
{disease}

Description:
{description}

Please provide:

1. Easy explanation of the disease
2. Diet recommendations
3. Lifestyle advice
4. When the patient should consult a doctor
5. A short medical disclaimer

Keep the response simple, friendly, and educational.
Do not prescribe medication or claim to diagnose the patient.
"""

    response = model.generate_content(prompt)

    return response.text
