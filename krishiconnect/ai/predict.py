import joblib
import pandas as pd
from datetime import datetime

# Load saved model and mappings
model_data = joblib.load("ai/models/demand_model.pkl")

model = model_data["model"]
crop_mapping = model_data["crop_mapping"]
location_mapping = model_data["location_mapping"]
features = model_data["features"]


def predict_demand(crop_name, location, date):

    # Check whether crop exists in training data
    if crop_name not in crop_mapping:
        return f"Crop '{crop_name}' was not found in the training data."

    # Check whether location exists in training data
    if location not in location_mapping:
        return f"Location '{location}' was not found in the training data."

    # Convert date
    prediction_date = pd.to_datetime(date)

    # Prepare input data
    input_data = pd.DataFrame([{
        "crop_encoded": crop_mapping[crop_name],
        "location_encoded": location_mapping[location],
        "year": prediction_date.year,
        "month": prediction_date.month,
        "day": prediction_date.day,
        "day_of_week": prediction_date.dayofweek
    }])

    # Ensure feature order matches training
    input_data = input_data[features]

    # Predict demand
    prediction = model.predict(input_data)[0]

    return round(prediction, 2)


# Test prediction
if __name__ == "__main__":

    result = predict_demand(
        crop_name="Tomato",
        location="Delhi",
        date="2026-10-15"
    )

    print("\nDemand Forecast")
    print("----------------")
    print("Crop: Tomato")
    print("Location: Delhi")
    print("Date: 2026-10-15")
    print(f"Predicted Demand: {result}")    