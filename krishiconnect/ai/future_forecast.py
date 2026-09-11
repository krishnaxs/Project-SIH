import pandas as pd
import numpy as np
import joblib

from demand_score import calculate_demand_score


# ------------------------------------------
# FILE PATHS
# ------------------------------------------

DATA_FILE = "ai/data/uttar_pradesh_tomato_cleaned.csv"

PRICE_MODEL_FILE = "ai/models/forecasting_price_model_v2.pkl"
ARRIVAL_MODEL_FILE = "ai/models/arrival_model.pkl"


# ------------------------------------------
# LOAD MODELS
# ------------------------------------------

price_model_data = joblib.load(PRICE_MODEL_FILE)

price_model = price_model_data["model"]
price_features = price_model_data["features"]


arrival_model_data = joblib.load(ARRIVAL_MODEL_FILE)

arrival_model = arrival_model_data["model"]
arrival_features = arrival_model_data["features"]


# ------------------------------------------
# LOAD HISTORICAL DATA
# ------------------------------------------

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)


# Aggregate daily state-level data

daily_df = df.groupby("date").agg(
    modalPrice=("modalPrice", "mean"),
    arrivals=("arrivals", "sum")
).reset_index()

daily_df = daily_df.sort_values("date").reset_index(drop=True)


# ------------------------------------------
# DATE FEATURES
# ------------------------------------------

def get_date_features(date):

    return {
        "year": date.year,
        "month": date.month,
        "day": date.day,
        "day_of_week": date.dayofweek
    }


# ------------------------------------------
# CREATE PRICE FEATURES
# ------------------------------------------

def create_price_features(history, date):

    features = get_date_features(date)

    features.update({

        "price_lag_1":
            history["modalPrice"].iloc[-1],

        "price_lag_3":
            history["modalPrice"].iloc[-3],

        "price_lag_7":
            history["modalPrice"].iloc[-7],

        "price_lag_14":
            history["modalPrice"].iloc[-14],

        "price_lag_30":
            history["modalPrice"].iloc[-30],

        "price_rolling_7":
            history["modalPrice"].tail(7).mean(),

        "price_rolling_30":
            history["modalPrice"].tail(30).mean(),

        "price_momentum_7":
            history["modalPrice"].iloc[-1]
            - history["modalPrice"].iloc[-7],

        "price_momentum_30":
            history["modalPrice"].iloc[-1]
            - history["modalPrice"].iloc[-30],


        # Arrival features required by Price Model

        "arrival_lag_1":
            history["arrivals"].iloc[-1],

        "arrival_lag_7":
            history["arrivals"].iloc[-7],

        "arrival_lag_30":
            history["arrivals"].iloc[-30],

        "arrival_rolling_7":
            history["arrivals"].tail(7).mean(),

        "arrival_rolling_30":
            history["arrivals"].tail(30).mean()

    })

    return features


# ------------------------------------------
# CREATE ARRIVAL FEATURES
# ------------------------------------------

def create_arrival_features(history, date):

    features = get_date_features(date)

    features.update({

        "arrival_lag_1":
            history["arrivals"].iloc[-1],

        "arrival_lag_3":
            history["arrivals"].iloc[-3],

        "arrival_lag_7":
            history["arrivals"].iloc[-7],

        "arrival_lag_14":
            history["arrivals"].iloc[-14],

        "arrival_lag_30":
            history["arrivals"].iloc[-30],

        "arrival_rolling_7":
            history["arrivals"].tail(7).mean(),

        "arrival_rolling_30":
            history["arrivals"].tail(30).mean(),

        "arrival_momentum_7":
            history["arrivals"].iloc[-1]
            - history["arrivals"].iloc[-7],

        "arrival_momentum_30":
            history["arrivals"].iloc[-1]
            - history["arrivals"].iloc[-30]

    })

    return features


# ------------------------------------------
# FUTURE FORECAST FUNCTION
# ------------------------------------------

