import pandas as pd
import joblib
import os
from functools import lru_cache

try:
    from .demand_score import calculate_demand_score
except ImportError:
    from demand_score import calculate_demand_score


# ------------------------------------------
# FILE PATHS
# ------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "uttar_pradesh_tomato_cleaned.csv"
)

PRICE_MODEL_FILE = os.path.join(
    BASE_DIR,
    "models",
    "xgboost_price_model.pkl"
)

ARRIVAL_MODEL_FILE = os.path.join(
    BASE_DIR,
    "models",
    "arrival_model.pkl"
)


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


daily_df = df.groupby("date").agg(
    modalPrice=("modalPrice", "mean"),
    arrivals=("arrivals", "sum")
).reset_index()


daily_df = (
    daily_df
    .sort_values("date")
    .reset_index(drop=True)
)


# ------------------------------------------
# DATE FEATURES
# ------------------------------------------

def create_date_features(date):

    return {
        "year": date.year,
        "month": date.month,
        "day": date.day,
        "day_of_week": date.dayofweek
    }


# ------------------------------------------
# BUILD PRICE FEATURES
# ------------------------------------------

def build_price_features(history, future_date):

    features = create_date_features(future_date)

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

    return pd.DataFrame([features])[price_features]


# ------------------------------------------
# BUILD ARRIVAL FEATURES
# ------------------------------------------

def build_arrival_features(history, future_date):

    features = create_date_features(future_date)

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

    return pd.DataFrame([features])[arrival_features]


# ------------------------------------------
# FORECAST CONFIDENCE
# ------------------------------------------

def get_confidence(days_ahead):

    if days_ahead <= 7:
        return "High"

    elif days_ahead <= 30:
        return "Moderate"

    elif days_ahead <= 60:
        return "Low"

    else:
        return "Very Low"


# ------------------------------------------
# GENERATE FUTURE FORECAST
# ------------------------------------------

def generate_forecast_until(target_date):

    target_date = pd.to_datetime(target_date)

    last_date = daily_df["date"].max()


    if target_date <= last_date:

        return daily_df[
            daily_df["date"] <= target_date
        ].copy()


    # Only keep the last 35 days buffer needed for 30-day lags and rolling windows
    history = daily_df.tail(35).copy()

    current_date = (
        last_date
        + pd.Timedelta(days=1)
    )


    future_records = []


    while current_date <= target_date:


        # ----------------------------------
        # PRICE PREDICTION
        # ----------------------------------

        price_input = build_price_features(
            history,
            current_date
        )

        predicted_price = float(
            price_model.predict(price_input)[0]
        )


        # ----------------------------------
        # ARRIVAL PREDICTION
        # ----------------------------------

        arrival_input = build_arrival_features(
            history,
            current_date
        )

        predicted_arrivals = float(
            arrival_model.predict(arrival_input)[0]
        )

        predicted_arrivals = max(
            predicted_arrivals,
            0
        )


        # ----------------------------------
        # DEMAND SCORE
        # ----------------------------------

        demand_score = calculate_demand_score(

            predicted_price=predicted_price,

            predicted_arrivals=predicted_arrivals,

            month=current_date.month
        )


        # ----------------------------------
        # STORE RECORD
        # ----------------------------------

        new_record = {

            "date":
                current_date,

            "modalPrice":
                predicted_price,

            "arrivals":
                predicted_arrivals,

            "demand_score":
                demand_score
        }


        future_records.append(
            new_record
        )


        # ----------------------------------
        # ADD TO HISTORY BUFFER FOR RECURSION (Keep only 35 rows)
        # ----------------------------------

        history = pd.concat(

            [
                history.tail(35),

                pd.DataFrame([{
                    "date":
                        current_date,

                    "modalPrice":
                        predicted_price,

                    "arrivals":
                        predicted_arrivals
                }])
            ],

            ignore_index=True
        )


        current_date += pd.Timedelta(days=1)


    forecast_df = pd.DataFrame(
        future_records
    )


    return forecast_df


# ------------------------------------------
# SINGLE DAY FORECAST
# ------------------------------------------

@lru_cache(maxsize=256)
def forecast_until(target_date):

    target_date = pd.to_datetime(target_date)

    last_date = daily_df["date"].max()


    # Historical date prediction
    if target_date <= last_date:

        history = daily_df[
            daily_df["date"] < target_date
        ].copy()

        if len(history) < 30:
            raise ValueError(
                "Not enough historical data."
            )

        price_input = build_price_features(
            history,
            target_date
        )

        predicted_price = float(
            price_model.predict(price_input)[0]
        )

        arrival_input = build_arrival_features(
            history,
            target_date
        )

        predicted_arrivals = float(
            arrival_model.predict(arrival_input)[0]
        )

        predicted_arrivals = max(
            predicted_arrivals,
            0
        )


    # Future prediction
    else:

        forecast_df = generate_forecast_until(
            target_date
        )

        final_row = forecast_df.iloc[-1]

        predicted_price = float(
            final_row["modalPrice"]
        )

        predicted_arrivals = float(
            final_row["arrivals"]
        )


    demand_score = calculate_demand_score(

        predicted_price=predicted_price,

        predicted_arrivals=predicted_arrivals,

        month=target_date.month
    )


    days_ahead = max(
        (target_date - last_date).days,
        0
    )


    return {

        "date":
            target_date.strftime("%Y-%m-%d"),

        "predicted_price":
            round(predicted_price, 2),

        "predicted_arrivals":
            round(predicted_arrivals, 2),

        "demand_score":
            round(float(demand_score), 2),

        "days_ahead":
            days_ahead,

        "confidence":
            get_confidence(days_ahead)
    }


