import pandas as pd

precaution_df = pd.read_csv("datasets/symptom_precaution.csv")


def get_precautions(disease):
    row = precaution_df[
        precaution_df["Disease"].str.lower() == disease.lower()
    ]

    if row.empty:
        return []

    return [
        row.iloc[0]["Precaution_1"],
        row.iloc[0]["Precaution_2"],
        row.iloc[0]["Precaution_3"],
        row.iloc[0]["Precaution_4"],
    ]