def forecast_until(target_date):

    target_date = pd.to_datetime(target_date)

    history = daily_df.copy()

    last_known_date = history["date"].max()


    if target_date <= last_known_date:

        raise ValueError(
            f"Target date must be after {last_known_date.date()}"
        )


    current_date = last_known_date + pd.Timedelta(days=1)


    while current_date <= target_date:


        # ----------------------------------
        # PREDICT ARRIVALS FIRST
        # ----------------------------------

        arrival_features_dict = create_arrival_features(
            history,
            current_date
        )

        arrival_input = pd.DataFrame(
            [arrival_features_dict]
        )

        arrival_input = arrival_input[
            arrival_features
        ]

        predicted_arrivals = arrival_model.predict(
            arrival_input
        )[0]

        # Prevent negative arrivals
        predicted_arrivals = max(
            0,
            predicted_arrivals
        )


        # ----------------------------------
        # PREDICT PRICE
        # ----------------------------------

        price_features_dict = create_price_features(
            history,
            current_date
        )

        price_input = pd.DataFrame(
            [price_features_dict]
        )

        price_input = price_input[
            price_features
        ]

        predicted_price = price_model.predict(
            price_input
        )[0]

        # Prevent negative prices
        predicted_price = max(
            0,
            predicted_price
        )


        # ----------------------------------
        # ADD PREDICTION TO HISTORY
        # ----------------------------------

        new_row = pd.DataFrame([{

            "date":
                current_date,

            "modalPrice":
                predicted_price,

            "arrivals":
                predicted_arrivals

        }])


        history = pd.concat(
            [history, new_row],
            ignore_index=True
        )


        current_date += pd.Timedelta(days=1)


    # Final predicted day
    final_prediction = history.iloc[-1]


    demand_score = calculate_demand_score(
        predicted_price=final_prediction["modalPrice"],
        predicted_arrivals=final_prediction["arrivals"],
        month=target_date.month
    )


    return {

        "date":
            target_date.strftime("%Y-%m-%d"),

        "predicted_price":
            round(
                final_prediction["modalPrice"],
                2
            ),

        "predicted_arrivals":
            round(
                final_prediction["arrivals"],
                2
            ),

        "demand_score":
            round(
                demand_score,
                2
            )
    }

# ------------------------------------------
# MONTHLY FORECAST FUNCTION
# ------------------------------------------

def forecast_month(year, month):

    # First day of selected month
    start_date = pd.Timestamp(
        year=year,
        month=month,
        day=1
    )

    # Last day of selected month
    end_date = start_date + pd.offsets.MonthEnd(1)


    # Start with historical data
    history = daily_df.copy()

    last_known_date = history["date"].max()


    if start_date <= last_known_date:

        raise ValueError(
            f"Month must start after "
            f"{last_known_date.strftime('%Y-%m-%d')}"
        )


    current_date = last_known_date + pd.Timedelta(days=1)

    monthly_predictions = []


    # ----------------------------------
    # RECURSIVELY PREDICT UNTIL MONTH END
    # ----------------------------------

    while current_date <= end_date:


        # Predict arrivals
        arrival_features_dict = create_arrival_features(
            history,
            current_date
        )

        arrival_input = pd.DataFrame(
            [arrival_features_dict]
        )

        arrival_input = arrival_input[
            arrival_features
        ]

        predicted_arrivals = arrival_model.predict(
            arrival_input
        )[0]

        predicted_arrivals = max(
            0,
            predicted_arrivals
        )


        # Predict price
        price_features_dict = create_price_features(
            history,
            current_date
        )

        price_input = pd.DataFrame(
            [price_features_dict]
        )

        price_input = price_input[
            price_features
        ]

        predicted_price = price_model.predict(
            price_input
        )[0]

        predicted_price = max(
            0,
            predicted_price
        )


        # Save prediction to history
        new_row = pd.DataFrame([{

            "date": current_date,
            "modalPrice": predicted_price,
            "arrivals": predicted_arrivals

        }])

        history = pd.concat(
            [history, new_row],
            ignore_index=True
        )


        # Only store dates belonging to requested month
        if current_date >= start_date:

            monthly_predictions.append({

                "date": current_date,
                "price": predicted_price,
                "arrivals": predicted_arrivals

            })


        current_date += pd.Timedelta(days=1)


    # ----------------------------------
    # CALCULATE MONTHLY AVERAGES
    # ----------------------------------

    monthly_df = pd.DataFrame(
        monthly_predictions
    )


    average_price = monthly_df["price"].mean()

    average_arrivals = monthly_df["arrivals"].mean()


    # Calculate demand score
    demand_score = calculate_demand_score(

        predicted_price=average_price,

        predicted_arrivals=average_arrivals,

        month=month

    )


    return {

        "month":
            start_date.strftime("%B %Y"),

        "average_price":
            round(average_price, 2),

        "average_arrivals":
            round(average_arrivals, 2),

        "demand_score":
            round(demand_score, 2)

    }