# ------------------------------------------
# MONTHLY FORECAST
# ------------------------------------------

@lru_cache(maxsize=128)
def forecast_month(year, month):

    start_date = pd.Timestamp(

        year=year,
        month=month,
        day=1
    )


    end_date = (
        start_date
        + pd.offsets.MonthEnd(1)
    )


    # Generate the complete forecast only once
    forecast_df = generate_forecast_until(
        end_date
    )


    # Filter selected month
    month_forecast = forecast_df[

        (
            forecast_df["date"].dt.year
            == year
        )

        &

        (
            forecast_df["date"].dt.month
            == month
        )
    ]


    average_price = (
        month_forecast["modalPrice"]
        .mean()
    )

    average_arrivals = (
        month_forecast["arrivals"]
        .mean()
    )

    average_demand = (
        month_forecast["demand_score"]
        .mean()
    )


    last_date = daily_df["date"].max()


    days_ahead = max(

        (
            start_date
            - last_date
        ).days,

        0
    )


    return {

        "month":
            start_date.strftime("%B"),

        "year":
            year,

        "average_price":
            round(float(average_price), 2),

        "average_arrivals":
            round(float(average_arrivals), 2),

        "average_demand":
            round(float(average_demand), 2),

        "confidence":
            get_confidence(days_ahead)
    }


# ------------------------------------------
# MULTIPLE MONTH FORECAST
# ------------------------------------------

@lru_cache(maxsize=64)
def forecast_multiple_months(

    start_year,
    start_month,
    number_of_months
):


    # --------------------------------------
    # CALCULATE FINAL MONTH
    # --------------------------------------

    total_month = (
        start_month
        - 1
        + number_of_months
        - 1
    )


    end_year = (
        start_year
        + total_month // 12
    )


    end_month = (
        total_month % 12
        + 1
    )


    end_date = (

        pd.Timestamp(

            year=end_year,
            month=end_month,
            day=1
        )

        + pd.offsets.MonthEnd(1)
    )


    # --------------------------------------
    # GENERATE FORECAST ONCE
    # --------------------------------------

    forecast_df = generate_forecast_until(
        end_date
    )


    results = []


    current_year = start_year
    current_month = start_month


    for _ in range(number_of_months):


        month_data = forecast_df[

            (
                forecast_df["date"].dt.year
                == current_year
            )

            &

            (
                forecast_df["date"].dt.month
                == current_month
            )
        ]


        start_date = pd.Timestamp(

            year=current_year,
            month=current_month,
            day=1
        )


        days_ahead = max(

            (
                start_date
                - daily_df["date"].max()
            ).days,

            0
        )


        results.append({

            "month":
                start_date.strftime("%B"),

            "year":
                current_year,

            "average_price":
                round(
                    float(
                        month_data["modalPrice"]
                        .mean()
                    ),
                    2
                ),

            "average_arrivals":
                round(
                    float(
                        month_data["arrivals"]
                        .mean()
                    ),
                    2
                ),

            "average_demand":
                round(
                    float(
                        month_data["demand_score"]
                        .mean()
                    ),
                    2
                ),

            "confidence":
                get_confidence(
                    days_ahead
                )
        })


        current_month += 1


        if current_month > 12:

            current_month = 1

            current_year += 1


    return results


# ------------------------------------------
# TEST
# ------------------------------------------

if __name__ == "__main__":


    # SINGLE FUTURE DATE

    result = forecast_until(
        "2026-03-15"
    )


    print("\nFUTURE FORECAST RESULT")
    print("------------------------")

    print(
        f"Date: {result['date']}"
    )

    print(
        f"Expected Price: "
        f"₹{result['predicted_price']}"
    )

    print(
        f"Expected Arrivals: "
        f"{result['predicted_arrivals']}"
    )

    print(
        f"Expected Demand: "
        f"{result['demand_score']}%"
    )

    print(
        f"Confidence: "
        f"{result['confidence']}"
    )


    # MULTIPLE MONTH FORECAST

    forecasts = forecast_multiple_months(

        2026,
        3,
        3
    )


    print("\nMULTIPLE MONTH FORECAST")
    print("--------------------------------")


    for forecast in forecasts:

        print(
            f"\nMonth: "
            f"{forecast['month']} "
            f"{forecast['year']}"
        )

        print(
            f"Expected Average Price: "
            f"₹{forecast['average_price']}"
        )

        print(
            f"Expected Average Arrivals: "
            f"{forecast['average_arrivals']}"
        )

        print(
            f"Expected Demand: "
            f"{forecast['average_demand']}%"
        )

        print(
            f"Confidence: "
            f"{forecast['confidence']}"
        ) 