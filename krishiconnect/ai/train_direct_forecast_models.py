import pandas as pd
import joblib
import os

from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, r2_score


DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# ------------------------------------------
# DAILY STATE-LEVEL DATA
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
# PRICE LAG FEATURES
# ------------------------------------------

daily_df["price_lag_1"] = daily_df["modalPrice"].shift(1)
daily_df["price_lag_3"] = daily_df["modalPrice"].shift(3)
daily_df["price_lag_7"] = daily_df["modalPrice"].shift(7)
daily_df["price_lag_14"] = daily_df["modalPrice"].shift(14)
daily_df["price_lag_30"] = daily_df["modalPrice"].shift(30)


# ------------------------------------------
# PRICE ROLLING FEATURES
# ------------------------------------------

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
# PRICE MOMENTUM
# ------------------------------------------

daily_df["price_momentum_7"] = (
    daily_df["price_lag_1"]
    - daily_df["price_lag_7"]
)

daily_df["price_momentum_30"] = (
    daily_df["price_lag_1"]
    - daily_df["price_lag_30"]
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
# REMOVE INITIAL NULL VALUES
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

    "price_momentum_7",
    "price_momentum_30",

    "arrival_lag_1",
    "arrival_lag_7",
    "arrival_lag_30",

    "arrival_rolling_7",
    "arrival_rolling_30"
]


# ------------------------------------------
# FORECAST HORIZONS
# ------------------------------------------

horizons = {
    1: "1_day",
    7: "7_day",
    30: "30_day"
}


os.makedirs("ai/models/direct_forecast", exist_ok=True)


# ------------------------------------------
# TRAIN MODEL FOR EACH HORIZON
# ------------------------------------------

for days_ahead, model_name in horizons.items():

    print("\n================================")
    print(f"TRAINING {model_name.upper()} FORECAST MODEL")
    print("================================")


    # Target price after N days
    training_data = daily_df.copy()

    training_data["target"] = (
        training_data["modalPrice"]
        .shift(-days_ahead)
    )

    training_data = (
        training_data
        .dropna()
        .reset_index(drop=True)
    )


    X = training_data[features]
    y = training_data["target"]


    # Time-based split
    split_index = int(len(training_data) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]


    # Model
    model = XGBRegressor(

        n_estimators=1000,
        learning_rate=0.03,
        max_depth=8,
        min_child_weight=5,

        subsample=0.8,
        colsample_bytree=0.8,

        objective="reg:squarederror",

        random_state=42,
        n_jobs=-1
    )


    print("Training model...")

    model.fit(
        X_train,
        y_train
    )


    # Predictions
    predictions = model.predict(X_test)


    mae = mean_absolute_error(
        y_test,
        predictions
    )

    r2 = r2_score(
        y_test,
        predictions
    )


    print("\nRESULTS")

    print(
        f"Forecast Horizon: "
        f"{days_ahead} days"
    )

    print(
        f"MAE: ₹{mae:.2f}"
    )

    print(
        f"R² Score: {r2:.4f}"
    )


    # Save model
    model_data = {

        "model": model,

        "features": features,

        "horizon_days": days_ahead,

        "last_date": (
            training_data["date"].max()
        )
    }


    model_file = (
        f"ai/models/direct_forecast/"
        f"{model_name}_price_model.pkl"
    )


    joblib.dump(
        model_data,
        model_file
    )


    print(
        f"Saved: {model_file}"
    )


print("\n================================")
print("ALL DIRECT FORECAST MODELS TRAINED")
print("================================")