from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path

import pandas as pd


HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE / "house_data_with_location.csv"
DEFAULT_OUTPUT = HERE / "house_data_with_location_latest.csv"


REQUIRED_COLS = [
    "location",
    "number of bedrooms",
    "number of bathrooms",
    "living area",
    "condition of the house",
    "Number of schools nearby",
    "Price",
]


def _safe_float(value, default: float | None = None) -> float | None:
    try:
        v = float(value)
        if math.isfinite(v):
            return v
    except Exception:
        return default
    return default


def load_cfg(path: Path) -> dict:
    cfg = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(cfg, dict):
        raise ValueError("pricing config must be a JSON object")
    return cfg


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reprice dataset using a Vizag market-rate config (per location)."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--pricing", type=Path, required=True)
    parser.add_argument(
        "--overwrite-price",
        action="store_true",
        help="Overwrite the existing Price column (default: write Price_INR_latest).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for noise (default: 42).",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input dataset not found: {args.input}")
    if not args.pricing.exists():
        raise FileNotFoundError(f"Pricing config not found: {args.pricing}")

    cfg = load_cfg(args.pricing)
    rates = cfg.get("base_rate_per_sqft") or {}
    if not isinstance(rates, dict) or not rates:
        raise ValueError("pricing config missing base_rate_per_sqft (non-empty object)")

    premiums = cfg.get("premiums") or {}
    if not isinstance(premiums, dict):
        premiums = {}

    bedroom_premium = _safe_float(premiums.get("bedroom"), 0.0) or 0.0
    bathroom_premium = _safe_float(premiums.get("bathroom"), 0.0) or 0.0
    school_premium = _safe_float(premiums.get("school_nearby"), 0.0) or 0.0

    cond_mult = cfg.get("condition_multiplier") or {}
    if not isinstance(cond_mult, dict):
        cond_mult = {}

    noise_pct = _safe_float(cfg.get("noise_pct"), 0.0) or 0.0
    min_price = _safe_float(cfg.get("min_price"), 0.0) or 0.0
    max_price = _safe_float(cfg.get("max_price"), float("inf")) or float("inf")
    if max_price <= 0:
        max_price = float("inf")

    df = pd.read_csv(args.input)
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise RuntimeError(f"Dataset missing required columns: {missing}")

    # Normalize dtypes
    df["location"] = df["location"].astype(str).str.strip()
    df["number of bedrooms"] = pd.to_numeric(df["number of bedrooms"], errors="coerce").fillna(0).astype(float)
    df["number of bathrooms"] = pd.to_numeric(df["number of bathrooms"], errors="coerce").fillna(0).astype(float)
    df["living area"] = pd.to_numeric(df["living area"], errors="coerce").fillna(0).astype(float)
    df["condition of the house"] = pd.to_numeric(df["condition of the house"], errors="coerce").fillna(3).astype(int)
    df["Number of schools nearby"] = pd.to_numeric(df["Number of schools nearby"], errors="coerce").fillna(0).astype(int)

    # Precompute a default rate (median of provided rates)
    numeric_rates = [float(v) for v in rates.values() if _safe_float(v) is not None and float(v) > 0]
    if not numeric_rates:
        raise ValueError("base_rate_per_sqft contains no positive numeric values")
    default_rate = float(sorted(numeric_rates)[len(numeric_rates) // 2])

    rng = random.Random(args.seed)

    latest_prices: list[float] = []
    scales: dict[str, float] = {}

    # Compute per row new price
    for _idx, row in df.iterrows():
        loc = str(row["location"]).strip()
        rate = _safe_float(rates.get(loc), None)
        if rate is None or rate <= 0:
            rate = default_rate

        sqft = float(row["living area"] or 0.0)
        bedrooms = float(row["number of bedrooms"] or 0.0)
        bathrooms = float(row["number of bathrooms"] or 0.0)
        schools = int(row["Number of schools nearby"] or 0)
        cond = int(row["condition of the house"] or 3)

        base = sqft * float(rate)
        base += max(0.0, bedrooms - 1.0) * float(bedroom_premium)
        base += max(0.0, bathrooms - 1.0) * float(bathroom_premium)
        base += max(0, schools) * float(school_premium)

        mult = _safe_float(cond_mult.get(str(cond)), 1.0) or 1.0
        value = base * float(mult)

        if noise_pct > 0:
            jitter = 1.0 + rng.uniform(-float(noise_pct), float(noise_pct))
            value *= jitter

        value = _clamp(value, float(min_price), float(max_price))
        latest_prices.append(float(round(value)))

    target_col = "Price" if args.overwrite_price else "Price_INR_latest"
    if args.overwrite_price and "Price_original" not in df.columns:
        df["Price_original"] = df["Price"]
    df[target_col] = latest_prices
    if args.overwrite_price:
        df["Price_INR_latest"] = latest_prices

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"Input:  {args.input}")
    print(f"Output: {args.output}")
    print(f"Wrote column: {target_col}")
    print(f"Default rate used when missing: {default_rate}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
