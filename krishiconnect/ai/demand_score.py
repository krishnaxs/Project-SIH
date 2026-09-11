import pandas as pd
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "uttar_pradesh_tomato_cleaned.csv"
)


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
# CREATE DATE FEATURES
# ------------------------------------------

df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month


# ------------------------------------------
# MONTHLY AGGREGATION
# ------------------------------------------

monthly_data = df.groupby(
    ["year", "month"]
).agg(
    average_price=("modalPrice", "mean"),
    total_arrivals=("arrivals", "sum")
).reset_index()


# ------------------------------------------
# NORMALIZATION FUNCTION
# ------------------------------------------

def normalize(value, minimum, maximum):

    if maximum == minimum:
        return 50

    score = (
        (value - minimum)
        / (maximum - minimum)
    ) * 100

    return max(0, min(100, score))


# ------------------------------------------
# DEMAND SCORE FUNCTION
# ------------------------------------------

def calculate_demand_score(
    predicted_price,
    predicted_arrivals,
    month
):

    # Overall historical ranges
    price_min = monthly_data["average_price"].min()
    price_max = monthly_data["average_price"].max()

    arrivals_min = monthly_data["total_arrivals"].min()
    arrivals_max = monthly_data["total_arrivals"].max()


    # 1. PRICE STRENGTH (50%)
    price_score = normalize(
        predicted_price,
        price_min,
        price_max
    )


    # 2. SUPPLY SCARCITY (30%)
    arrival_score = normalize(
        predicted_arrivals,
        arrivals_min,
        arrivals_max
    )

    supply_scarcity_score = 100 - arrival_score


    # 3. SEASONAL SIGNAL (20%)
    seasonal_data = monthly_data[
        monthly_data["month"] == month
    ]

    seasonal_price = seasonal_data[
        "average_price"
    ].mean()

    seasonal_score = normalize(
        seasonal_price,
        price_min,
        price_max
    )


    # ------------------------------------------
    # FINAL DEMAND SCORE
    # ------------------------------------------

    demand_score = (
        price_score * 0.50
        + supply_scarcity_score * 0.30
        + seasonal_score * 0.20
    )

    demand_score = max(
        0,
        min(100, demand_score)
    )

    return round(demand_score, 2)


# ------------------------------------------
# TEST
# ------------------------------------------

if __name__ == "__main__":

    predicted_price = 2800
    predicted_arrivals = 5000
    month = 12


    score = calculate_demand_score(
        predicted_price,
        predicted_arrivals,
        month
    )


    print("\nDEMAND SCORE RESULT")
    print("-------------------")
    print(f"Predicted Price: ₹{predicted_price}")
    print(f"Predicted Arrivals: {predicted_arrivals}")
    print(f"Month: {month}")
    print(f"\nExpected Demand Score: {score}%")