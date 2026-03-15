import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "api/ai";

const parsePrice = (priceString) => {
  if (!priceString) return 0;
  return parseInt(String(priceString).replace(/[₹â‚¹,\s]/g, ""), 10) || 0;
};

export default function PropertyComparison() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedIds, setSelectedIds] = useState(["", ""]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetchProducts();
        const items = res?.data || [];
        setProperties(items);
        setSelectedIds([items?.[0]?._id || items?.[0]?.id || "", items?.[1]?._id || items?.[1]?.id || ""]);
      } catch (e) {
        setLoadError(e?.message || "Failed to load properties from backend.");
        setProperties([]);
        setSelectedIds(["", ""]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const byId = useMemo(() => {
    const map = new Map();
    for (const p of properties) {
      const key = String(p._id || p.id || "");
      if (key) map.set(key, p);
    }
    return map;
  }, [properties]);

  const prop1 = byId.get(String(selectedIds[0])) || null;
  const prop2 = byId.get(String(selectedIds[1])) || null;

  const comparisonFeatures = [
    { label: "Price", key: "valuationCost" },
    { label: "City", key: "city" },
    { label: "State", key: "location" },
    { label: "Bedrooms", key: "bedrooms" },
    { label: "Bathrooms", key: "bathrooms" },
  ];

  const isBetter = (key, val1, val2) => {
    if (key === "valuationCost") return parsePrice(val1) < parsePrice(val2);
    return false;
  };

  const onSelect = (value, position) => {
    const next = [...selectedIds];
    next[position] = value;
    setSelectedIds(next);
  };

  if (loading) {
    return (
      <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold">{loadError}</p>
          <p className="text-red-600 text-sm mt-1">Start backend + seed DB, then refresh.</p>
        </div>
      </section>
    );
  }

  if (properties.length < 2) {
    return (
      <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 font-semibold">Need at least 2 properties in the database to compare.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Property Comparison</h2>
          <p className="text-gray-600">Compare any 2 properties from the database.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[0, 1].map((position) => (
            <div key={position} className="bg-white rounded-lg p-4 shadow">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Property {position + 1}
              </label>
              <select
                value={selectedIds[position]}
                onChange={(e) => onSelect(e.target.value, position)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {properties.map((prop) => {
                  const id = String(prop._id || prop.id);
                  return (
                    <option key={id} value={id}>
                      {prop.userName || prop.title || id} — {prop.city || prop.location} — {prop.valuationCost}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[prop1, prop2].map((prop, idx) => (
            <div key={idx} className="bg-white rounded-lg overflow-hidden shadow">
              <img
                src={prop?.propertyImage}
                alt={prop?.userName || prop?.title || "Property"}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
                }}
              />
              <div className="p-3">
                <p className="font-bold text-gray-900">{prop?.userName || prop?.title || "Property"}</p>
                <p className="text-primary font-bold text-lg">{prop?.valuationCost}</p>
                <p className="text-sm text-gray-500">{prop?.city || prop?.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="px-6 py-4 text-left font-bold">Feature</th>
                  <th className="px-6 py-4 text-left font-bold">{prop1?.userName || prop1?.title}</th>
                  <th className="px-6 py-4 text-left font-bold">{prop2?.userName || prop2?.title}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature.key} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{feature.label}</td>
                    <td
                      className={
                        "px-6 py-4 " +
                        (isBetter(feature.key, prop1?.[feature.key], prop2?.[feature.key])
                          ? "text-green-600 font-bold"
                          : "text-gray-700")
                      }
                    >
                      {String(prop1?.[feature.key] ?? "")}
                    </td>
                    <td
                      className={
                        "px-6 py-4 " +
                        (isBetter(feature.key, prop2?.[feature.key], prop1?.[feature.key])
                          ? "text-green-600 font-bold"
                          : "text-gray-700")
                      }
                    >
                      {String(prop2?.[feature.key] ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
