import pandas as pd
import numpy as np
import joblib

from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"
MODEL_FILE = "ai/models/forecasting_price_model_v2.pkl"


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
# USE LAST 20% AS VALIDATION DATA
# ------------------------------------------

split_index = int(len(daily_df) * 0.8)

validation_df = daily_df.iloc[split_index:].copy()

actual = validation_df["modalPrice"]


# ------------------------------------------
# NAIVE MODEL
# Yesterday's price = today's prediction
# ------------------------------------------

naive_predictions = validation_df["modalPrice"].shift(1)

naive_actual = actual.iloc[1:]
naive_predictions = naive_predictions.iloc[1:]

naive_mae = mean_absolute_error(
    naive_actual,
    naive_predictions
)

naive_r2 = r2_score(
    naive_actual,
    naive_predictions
)


# ------------------------------------------
# 7-DAY MOVING AVERAGE
# ------------------------------------------

ma_predictions = (
    daily_df["modalPrice"]
    .shift(1)
    .rolling(7)
    .mean()
)

ma_predictions = ma_predictions.iloc[split_index:]

mask = ma_predictions.notna()

ma_actual = actual[mask]
ma_predictions = ma_predictions[mask]

ma_mae = mean_absolute_error(
    ma_actual,
    ma_predictions
)

ma_r2 = r2_score(
    ma_actual,
    ma_predictions
)


# ------------------------------------------
# RESULTS
# ------------------------------------------

print("\nMODEL COMPARISON")
print("--------------------------------")

print("\n1. NAIVE MODEL")
print(f"MAE: ₹{naive_mae:.2f}")
print(f"R² Score: {naive_r2:.4f}")


print("\n2. 7-DAY MOVING AVERAGE")
print(f"MAE: ₹{ma_mae:.2f}")
print(f"R² Score: {ma_r2:.4f}")


print("\n--------------------------------")