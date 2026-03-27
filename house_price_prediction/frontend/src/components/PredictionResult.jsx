import React from "react";
import "./PredictionResult.css";

const COST_WEIGHTS = [
  { component: "Land Cost", weight: 0.5, icon: "🗺️" },
  { component: "Construction Cost", weight: 0.3, icon: "🧱" },
  { component: "Registration Charges", weight: 0.06, icon: "🧾" },
  { component: "Interior", weight: 0.08, icon: "🪟" },
  { component: "Utilities", weight: 0.02, icon: "💡" },
  { component: "Amenities", weight: 0.03, icon: "🏫" },
];

function parsePredictionAmount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeof value === "object") {
    const numeric = Number(value.predicted_price ?? value.price ?? value.amount ?? NaN);
    return Number.isFinite(numeric) ? numeric : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getPredictionFormatted(value) {
  if (!value || typeof value !== "object") return null;
  const formatted = value.predicted_price_formatted ?? value.formatted ?? null;
  return typeof formatted === "string" && formatted.trim() ? formatted : null;
}

function allocateCostBreakdown(total) {
  const amount = Math.max(0, Math.trunc(Math.round(Number(total || 0))));
  let allocated = 0;
  const rows = COST_WEIGHTS.map(({ component, weight, icon }) => {
    const rowAmount = Math.trunc(Math.round(amount * weight));
    allocated += rowAmount;
    return { component, amount: rowAmount, icon };
  });
  rows.push({
    component: "Miscellaneous",
    amount: Math.max(0, amount - allocated),
    icon: "🧩",
  });
  return rows;
}

const PredictionResult = ({ price, isLoading }) => {
  const amount = parsePredictionAmount(price);
  const formattedFromBackend = getPredictionFormatted(price);
  const metaSource =
    price && typeof price === "object" ? String(price.source || "").trim() : "";
  const metaApiVersion =
    price && typeof price === "object" ? String(price.api_version || "").trim() : "";
  const metaLocation =
    price && typeof price === "object" ? String(price.location || "").trim() : "";
  const metaMultiplier =
    price && typeof price === "object" && Number.isFinite(Number(price.location_multiplier))
      ? Number(price.location_multiplier)
      : null;
  const metaBaseAmount =
    price && typeof price === "object" && Number.isFinite(Number(price.base_predicted_price))
      ? Number(price.base_predicted_price)
      : null;

  const formattedPrice =
    formattedFromBackend ??
    (amount === null ? "" : `\u20B9${Math.round(amount).toLocaleString("en-IN")}`);

  const breakdown =
    price && typeof price === "object" && Array.isArray(price.cost_breakdown)
      ? price.cost_breakdown
          .map((row) => ({
            component: String(row.component ?? "").trim(),
            amount: Number(row.amount ?? NaN),
            formatted: typeof row.formatted === "string" ? row.formatted : null,
          }))
          .filter((row) => row.component && Number.isFinite(row.amount))
      : amount === null
        ? []
        : allocateCostBreakdown(amount);

  return (
    <div className="prediction-result">
      <h2>Predicted Price</h2>

      {isLoading ? (
        <div className="loading-wrapper">
          <div className="loading-spinner" />
          <p className="loading-text">Calculating breakdown…</p>
        </div>
      ) : amount !== null ? (
        <>
          <p className="price">{formattedPrice}</p>
          <p className="price-subtitle">Estimated market value</p>
          {(metaLocation || metaMultiplier || metaBaseAmount !== null) && (
            <div className="breakdown-section" style={{ marginTop: 12 }}>
              <h3 className="breakdown-title">Location Adjustment</h3>
              <div className="breakdown-list">
                {(metaSource || metaApiVersion) && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-label">Source</span>
                      <span className="breakdown-amount">
                        {(metaSource || "unknown") +
                          (metaApiVersion ? ` (${metaApiVersion})` : "")}
                      </span>
                    </div>
                  </div>
                )}
                {metaLocation && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-label">Location</span>
                      <span className="breakdown-amount">{metaLocation}</span>
                    </div>
                  </div>
                )}
                {metaMultiplier !== null && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-label">Multiplier</span>
                      <span className="breakdown-amount">x{metaMultiplier.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {metaBaseAmount !== null && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-label">Base (Before Location)</span>
                      <span className="breakdown-amount">
                        \u20B9{Math.round(metaBaseAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="breakdown-section">
            <h3 className="breakdown-title">Price Segregation</h3>
            <div className="breakdown-list">
              {breakdown.map((row) => {
                const label = row.component ?? row.label ?? "";
                const partAmount = row.amount ?? 0;
                const display =
                  row.formatted ??
                  `\u20B9${Number(partAmount).toLocaleString("en-IN")}`;
                return (
                  <div className="breakdown-item" key={label}>
                  <div className="breakdown-header">
                    <span className="breakdown-label">{label}</span>
                    <span className="breakdown-amount">{display}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="no-prediction">Submit the form to see the predicted price</p>
      )}
    </div>
  );
};

export default PredictionResult;
