import requests
import json

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

params = {
    "year": 2025,
    "month": 1,
    "stateId": 34,       # Uttar Pradesh
    "commodityId": 65,   # Tomato
    "includeExcel": "false"
}

try:
    response = requests.get(
        f"{BASE_URL}/prices-and-arrivals/date-wise/specific-commodity",
        headers=headers,
        params=params,
        timeout=30
    )

    print("Status Code:", response.status_code)

    if response.status_code == 200:
        data = response.json()

        print("\nSuccess:")
        print(data.get("success"))

        print("\nMessage:")
        print(data.get("message"))

        print("\nTitle:")
        print(data.get("title"))

        print("\nColumns:")
        print(json.dumps(data.get("columns"), indent=2))

        print("\nMarkets type:")
        print(type(data.get("markets")))

        print("\nNumber of market records:")
        print(len(data.get("markets", [])))

        print("\nFirst 3 market records:")
        print(json.dumps(data.get("markets", [])[:3], indent=2))

    else:
        print("\nRequest Failed:")
        print(response.text)

except Exception as e:
    print("Error:", e)