import os
import json
import pandas as pd
import datetime

import predict_forecast as pf

def run_export():
    print("Starting forecast export...")
    start_time = datetime.datetime.now()

    # Destination directory
    dest_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    os.makedirs(dest_dir, exist_ok=True)
    dest_file = os.path.join(dest_dir, "forecasts.json")

    daily_forecasts = {}
    monthly_forecasts = {}

    # 1. Generate future daily forecasts from 2026-01-01 to 2030-12-31 in one fast autoregressive pass
    future_end = pd.Timestamp("2030-12-31")
    print(f"Generating future daily forecasts until {future_end.strftime('%Y-%m-%d')}...")
    future_df = pf.generate_forecast_until(future_end)
    last_hist_date = pf.daily_df["date"].max()

    for _, row in future_df.iterrows():
        dt = pd.to_datetime(row["date"])
        date_str = dt.strftime("%Y-%m-%d")
        days_ahead = max((dt - last_hist_date).days, 0)
        daily_forecasts[date_str] = {
            "date": date_str,
            "predicted_price": round(float(row["modalPrice"]), 2),
            "predicted_arrivals": round(float(row["arrivals"]), 2),
            "demand_score": round(float(row["demand_score"]), 2),
            "days_ahead": days_ahead,
            "confidence": pf.get_confidence(days_ahead)
        }

    # 2. Historical daily forecasts for 2025
    print("Generating 2025 historical predictions...")
    dates_2025 = pd.date_range(start="2025-01-01", end="2025-12-31")
    for dt in dates_2025:
        date_str = dt.strftime("%Y-%m-%d")
        try:
            fc = pf.forecast_until(date_str)
            daily_forecasts[date_str] = fc
        except Exception as e:
            # If not enough history in early 2025, skip or use historical actuals
            pass

    # 3. Generate Monthly Forecasts for 2025 to 2030
    print("Generating monthly summaries...")
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    for yr in range(2025, 2031):
        for mo in range(1, 13):
            key = f"{yr}-{mo}"
            # Calculate from daily_forecasts
            days_in_month = [
                v for k, v in daily_forecasts.items()
                if k.startswith(f"{yr}-{mo:02d}-")
            ]
            if days_in_month:
                avg_price = sum(d["predicted_price"] for d in days_in_month) / len(days_in_month)
                avg_arrivals = sum(d["predicted_arrivals"] for d in days_in_month) / len(days_in_month)
                avg_demand = sum(d["demand_score"] for d in days_in_month) / len(days_in_month)
                
                start_date = pd.Timestamp(year=yr, month=mo, day=1)
                days_ahead = max((start_date - last_hist_date).days, 0)
                
                monthly_forecasts[key] = {
                    "month": month_names[mo - 1],
                    "year": yr,
                    "month_number": mo,
                    "average_price": round(avg_price, 2),
                    "average_arrivals": round(avg_arrivals, 2),
                    "average_demand": round(avg_demand, 2),
                    "confidence": pf.get_confidence(days_ahead)
                }

    output_data = {
        "metadata": {
            "generated_at": datetime.datetime.now().isoformat(),
            "crop": "Tomato",
            "state": "Uttar Pradesh",
            "start_date": min(daily_forecasts.keys()),
            "end_date": max(daily_forecasts.keys()),
            "total_days": len(daily_forecasts),
            "total_months": len(monthly_forecasts)
        },
        "daily": daily_forecasts,
        "monthly": monthly_forecasts
    }

    with open(dest_file, "w") as f:
        json.dump(output_data, f, indent=2)

    elapsed = (datetime.datetime.now() - start_time).total_seconds()
    print(f"Success! Saved {len(daily_forecasts)} days and {len(monthly_forecasts)} months to {dest_file} in {elapsed:.1f}s.")

if __name__ == "__main__":
    run_export()
