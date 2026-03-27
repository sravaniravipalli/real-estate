from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from sklearn.cluster import KMeans


BASE_DIR = Path(__file__).resolve().parent
INPUT_CSV = BASE_DIR / "house_data.csv"
OUTPUT_CSV = BASE_DIR / "house_data_with_location.csv"

# Keep in sync with the frontend dropdown (Vizag)
VIZAG_LOCATIONS = [
    "Beach Road",
    "MVP Colony",
    "Madhurawada",
    "Rushikonda Hills",
    "Gajuwaka",
    "Yendada",
    "Hanumanthawaka",
    "Seethammadhara",
    "Kommadi",
    "Dwaraka Nagar",
    "Bheemunipatnam",
    "Steel Plant Township",
    "Arilova",
    "Pendurthi",
    "Lawson's Bay Colony",
    "Maharanipeta",
    "Marripalem",
    "Gopalapatnam",
    "Waltair Uplands",
    "PM Palem",
    "Thatichetlapalem",
    "Simhachalam",
    "Isukathota",
]

LOCATION_MULTIPLIERS = {
    "Beach Road": 1.25,
    "Lawson's Bay Colony": 1.22,
    "Waltair Uplands": 1.20,
    "Rushikonda Hills": 1.18,
    "MVP Colony": 1.15,
    "Dwaraka Nagar": 1.12,
    "Seethammadhara": 1.10,
    "Maharanipeta": 1.08,
    "Madhurawada": 1.06,
    "Yendada": 1.06,
    "PM Palem": 1.05,
    "Kommadi": 1.04,
    "Hanumanthawaka": 1.03,
    "Isukathota": 1.03,
    "Arilova": 1.02,
    "Marripalem": 1.01,
    "Bheemunipatnam": 1.04,
    "Simhachalam": 0.98,
    "Pendurthi": 0.97,
    "Gopalapatnam": 0.97,
    "Gajuwaka": 0.95,
    "Steel Plant Township": 0.96,
    "Thatichetlapalem": 0.99,
}


def main() -> int:
    if not INPUT_CSV.exists():
        print(f"Dataset not found: {INPUT_CSV}", file=sys.stderr)
        return 2

    df = pd.read_csv(INPUT_CSV)
    if "location" in df.columns:
        print("Column 'location' already exists; nothing to do.")
        return 0

    lat_col = "Lattitude"
    lon_col = "Longitude"
    missing = [c for c in (lat_col, lon_col) if c not in df.columns]
    if missing:
        print(f"Missing required columns for location clustering: {missing}", file=sys.stderr)
        return 2

    coords = df[[lat_col, lon_col]].astype(float)
    n_clusters = min(len(VIZAG_LOCATIONS), max(2, int(len(df) ** 0.5)))
    n_clusters = min(n_clusters, len(VIZAG_LOCATIONS))

    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    clusters = kmeans.fit_predict(coords)

    labels = [VIZAG_LOCATIONS[i % len(VIZAG_LOCATIONS)] for i in range(n_clusters)]
    df["location"] = [labels[int(c)] for c in clusters]
    df["location_multiplier"] = df["location"].map(lambda x: float(LOCATION_MULTIPLIERS.get(x, 1.0)))

    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Wrote: {OUTPUT_CSV}")
    print("Location clusters -> labels:")
    for idx, label in enumerate(labels):
        print(f"  {idx}: {label}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
