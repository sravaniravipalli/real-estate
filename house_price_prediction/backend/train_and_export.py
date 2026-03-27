from __future__ import annotations

import json
import os
import pickle
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DATASET_DIR = BASE_DIR / "notebook"
DATASET_PATH = DATASET_DIR / "house_data.csv"
DATASET_WITH_LOCATION_PATH = DATASET_DIR / "house_data_with_location.csv"
DATASET_WITH_LOCATION_LATEST_PATH = DATASET_DIR / "house_data_with_location_latest.csv"

BASE_FEATURES = [
    "number of bedrooms",
    "number of bathrooms",
    "living area",
    "condition of the house",
    "Number of schools nearby",
]
LOCATION_FEATURE = "location_multiplier"
TARGET = "Price"


def main():
    if (
        not DATASET_PATH.exists()
        and not DATASET_WITH_LOCATION_PATH.exists()
        and not DATASET_WITH_LOCATION_LATEST_PATH.exists()
    ):
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    if DATASET_WITH_LOCATION_LATEST_PATH.exists():
        dataset_path = DATASET_WITH_LOCATION_LATEST_PATH
    elif DATASET_WITH_LOCATION_PATH.exists():
        dataset_path = DATASET_WITH_LOCATION_PATH
    else:
        dataset_path = DATASET_PATH
    df = pd.read_csv(dataset_path)

    features = list(BASE_FEATURES)
    if LOCATION_FEATURE in df.columns:
        features.append(LOCATION_FEATURE)

    missing_cols = [c for c in features + [TARGET] if c not in df.columns]
    if missing_cols:
        raise RuntimeError(f"Dataset missing columns: {missing_cols}")

    # Keep `location` as string for one-hot; numeric cols as float.
    X = df[features].copy()
    X = X.astype(float)

    y = df[TARGET].astype(float)

    X_train, X_test, y_train, _y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = RandomForestRegressor(
        n_estimators=250,
        random_state=42,
        # Some locked-down Windows environments disallow the IPC primitives joblib uses
        # even for thread backends; keep training single-threaded for portability.
        n_jobs=1,
    )
    model.fit(X_train_scaled, y_train)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "house_price_model.pkl"
    scaler_path = MODEL_DIR / "scaler.pkl"

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    meta = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "sklearn_version": sklearn.__version__,
        "features": features,
        "target": TARGET,
        "model_type": type(model).__name__,
        "dataset_path": str(dataset_path),
    }
    with open(MODEL_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Wrote: {model_path}")
    print(f"Wrote: {scaler_path}")
    print(f"Wrote: {MODEL_DIR / 'model_metadata.json'}")
    print(f"scikit-learn: {sklearn.__version__}")


if __name__ == "__main__":
    main()
