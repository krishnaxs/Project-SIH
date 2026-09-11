import pandas as pd

# Load dataset
file_path = "ai/data/uttar_pradesh_tomato_2023_2025.csv"

df = pd.read_csv(file_path)

print("\nDATASET INFORMATION")
print("-------------------")

print(f"Total records: {len(df)}")
print(f"Total columns: {len(df.columns)}")

print("\nColumns:")
print(df.columns.tolist())


# Missing values
print("\nMISSING VALUES")
print("-------------------")
print(df.isnull().sum())


# Duplicate records
duplicates = df.duplicated().sum()

print("\nDUPLICATE RECORDS")
print("-------------------")
print(f"Duplicates found: {duplicates}")


# Convert date
df["date"] = pd.to_datetime(
    df["date"],
    format="%d/%m/%Y",
    errors="coerce"
)


# Invalid dates
invalid_dates = df["date"].isnull().sum()

print("\nINVALID DATES")
print("-------------------")
print(f"Invalid dates: {invalid_dates}")


# Dataset date range
print("\nDATE RANGE")
print("-------------------")
print(f"From: {df['date'].min()}")
print(f"To:   {df['date'].max()}")


# Unique markets
print("\nUNIQUE MARKETS")
print("-------------------")
print(df["market"].nunique())


# Unique varieties
print("\nUNIQUE VARIETIES")
print("-------------------")
print(df["variety"].nunique())


# Price statistics
print("\nPRICE STATISTICS")
print("-------------------")

print(df[
    [
        "minimumPrice",
        "maximumPrice",
        "modalPrice",
        "arrivals",
        "total_arrivals"
    ]
].describe())


# Save cleaned version
df = df.drop_duplicates()

clean_file = "ai/data/uttar_pradesh_tomato_cleaned.csv"

df.to_csv(clean_file, index=False)

print("\n--------------------------------")
print("PREPROCESSING COMPLETE")
print("--------------------------------")

print(f"Cleaned records: {len(df)}")
print(f"Saved to: {clean_file}")