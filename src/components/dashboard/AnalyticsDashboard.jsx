import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "api/ai";

const parsePrice = (priceString) => {
  if (!priceString) return 0;
  return parseInt(String(priceString).replace(/[₹â‚¹,\s]/g, ""), 10) || 0;
};

export default function AnalyticsDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetchProducts();
        setProperties(res?.data || []);
      } catch (e) {
        setLoadError(e?.message || "Failed to load properties from backend.");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prices = useMemo(() => properties.map((p) => parsePrice(p.valuationCost)), [properties]);

  const stats = useMemo(() => {
    if (prices.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { min, max, avg };
  }, [prices]);

  const priceRanges = useMemo(() => {
    const ranges = [
      { label: "Under 50L", min: 0, max: 5_000_000 },
      { label: "50L - 1Cr", min: 5_000_000, max: 10_000_000 },
      { label: "1Cr - 2Cr", min: 10_000_000, max: 20_000_000 },
      { label: "Above 2Cr", min: 20_000_000, max: Number.POSITIVE_INFINITY },
    ];

    return ranges.map((r) => ({
      label: r.label,
      count: prices.filter((p) => p >= r.min && p < r.max).length,
    }));
  }, [prices]);

  const uniqueLocations = useMemo(() => {
    return [...new Set(properties.map((p) => p.city || p.location).filter(Boolean))].sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const q = locationFilter.trim().toLowerCase();
    if (!q) return [];
    return properties.filter((p) => {
      const city = (p.city || "").toLowerCase();
      const state = (p.location || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return city.includes(q) || state.includes(q) || desc.includes(q);
    });
  }, [properties, locationFilter]);

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h2>
          <p className="text-gray-600">All numbers are calculated from DB properties.</p>
        </div>

        {loadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">{loadError}</p>
            <p className="text-red-600 text-sm mt-1">Start backend + seed DB, then refresh.</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-medium">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{properties.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-medium">Avg Price</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{(stats.avg / 10_000_000).toFixed(2)}Cr</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-medium">Min Price</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{(stats.min / 100_000).toFixed(0)}L</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-medium">Locations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{uniqueLocations.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Price Distribution</h3>
                <div className="space-y-3">
                  {priceRanges.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{r.label}</span>
                      <span className="text-gray-900 font-bold">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Top Locations</h3>
                <div className="space-y-3">
                  {uniqueLocations.slice(0, 6).map((loc) => {
                    const count = properties.filter((p) => (p.city || p.location) === loc).length;
                    return (
                      <div key={loc} className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{loc}</span>
                        <span className="text-gray-900 font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Search Properties</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by city/state/description..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setLocationFilter("")}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Clear
                </button>
              </div>

              {locationFilter && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-3">
                    Found <span className="font-bold text-blue-600">{filteredProperties.length}</span> properties for "
                    {locationFilter}"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProperties.slice(0, 6).map((prop) => (
                      <div key={prop._id || prop.id} className="border rounded-lg p-3 flex gap-3 items-center">
                        <img
                          src={prop.propertyImage}
                          alt={prop.userName || prop.title || "Property"}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/64x64/e2e8f0/64748b?text=No+Img";
                          }}
                        />
                        <div>
                          <p className="font-semibold text-sm">{prop.userName || prop.title || "Property"}</p>
                          <p className="text-xs text-gray-500">{prop.city || prop.location}</p>
                          <p className="text-primary font-bold text-sm">{prop.valuationCost}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
