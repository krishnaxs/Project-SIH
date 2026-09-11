from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .predict_forecast import (
        forecast_until,
        forecast_month,
        forecast_multiple_months
    )
except ImportError:
    from predict_forecast import (
        forecast_until,
        forecast_month,
        forecast_multiple_months
    )


app = FastAPI(
    title="KrishiConnect AI API"
)


# ------------------------------------------
# CORS
# ------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------
# HEALTH CHECK
# ------------------------------------------

@app.get("/")
def home():

    return {
        "status": "AI API is running"
    }


# ------------------------------------------
# DAILY FORECAST
# ------------------------------------------

@app.get("/forecast")
def get_forecast(date: str):

    result = forecast_until(date)

    return result


# ------------------------------------------
# MONTHLY FORECAST
# ------------------------------------------

@app.get("/forecast/month")
def get_month_forecast(
    year: int,
    month: int
):

    result = forecast_month(
        year,
        month
    )

    return result


# ------------------------------------------
# MULTIPLE MONTH FORECAST
# ------------------------------------------

@app.get("/forecast/months")
def get_multiple_month_forecast(
    year: int,
    month: int,
    months: int
):

    result = forecast_multiple_months(
        year,
        month,
        months
    )

    return result