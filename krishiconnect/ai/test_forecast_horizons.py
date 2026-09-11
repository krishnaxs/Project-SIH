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
# FEATURE CREATION
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

    # Price rolling averages
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

    # Price momentum
    data["price_momentum_7"] = (
        data["price_lag_1"]
        - data["price_lag_7"]
    )

    data["price_momentum_30"] = (
        data["price_lag_1"]
        - data["price_lag_30"]
    )

    # Arrival lags
    data["arrival_lag_1"] = data["arrivals"].shift(1)
    data["arrival_lag_7"] = data["arrivals"].shift(7)
    data["arrival_lag_30"] = data["arrivals"].shift(30)

    # Arrival rolling averages
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

    return data


# ------------------------------------------
# LOAD MODEL
# ------------------------------------------

model_data = joblib.load(MODEL_FILE)

model = model_data["model"]
features = model_data["features"]


# ------------------------------------------
# RECURSIVE FORECAST FUNCTION
# ------------------------------------------

def forecast_horizon(
    history_data,
    future_data,
    horizon_days
):

    history = history_data.copy()

    predictions = []
    actual_values = []

    future_subset = future_data.head(horizon_days)

    for _, actual_row in future_subset.iterrows():

        forecast_date = actual_row["date"]

        future_row = pd.DataFrame([{
            "date": forecast_date,
            "modalPrice": np.nan,

            # Actual arrivals used for isolated
            # price-model horizon evaluation
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

        actual_values.append(
            actual_row["modalPrice"]
        )

        # Add predicted price recursively
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


    mae = mean_absolute_error(
        actual_values,
        predictions
    )

    r2 = r2_score(
        actual_values,
        predictions
    )

    return mae, r2


# ------------------------------------------
# TEST CONFIGURATION
# ------------------------------------------

# Use data before 2025 as known history
history_data = daily_df[
    daily_df["date"] < "2025-01-01"
].copy()

# Use 2025 as unseen future
future_data = daily_df[
    daily_df["date"] >= "2025-01-01"
].copy()


horizons = [
    1,
    7,
    30,
    90
]


print("\nXGBOOST FORECAST HORIZON TEST")
print("================================")

print(
    f"\nHistory ends: "
    f"{history_data['date'].max().date()}"
)

print(
    f"Testing begins: "
    f"{future_data['date'].min().date()}"
)


# ------------------------------------------
# TEST EACH HORIZON
# ------------------------------------------

results = []

for horizon in horizons:

    print(
        f"\nTesting {horizon}-day forecast..."
    )

    mae, r2 = forecast_horizon(
        history_data,
        future_data,
        horizon
    )

    results.append({
        "horizon_days": horizon,
        "mae": mae,
        "r2_score": r2
    })

    print(f"MAE: ₹{mae:.2f}")
    print(f"R² Score: {r2:.4f}")


# ------------------------------------------
# FINAL SUMMARY
# ------------------------------------------

print("\n================================")
print("FORECAST HORIZON SUMMARY")
print("================================")

for result in results:

    print(
        f"\n{result['horizon_days']} Days"
    )

    print(
        f"MAE: ₹{result['mae']:.2f}"
    )

    print(
        f"R² Score: "
        f"{result['r2_score']:.4f}"
    )


# ------------------------------------------
# SAVE RESULTS
# ------------------------------------------

results_df = pd.DataFrame(results)

results_df.to_csv(
    "ai/data/xgboost_horizon_results.csv",
    index=False
)

print(
    "\nResults saved to:"
)

print(
    "ai/data/xgboost_horizon_results.csv"
)