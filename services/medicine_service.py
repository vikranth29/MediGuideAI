import pandas as pd

# Load dataset
medicine_df = pd.read_csv("datasets/training.csv")


def get_medicine(disease):
    """
    Returns medicine(s) for the predicted disease.
    """

    result = medicine_df[
        medicine_df["prognosis"].str.lower() == disease.lower()
    ]

    if result.empty:
        return "No medicine information available."

    # Remove duplicate medicine entries
    medicines = result["medicine"].dropna().unique()

    return ", ".join(medicines)
