import requests

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

try:
    response = requests.get(
        f"{BASE_URL}/daily-price-arrival/filters",
        headers=headers,
        timeout=30,
    )

    print("Status Code:", response.status_code)

    if response.status_code == 200:
        data = response.json()

        print("\nAvailable API sections:")
        print(data.keys())

        # Access nested data
        api_data = data.get("data", {})

        # Find State ID
        target_state = "Uttar Pradesh"

        state_id = None

        for state in api_data["state_data"]:
            if state["state_name"].lower() == target_state.lower():
                state_id = state["state_id"]
                break


        # Find Commodity ID
        target_crop = "Tomato"

        crop_id = None

        for crop in api_data["cmdt_data"]:
            if crop["cmdt_name"].lower() == target_crop.lower():
                crop_id = crop["cmdt_id"]
                break


        print("\n--- SEARCH RESULTS ---")
        print(f"State: {target_state}")
        print(f"State ID: {state_id}")

        print(f"\nCrop: {target_crop}")
        print(f"Crop ID: {crop_id}")

        print("\nAvailable sections inside data:")
        print(api_data.keys())

        print("\n--- DATA PREVIEW ---")

        for key, value in api_data.items():
            print(f"\n{key}:")

            if isinstance(value, list):
                print(value[:3])
            else:
                print(value)

    else:
        print("\nFailed to access API")
        print(response.text)

except Exception as e:
    print("Error:", e)