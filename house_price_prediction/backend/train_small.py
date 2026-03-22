from __future__ import annotations
import json, pickle
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DATASET_PATH = BASE_DIR / "notebook" / "house_data.csv"

FEATURES = ["number of bedrooms","number of bathrooms","living area","condition of the house","Number of schools nearby"]
TARGET = "Price"

def main():
    df = pd.read_csv(DATASET_PATH)
    X = df[FEATURES].astype(float)
    y = df[TARGET].astype(float)
    X_train, X_test, y_train, _y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    model = RandomForestRegressor(n_estimators=10, max_depth=8, random_state=42, n_jobs=1)
    model.fit(X_train_scaled, y_train)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_DIR / "house_price_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(MODEL_DIR / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    meta = {"created_at_utc": datetime.now(timezone.utc).isoformat(), "sklearn_version": sklearn.__version__, "features": FEATURES, "target": TARGET, "model_type": type(model).__name__}
    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(meta, f, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()
