import pandas as pd

# Load disease descriptions
description_df = pd.read_csv("datasets/symptom_Description.csv")


def get_description(disease):
    """
    Returns the description of a disease.
    """

    result = description_df[
        description_df["Disease"].str.lower() == disease.lower()
    ]

    if not result.empty:
        return result.iloc[0]["Description"]

    return "Description not available."
