import pandas as pd
import numpy as np
import joblib

from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"
MODEL_FILE = "ai/models/xgboost_price_model.pkl"


# ------------------------------------------
# LOAD DATA
# ------------------------------------------

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# ------------------------------------------
# DAILY AGGREGATION
# ------------------------------------------

daily_df = df.groupby("date").agg(
    modalPrice=("modalPrice", "mean"),
    arrivals=("arrivals", "sum")
).reset_index()

daily_df = daily_df.sort_values("date").reset_index(drop=True)


# ------------------------------------------
# CREATE FEATURES
# ------------------------------------------

def create_features(data):

    data = data.copy()

    data["year"] = data["date"].dt.year
    data["month"] = data["date"].dt.month
    data["day"] = data["date"].dt.day
    data["day_of_week"] = data["date"].dt.dayofweek

    # Price lags
    data["price_lag_1"] = data["modalPrice"].shift(1)
    data["price_lag_3"] = data["modalPrice"].shift(3)
    data["price_lag_7"] = data["modalPrice"].shift(7)
    data["price_lag_14"] = data["modalPrice"].shift(14)
    data["price_lag_30"] = data["modalPrice"].shift(30)

    # Arrival lags
    data["arrival_lag_1"] = data["arrivals"].shift(1)
    data["arrival_lag_7"] = data["arrivals"].shift(7)
    data["arrival_lag_30"] = data["arrivals"].shift(30)

    # Rolling price
    data["price_rolling_7"] = (
        data["modalPrice"]
        .shift(1)
        .rolling(7)
        .mean()
    )

    data["price_rolling_30"] = (
        data["modalPrice"]
        .shift(1)
        .rolling(30)
        .mean()
    )

    # Rolling arrivals
    data["arrival_rolling_7"] = (
        data["arrivals"]
        .shift(1)
        .rolling(7)
        .mean()
    )

    data["arrival_rolling_30"] = (
        data["arrivals"]
        .shift(1)
        .rolling(30)
        .mean()
    )

    # Momentum
    data["price_momentum_7"] = (
        data["price_lag_1"]
        - data["price_lag_7"]
    )

    data["price_momentum_30"] = (
        data["price_lag_1"]
        - data["price_lag_30"]
    )

    return data


# ------------------------------------------
# LOAD MODEL
# ------------------------------------------

model_data = joblib.load(MODEL_FILE)

model = model_data["model"]
features = model_data["features"]


print("XGBOOST TIME SERIES VALIDATION")
print("--------------------------------")


# ------------------------------------------
# SPLIT DATA
# Train history: 2023-2024
# Validation: 2025
# ------------------------------------------

train_data = daily_df[
    daily_df["date"] < "2025-01-01"
].copy()

test_data = daily_df[
    daily_df["date"] >= "2025-01-01"
].copy()


print(
    f"Training period: "
    f"{train_data['date'].min().date()} "
    f"to {train_data['date'].max().date()}"
)

print(
    f"Validation period: "
    f"{test_data['date'].min().date()} "
    f"to {test_data['date'].max().date()}"
)


# ------------------------------------------
# RECURSIVE FORECAST
# ------------------------------------------

history = train_data.copy()

predictions = []
actual_values = []


print("\nForecasting 2025 recursively...")


for _, actual_row in test_data.iterrows():

    forecast_date = actual_row["date"]

    # Add future row with unknown price
    future_row = pd.DataFrame([{
        "date": forecast_date,
        "modalPrice": np.nan,
        "arrivals": actual_row["arrivals"]
    }])

    temp_history = pd.concat(
        [history, future_row],
        ignore_index=True
    )

    temp_features = create_features(temp_history)

    prediction_row = temp_features.iloc[[-1]]

    X_pred = prediction_row[features]

    predicted_price = model.predict(X_pred)[0]

    predictions.append(predicted_price)

    actual_values.append(actual_row["modalPrice"])

    # Add prediction to history
    history = pd.concat(
        [
            history,
            pd.DataFrame([{
                "date": forecast_date,
                "modalPrice": predicted_price,
                "arrivals": actual_row["arrivals"]
            }])
        ],
        ignore_index=True
    )


# ------------------------------------------
# EVALUATION
# ------------------------------------------

mae = mean_absolute_error(
    actual_values,
    predictions
)

r2 = r2_score(
    actual_values,
    predictions
)


print("\nVALIDATION RESULTS")
print("----------------------")

print(f"MAE: ₹{mae:.2f}")
print(f"R² Score: {r2:.4f}")


# ------------------------------------------
# SAVE RESULTS
# ------------------------------------------

results_df = pd.DataFrame({
    "date": test_data["date"].values,
    "actual_price": actual_values,
    "predicted_price": predictions
})

results_df.to_csv(
    "ai/data/xgboost_validation_results.csv",
    index=False
)


print("\nResults saved to:")
print("ai/data/xgboost_validation_results.csv")