# ------------------------------------------
# MULTIPLE MONTH FORECAST FUNCTION
# ------------------------------------------

def forecast_multiple_months(months):

    results = []

    for year, month in months:

        result = forecast_month(
            year,
            month
        )

        results.append(result)

    return results

# ------------------------------------------
# CONSECUTIVE MULTI-MONTH FORECAST
# ------------------------------------------

def forecast_months_consecutively(months):

    history = daily_df.copy()

    last_known_date = history["date"].max()

    # Convert requested months into timestamps
    requested_months = [
        pd.Timestamp(year=year, month=month, day=1)
        for year, month in months
    ]

    requested_months.sort()

    first_month = requested_months[0]
    last_month = requested_months[-1]

    # Forecast must be after historical data
    if first_month <= last_known_date:

        raise ValueError(
            f"Forecast months must start after "
            f"{last_known_date.strftime('%Y-%m-%d')}"
        )

    # Start forecasting from next day after dataset
    current_date = last_known_date + pd.Timedelta(days=1)

    # End on last day of final requested month
    end_date = last_month + pd.offsets.MonthEnd(1)

    all_predictions = []


    # ------------------------------------------
    # RECURSIVELY FORECAST DAY BY DAY
    # ------------------------------------------

    while current_date <= end_date:


        # Predict arrivals first
        arrival_features_dict = create_arrival_features(
            history,
            current_date
        )

        arrival_input = pd.DataFrame(
            [arrival_features_dict]
        )

        arrival_input = arrival_input[
            arrival_features
        ]

        predicted_arrivals = arrival_model.predict(
            arrival_input
        )[0]

        predicted_arrivals = max(
            0,
            predicted_arrivals
        )


        # Predict price
        price_features_dict = create_price_features(
            history,
            current_date
        )

        price_input = pd.DataFrame(
            [price_features_dict]
        )

        price_input = price_input[
            price_features
        ]

        predicted_price = price_model.predict(
            price_input
        )[0]

        predicted_price = max(
            0,
            predicted_price
        )


        # Store prediction
        new_row = pd.DataFrame([{

            "date": current_date,
            "modalPrice": predicted_price,
            "arrivals": predicted_arrivals

        }])

        # Add prediction to history
        history = pd.concat(
            [history, new_row],
            ignore_index=True
        )


        all_predictions.append({

            "date": current_date,
            "price": predicted_price,
            "arrivals": predicted_arrivals

        })


        current_date += pd.Timedelta(days=1)


    # ------------------------------------------
    # CREATE DATAFRAME OF ALL PREDICTIONS
    # ------------------------------------------

    predictions_df = pd.DataFrame(all_predictions)

    predictions_df["year"] = predictions_df["date"].dt.year
    predictions_df["month"] = predictions_df["date"].dt.month


    results = []


    # ------------------------------------------
    # CALCULATE EACH REQUESTED MONTH
    # ------------------------------------------

    for month_date in requested_months:

        year = month_date.year
        month = month_date.month

        month_data = predictions_df[

            (predictions_df["year"] == year) &
            (predictions_df["month"] == month)

        ]


        average_price = month_data["price"].mean()

        average_arrivals = month_data["arrivals"].mean()


        demand_score = calculate_demand_score(

            predicted_price=average_price,

            predicted_arrivals=average_arrivals,

            month=month

        )


        results.append({

            "month":
                month_date.strftime("%B %Y"),

            "average_price":
                round(average_price, 2),

            "average_arrivals":
                round(average_arrivals, 2),

            "demand_score":
                round(demand_score, 2)

        })


    return results

# ------------------------------------------
# TEST
# ------------------------------------------

if __name__ == "__main__":

    results = forecast_months_consecutively([

        (2026, 3),
        (2026, 4),
        (2026, 5)

    ])


    print("\nCONSECUTIVE MULTI-MONTH FORECAST")
    print("----------------------------------------")

    for result in results:

        print(f"\nMonth: {result['month']}")

        print(
            f"Expected Average Price: "
            f"₹{result['average_price']}"
        )

        print(
            f"Expected Average Arrivals: "
            f"{result['average_arrivals']}"
        )

        print(
            f"Expected Demand: "
            f"{result['demand_score']}%"
        )