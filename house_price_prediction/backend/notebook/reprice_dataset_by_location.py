from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import pandas as pd


HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE / "house_data_with_location.csv"
DEFAULT_OUTPUT = HERE / "house_data_with_location_latest.csv"


def _median(series: pd.Series) -> float:
    values = pd.to_numeric(series, errors="coerce").dropna().astype(float)
    if values.empty:
        return float("nan")
    return float(values.median())


def _safe_float(value) -> float | None:
    try:
        v = float(value)
        if math.isfinite(v):
            return v
    except Exception:
        return None
    return None


def load_targets(path: Path) -> tuple[str, float, dict[str, float]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    mode = str(payload.get("mode") or "median_price").strip()
    currency_scale = _safe_float(payload.get("currency_scale")) or 1.0
    targets_raw = payload.get("targets") or {}
    if not isinstance(targets_raw, dict) or not targets_raw:
        raise ValueError("targets file must contain a non-empty object at key: targets")

    targets: dict[str, float] = {}
    for k, v in targets_raw.items():
        key = str(k).strip()
        fv = _safe_float(v)
        if key and fv is not None:
            targets[key] = fv

    if not targets:
        raise ValueError("targets did not contain any numeric values")

    if mode not in {"median_price", "price_per_sqft"}:
        raise ValueError("mode must be one of: median_price, price_per_sqft")

    return mode, float(currency_scale), targets


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scale Price per location to match latest targets."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--targets", type=Path, required=True)
    parser.add_argument(
        "--min-scale",
        type=float,
        default=0.1,
        help="Clamp scaling factor lower bound (default: 0.1).",
    )
    parser.add_argument(
        "--max-scale",
        type=float,
        default=10.0,
        help="Clamp scaling factor upper bound (default: 10.0).",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input dataset not found: {args.input}")
    if not args.targets.exists():
        raise FileNotFoundError(f"Targets file not found: {args.targets}")

    mode, currency_scale, targets = load_targets(args.targets)

    df = pd.read_csv(args.input)
    required = {"location", "Price", "living area"}
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise RuntimeError(f"Dataset missing required columns: {missing}")

    price_col = "Price"
    loc_col = "location"
    area_col = "living area"

    df[price_col] = pd.to_numeric(df[price_col], errors="coerce").astype(float)
    df[area_col] = pd.to_numeric(df[area_col], errors="coerce").astype(float)
    df[loc_col] = df[loc_col].astype(str)

    scales: dict[str, float] = {}

    for location, target_value in targets.items():
        sub = df[df[loc_col] == location]
        if sub.empty:
            continue

        if mode == "median_price":
            current = _median(sub[price_col]) * currency_scale
        else:
            per_sqft = (sub[price_col] * currency_scale) / sub[area_col]
            current = _median(per_sqft)

        if not math.isfinite(current) or current <= 0:
            continue

        scale = float(target_value) / float(current)
        scale = max(float(args.min_scale), min(float(args.max_scale), scale))
        scales[location] = scale

    if not scales:
        raise RuntimeError(
            "No location scales computed. Check that targets match dataset locations."
        )

    # Apply scaling (in dataset unit space)
    for location, scale in scales.items():
        mask = df[loc_col] == location
        df.loc[mask, price_col] = df.loc[mask, price_col] * scale

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"Mode: {mode}")
    print(f"Input: {args.input}")
    print(f"Output: {args.output}")
    print("Applied scales:")
    for k in sorted(scales):
        print(f"  {k}: x{scales[k]:.4f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
