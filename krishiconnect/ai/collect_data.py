import requests
import pandas as pd
import time
import os


BASE_URL = "https://api.agmarknet.gov.in/v1"

headers = {
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://agmarknet.gov.in",
    "Referer": "https://agmarknet.gov.in/",
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/135.0.0.0 Safari/537.36"
    ),
}


# Our test configuration
STATE_NAME = "Uttar Pradesh"
STATE_ID = 34

CROP_NAME = "Tomato"
CROP_ID = 65


all_records = []


def fetch_month(year, month):

    params = {
        "year": year,
        "month": month,
        "stateId": STATE_ID,
        "commodityId": CROP_ID,
        "includeExcel": "false"
    }

    try:
        response = requests.get(
            f"{BASE_URL}/prices-and-arrivals/date-wise/specific-commodity",
            headers=headers,
            params=params,
            timeout=30
        )

        print(f"Fetching {year}-{month:02d} | Status: {response.status_code}")

        if response.status_code != 200:
            return

        result = response.json()

        markets = result.get("markets", [])

        print(f"  Markets found: {len(markets)}")

        # Loop through markets
        for market in markets:

            market_name = market.get("marketName")

            # Each market contains multiple dates
            for date_record in market.get("dates", []):

                arrival_date = date_record.get("arrivalDate")
                total_arrivals = date_record.get("total_arrivals", 0)

                # Each date contains multiple varieties
                for item in date_record.get("data", []):

                    record = {
                        "date": arrival_date,
                        "state": STATE_NAME,
                        "cropName": CROP_NAME,
                        "market": market_name,
                        "variety": item.get("variety"),
                        "arrivals": item.get("arrivals"),
                        "total_arrivals": total_arrivals,
                        "minimumPrice": item.get("minimumPrice"),
                        "maximumPrice": item.get("maximumPrice"),
                        "modalPrice": item.get("modalPrice")
                    }

                    all_records.append(record)

    except Exception as e:
        print(f"Error fetching {year}-{month:02d}: {e}")


# Collect 3 years of data
for year in range(2023, 2026):

    for month in range(1, 13):

        fetch_month(year, month)

        # Small delay to avoid overwhelming the API
        time.sleep(0.5)


# Convert to DataFrame
df = pd.DataFrame(all_records)


# Create data directory
os.makedirs("ai/data", exist_ok=True)


# Save CSV
file_name = "ai/data/uttar_pradesh_tomato_2023_2025.csv"

df.to_csv(file_name, index=False)


print("\n--------------------------------")
print("DATA COLLECTION COMPLETE")
print("--------------------------------")
print(f"Total records collected: {len(df)}")
print(f"Saved to: {file_name}")

print("\nFirst 5 rows:")
print(df.head())