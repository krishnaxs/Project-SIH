import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# --------------------------------------------------
# DAILY STATE-LEVEL AGGREGATION
# --------------------------------------------------

daily_df = df.groupby("date").agg(
    modalPrice=("modalPrice", "mean"),
    arrivals=("arrivals", "sum")
).reset_index()

daily_df = daily_df.sort_values("date").reset_index(drop=True)


# --------------------------------------------------
# CREATE FEATURES
# --------------------------------------------------

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

    # Rolling price features
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

    # Rolling arrival features
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


# --------------------------------------------------
# FEATURE LIST
# --------------------------------------------------

features = [

    "year",
    "month",
    "day",
    "day_of_week",

    "price_lag_1",
    "price_lag_3",
    "price_lag_7",
    "price_lag_14",
    "price_lag_30",

    "price_rolling_7",
    "price_rolling_30",

    "price_momentum_7",
    "price_momentum_30",

    "arrival_lag_1",
    "arrival_lag_7",
    "arrival_lag_30",

    "arrival_rolling_7",
    "arrival_rolling_30"
]


# --------------------------------------------------
# SPLIT BY YEAR
# --------------------------------------------------

train_data = daily_df[
    daily_df["date"] < "2025-01-01"
].copy()

test_data = daily_df[
    daily_df["date"] >= "2025-01-01"
].copy()


print("TIME SERIES VALIDATION")
print("----------------------")

print(f"Training records: {len(train_data)}")
print(f"Testing records: {len(test_data)}")

print(
    f"Training period: "
    f"{train_data['date'].min().date()} "
    f"to {train_data['date'].max().date()}"
)

print(
    f"Testing period: "
    f"{test_data['date'].min().date()} "
    f"to {test_data['date'].max().date()}"
)


# --------------------------------------------------
# TRAINING FEATURES
# --------------------------------------------------

train_features = create_features(train_data)

train_features = train_features.dropna().reset_index(drop=True)

X_train = train_features[features]
y_train = train_features["modalPrice"]


# --------------------------------------------------
# TRAIN MODEL
# --------------------------------------------------

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)


print("\nTraining model...")

model.fit(X_train, y_train)


# --------------------------------------------------
# RECURSIVE FORECASTING
# --------------------------------------------------

history = train_data.copy()

predictions = []
actual_values = []

print("\nForecasting 2025 recursively...")


for _, actual_row in test_data.iterrows():

    forecast_date = actual_row["date"]

    # Add empty future row
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

    # Add prediction to history for next forecast
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


# --------------------------------------------------
# EVALUATION
# --------------------------------------------------

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


# --------------------------------------------------
# SAMPLE RESULTS
# --------------------------------------------------

results_df = pd.DataFrame({
    "date": test_data["date"].values,
    "actual_price": actual_values,
    "predicted_price": predictions
})

print("\nFIRST 10 PREDICTIONS")
print("----------------------")

print(results_df.head(10))


# --------------------------------------------------
# SAVE RESULTS
# --------------------------------------------------

results_df.to_csv(
    "ai/data/time_series_validation_results.csv",
    index=False
)

print(
    "\nValidation results saved to:"
)

print(
    "ai/data/time_series_validation_results.csv"
)