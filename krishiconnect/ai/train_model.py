import pandas as pd
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# MongoDB connection
MONGO_URI = "mongodb+srv://krishnax8126_db_user:Npr04vE8qHfZCI9l@mycluster.zhiz6yy.mongodb.net/digitalkisan?appName=MyCluster"

client = MongoClient(MONGO_URI)

db = client["digitalkisan"]
collection = db["demands"]

# Fetch data
data = list(collection.find())

print(f"Records fetched: {len(data)}")

if len(data) == 0:
    print("No data found. Check database and collection names.")
    exit()

# Convert to DataFrame
df = pd.DataFrame(data)

# Remove unnecessary MongoDB fields
df = df.drop(columns=["_id", "__v"], errors="ignore")

# Convert date
df["date"] = pd.to_datetime(df["date"])

# Date features
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["day_of_week"] = df["date"].dt.dayofweek

# Create and save crop mapping
crop_categories = df["cropName"].astype("category").cat.categories.tolist()
crop_mapping = {
    crop: index for index, crop in enumerate(crop_categories)
}

# Create and save location mapping
location_categories = df["location"].astype("category").cat.categories.tolist()
location_mapping = {
    location: index for index, location in enumerate(location_categories)
}

# Encode data
df["crop_encoded"] = df["cropName"].map(crop_mapping)
df["location_encoded"] = df["location"].map(location_mapping)

# Features
features = [
    "crop_encoded",
    "location_encoded",
    "year",
    "month",
    "day",
    "day_of_week"
]

X = df[features]
y = df["demand"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Create model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

print("\nTraining model...")

model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("\nModel Results")
print("----------------")
print(f"MAE: {mae:.2f}")
print(f"R² Score: {r2:.4f}")

# Create models directory
os.makedirs("ai/models", exist_ok=True)

# Save EVERYTHING required for prediction
model_data = {
    "model": model,
    "crop_mapping": crop_mapping,
    "location_mapping": location_mapping,
    "features": features
}

joblib.dump(model_data, "ai/models/demand_model.pkl")

print("\nModel trained and saved successfully!")
print("Saved at: ai/models/demand_model.pkl")