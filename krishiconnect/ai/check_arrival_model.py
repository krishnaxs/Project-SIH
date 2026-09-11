import joblib

model_data = joblib.load("ai/models/arrival_model.pkl")

print(model_data.keys())
print("\nFeatures expected by arrival model:")
print(model_data["features"])