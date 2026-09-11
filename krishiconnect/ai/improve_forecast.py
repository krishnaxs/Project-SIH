import pandas as pd
import numpy as np
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"


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
# DATE FEATURES
# ------------------------------------------

daily_df["year"] = daily_df["date"].dt.year
daily_df["month"] = daily_df["date"].dt.month
daily_df["day"] = daily_df["date"].dt.day
daily_df["day_of_week"] = daily_df["date"].dt.dayofweek


# ------------------------------------------
# PRICE FEATURES
# ------------------------------------------

daily_df["price_lag_1"] = daily_df["modalPrice"].shift(1)
daily_df["price_lag_3"] = daily_df["modalPrice"].shift(3)
daily_df["price_lag_7"] = daily_df["modalPrice"].shift(7)
daily_df["price_lag_14"] = daily_df["modalPrice"].shift(14)
daily_df["price_lag_30"] = daily_df["modalPrice"].shift(30)


daily_df["price_rolling_7"] = (
    daily_df["modalPrice"]
    .shift(1)
    .rolling(7)
    .mean()
)

daily_df["price_rolling_30"] = (
    daily_df["modalPrice"]
    .shift(1)
    .rolling(30)
    .mean()
)


# ------------------------------------------
# ARRIVAL FEATURES
# ------------------------------------------

daily_df["arrival_lag_1"] = daily_df["arrivals"].shift(1)
daily_df["arrival_lag_7"] = daily_df["arrivals"].shift(7)
daily_df["arrival_lag_30"] = daily_df["arrivals"].shift(30)

daily_df["arrival_rolling_7"] = (
    daily_df["arrivals"]
    .shift(1)
    .rolling(7)
    .mean()
)

daily_df["arrival_rolling_30"] = (
    daily_df["arrivals"]
    .shift(1)
    .rolling(30)
    .mean()
)


# ------------------------------------------
# REMOVE INCOMPLETE ROWS
# ------------------------------------------

daily_df = daily_df.dropna().reset_index(drop=True)


# ------------------------------------------
# FEATURES
# ------------------------------------------

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

    "arrival_lag_1",
    "arrival_lag_7",
    "arrival_lag_30",

    "arrival_rolling_7",
    "arrival_rolling_30"
]


# ------------------------------------------
# TARGET: NEXT DAY PRICE
# ------------------------------------------

daily_df["target_price"] = daily_df["modalPrice"].shift(-1)

daily_df = daily_df.dropna().reset_index(drop=True)


X = daily_df[features]
y = daily_df["target_price"]


# ------------------------------------------
# TIME SPLIT
# ------------------------------------------

split_index = int(len(daily_df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


# ------------------------------------------
# MODEL
# ------------------------------------------

model = RandomForestRegressor(
    n_estimators=500,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)


print("Training improved forecasting model...")

model.fit(X_train, y_train)


# ------------------------------------------
# EVALUATION
# ------------------------------------------

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)


print("\nIMPROVED MODEL RESULTS")
print("------------------------")
print(f"MAE: ₹{mae:.2f}")
print(f"R² Score: {r2:.4f}")


# ------------------------------------------
# SAVE MODEL
# ------------------------------------------

os.makedirs("ai/models", exist_ok=True)

model_data = {
    "model": model,
    "features": features,
    "last_date": daily_df["date"].max()
}

MODEL_FILE = "ai/models/improved_price_model.pkl"

joblib.dump(model_data, MODEL_FILE)

print("\nMODEL SAVED")
print(f"Saved at: {MODEL_FILE}")