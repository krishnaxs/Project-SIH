import joblib

model_data = joblib.load(
    "ai/models/forecasting_price_model_v2.pkl"
)

print(model_data.keys())

print("\nFeatures expected by Price Model:")
print(model_data["features"])