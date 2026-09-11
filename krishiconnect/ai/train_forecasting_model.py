import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"

df = pd.read_csv(DATA_FILE)

print("Dataset loaded successfully!")
print(f"Total records: {len(df)}")


# Convert date
df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# --------------------------------------------------
# AGGREGATE DAILY DATA
# --------------------------------------------------

# Multiple markets and varieties exist per day.
# Aggregate them to get state-level daily data.

daily_df = df.groupby("date").agg(
    modalPrice=("modalPrice", "mean"),
    arrivals=("arrivals", "sum"),
    total_arrivals=("total_arrivals", "sum")
).reset_index()


daily_df = daily_df.sort_values("date").reset_index(drop=True)


# --------------------------------------------------
# DATE FEATURES
# --------------------------------------------------

daily_df["year"] = daily_df["date"].dt.year
daily_df["month"] = daily_df["date"].dt.month
daily_df["day"] = daily_df["date"].dt.day
daily_df["day_of_week"] = daily_df["date"].dt.dayofweek


# --------------------------------------------------
# LAG FEATURES
# --------------------------------------------------

# Previous day price
daily_df["price_lag_1"] = daily_df["modalPrice"].shift(1)

# Previous week price
daily_df["price_lag_7"] = daily_df["modalPrice"].shift(7)

# Previous month price
daily_df["price_lag_30"] = daily_df["modalPrice"].shift(30)


# Previous arrivals
daily_df["arrival_lag_1"] = daily_df["arrivals"].shift(1)
daily_df["arrival_lag_7"] = daily_df["arrivals"].shift(7)
daily_df["arrival_lag_30"] = daily_df["arrivals"].shift(30)


# Remove rows where lag data doesn't exist
daily_df = daily_df.dropna().reset_index(drop=True)


print(f"\nRecords after lag processing: {len(daily_df)}")


# --------------------------------------------------
# FEATURES
# --------------------------------------------------

features = [
    "year",
    "month",
    "day",
    "day_of_week",

    "price_lag_1",
    "price_lag_7",
    "price_lag_30",

    "arrival_lag_1",
    "arrival_lag_7",
    "arrival_lag_30"
]


X = daily_df[features]
y = daily_df["modalPrice"]


# --------------------------------------------------
# TIME-BASED SPLIT
# --------------------------------------------------

# First 80% = training
# Last 20% = testing

split_index = int(len(daily_df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


print("\nTraining period:")
print(daily_df["date"].iloc[0])
print("to")
print(daily_df["date"].iloc[split_index - 1])

print("\nTesting period:")
print(daily_df["date"].iloc[split_index])
print("to")
print(daily_df["date"].iloc[-1])


# --------------------------------------------------
# MODEL
# --------------------------------------------------

model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)


print("\nTraining forecasting model...")

model.fit(X_train, y_train)


# --------------------------------------------------
# EVALUATION
# --------------------------------------------------

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)


print("\nFORECASTING MODEL RESULTS")
print("-------------------------")
print(f"MAE: ₹{mae:.2f}")
print(f"R² Score: {r2:.4f}")


# --------------------------------------------------
# SAVE MODEL
# --------------------------------------------------

os.makedirs("ai/models", exist_ok=True)


model_data = {
    "model": model,
    "features": features,
    "last_date": daily_df["date"].max()
}


MODEL_FILE = "ai/models/forecasting_price_model.pkl"

joblib.dump(model_data, MODEL_FILE)


print("\nMODEL SAVED SUCCESSFULLY")
print(f"Saved at: {MODEL_FILE}")