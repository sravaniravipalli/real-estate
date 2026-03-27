import { Link } from "react-router-dom";

function parsePredictionAmount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeof value === "object") {
    const numeric = Number(
      value.predicted_price ??
        value.price ??
        value.amount ??
        value.predictedPrice ??
        value.prediction ??
        NaN
    );
    return Number.isFinite(numeric) ? numeric : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getPredictionFormatted(value) {
  if (!value || typeof value !== "object") return null;
  const formatted =
    value.predicted_price_formatted ??
    value.formatted_price ??
    value.formatted ??
    value.display_price ??
    null;
  return typeof formatted === "string" && formatted.trim() ? formatted : null;
}

function inrBreakdown(amount) {
  const value = Math.abs(Math.trunc(Math.round(Number(amount || 0))));
  const crores = Math.trunc(value / 10_000_000);
  const afterCrores = value % 10_000_000;
  const lakhs = Math.trunc(afterCrores / 100_000);
  const afterLakhs = afterCrores % 100_000;
  const thousands = Math.trunc(afterLakhs / 1_000);
  const rupees = afterLakhs % 1_000;
  return { crores, lakhs, thousands, rupees };
}

function getPredictionBreakdown(value, amount) {
  if (value && typeof value === "object") {
    const breakdown = value.price_breakdown ?? value.breakdown ?? null;
    if (
      breakdown &&
      typeof breakdown === "object" &&
      ["crores", "lakhs", "thousands", "rupees"].every((k) => k in breakdown)
    ) {
      return {
        crores: Number(breakdown.crores) || 0,
        lakhs: Number(breakdown.lakhs) || 0,
        thousands: Number(breakdown.thousands) || 0,
        rupees: Number(breakdown.rupees) || 0,
      };
    }
  }
  return inrBreakdown(amount);
}

const DEFAULT_COST_WEIGHTS = [
  { component: "Land Cost", weight: 0.5 },
  { component: "Construction Cost", weight: 0.3 },
  { component: "Registration Charges", weight: 0.06 },
  { component: "Interior", weight: 0.08 },
  { component: "Utilities", weight: 0.02 },
  { component: "Amenities", weight: 0.03 },
];

function allocateCostBreakdown(amount) {
  const total = Math.max(0, Math.trunc(Math.round(Number(amount || 0))));
  let allocated = 0;
  const rows = DEFAULT_COST_WEIGHTS.map(({ component, weight }) => {
    const rowAmount = Math.trunc(Math.round(total * weight));
    allocated += rowAmount;
    return { component, amount: rowAmount };
  });

  rows.push({
    component: "Miscellaneous",
    amount: Math.max(0, total - allocated),
  });

  return { rows, total };
}

function getCostBreakdown(value, amount) {
  if (value && typeof value === "object") {
    const fromBackend = value.cost_breakdown ?? value.costBreakdown ?? null;
    if (Array.isArray(fromBackend) && fromBackend.length) {
      const rows = fromBackend
        .map((row) => ({
          component: String(row.component ?? row.label ?? "").trim(),
          amount: Number(row.amount ?? row.value ?? NaN),
          formatted: typeof row.formatted === "string" ? row.formatted : null,
        }))
        .filter((row) => row.component && Number.isFinite(row.amount));

      if (rows.length) {
        const total =
          Number(value.total_cost ?? value.total ?? value.predicted_price ?? amount ?? 0) || 0;
        return { rows, total };
      }
    }
  }

  return allocateCostBreakdown(amount);
}

export default function PredictionResult({ price, onReset }) {
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
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount ?? 0);

  const breakdown = getPredictionBreakdown(price, amount ?? 0);
  const cost = getCostBreakdown(price, amount ?? 0);
  const formatRowAmount = (row) =>
    row.formatted ??
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(row.amount ?? 0);
  const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 font-semibold mb-2">Estimated Property Value</p>
        <h2 className="text-5xl font-bold text-green-600">{formattedPrice}</h2>
        <p className="text-green-700 text-sm mt-3">✅ Prediction Complete</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 font-semibold mb-3">Price Estimate Details</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Base Estimate</span>
            <span className="font-semibold text-gray-900">{formattedPrice}</span>
          </div>

          {(metaSource || metaApiVersion || metaLocation || metaMultiplier || metaBaseAmount !== null) && (
            <div className="flex flex-col gap-1 text-sm text-gray-700">
              {(metaSource || metaApiVersion) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Source</span>
                  <span className="font-semibold text-gray-900">
                    {(metaSource || "unknown") + (metaApiVersion ? ` (${metaApiVersion})` : "")}
                  </span>
                </div>
              )}
              {metaLocation && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold text-gray-900">{metaLocation}</span>
                </div>
              )}
              {metaMultiplier !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location Multiplier</span>
                  <span className="font-semibold text-gray-900">x{metaMultiplier.toFixed(2)}</span>
                </div>
              )}
              {metaBaseAmount !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Base (Before Location)</span>
                  <span className="font-semibold text-gray-900">{formatInr(metaBaseAmount)}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Crores</span>
                <span className="font-semibold text-gray-900">{breakdown.crores}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lakhs</span>
                <span className="font-semibold text-gray-900">{breakdown.lakhs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thousands</span>
                <span className="font-semibold text-gray-900">{breakdown.thousands}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rupees</span>
                <span className="font-semibold text-gray-900">{breakdown.rupees}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3 font-semibold">Component</th>
                    <th className="py-2 text-right font-semibold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cost.rows.map((row) => (
                    <tr key={row.component}>
                      <td className="py-2 pr-3 text-gray-800">{row.component}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">
                        {formatRowAmount(row)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2 pr-3 text-gray-900">Total</td>
                    <td className="py-2 text-right text-gray-900">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(cost.total ?? amount ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-2 flex justify-between text-sm">
            <span className="text-gray-600 italic">AI Model Confidence: High</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Note:</span> This is an automated estimate based on
          property features and market data. For a professional appraisal, please consult a
          certified real estate appraiser.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onReset}
          className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          🔄 New Prediction
        </button>
        <Link to="/properties">
          <button className="w-full bg-primary hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
            🏠 Browse Properties
          </button>
        </Link>
        <Link to="/dashboard">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
            ➕ List Your Property
          </button>
        </Link>
      </div>
    </div>
  );
}
