import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score


# Load cleaned dataset
DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"

df = pd.read_csv(DATA_FILE)

print("Dataset loaded successfully!")
print(f"Total records: {len(df)}")


# Convert date to datetime
df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# Create date-based features
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["day_of_week"] = df["date"].dt.dayofweek


# Encode categorical columns

# Market mapping
market_categories = df["market"].astype("category").cat.categories.tolist()

market_mapping = {
    market: index
    for index, market in enumerate(market_categories)
}

df["market_encoded"] = df["market"].map(market_mapping)


# Variety mapping
variety_categories = df["variety"].astype("category").cat.categories.tolist()

variety_mapping = {
    variety: index
    for index, variety in enumerate(variety_categories)
}

df["variety_encoded"] = df["variety"].map(variety_mapping)


# Features used for prediction
features = [
    "market_encoded",
    "variety_encoded",
    "year",
    "month",
    "day",
    "day_of_week",
    "arrivals",
    "total_arrivals"
]


# Input features
X = df[features]


# Target: Modal Price
y = df["modalPrice"]


# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# Create model
model = RandomForestRegressor(
    n_estimators=150,
    random_state=42,
    n_jobs=-1
)


print("\nTraining price prediction model...")


# Train
model.fit(X_train, y_train)


# Predict
predictions = model.predict(X_test)


# Evaluate
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)


print("\nMODEL RESULTS")
print("----------------------")
print(f"MAE: ₹{mae:.2f}")
print(f"R² Score: {r2:.4f}")


# Create models directory
os.makedirs("ai/models", exist_ok=True)


# Save model and required mappings
model_data = {
    "model": model,
    "market_mapping": market_mapping,
    "variety_mapping": variety_mapping,
    "features": features
}


MODEL_FILE = "ai/models/price_model.pkl"

joblib.dump(model_data, MODEL_FILE)


print("\nMODEL TRAINED SUCCESSFULLY")
print("----------------------")
print(f"Saved at: {MODEL_FILE}")