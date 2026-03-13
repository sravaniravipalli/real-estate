import { useState } from "react";
import { mockProperties } from "../../data/mockProperties";

const parsePrice = (priceString) => {
  if (!priceString) return 0;
  return parseInt(priceString.replace(/[₹,]/g, "")) || 0;
};

const getUniqueLocations = () => {
  return [...new Set(mockProperties.map(p => p.city || p.location))].filter(Boolean).sort();
};

const getPriceStatistics = (location) => {
  const props = location === "All"
    ? mockProperties
    : mockProperties.filter(p => p.city === location || p.location === location);
  if (props.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
  const prices = props.map(p => parsePrice(p.valuationCost));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    count: props.length
  };
};

export default function AnalyticsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState("price");
  const [locationFilter, setLocationFilter] = useState("");

  const locations = getUniqueLocations();

  // Real price distribution from mockProperties
  const prices = mockProperties.map(p => parsePrice(p.valuationCost));
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  const priceRanges = [
    { label: "Under ₹50L", count: prices.filter(p => p < 5000000).length },
    { label: "₹50L - ₹1Cr", count: prices.filter(p => p >= 5000000 && p < 10000000).length },
    { label: "₹1Cr - ₹2Cr", count: prices.filter(p => p >= 10000000 && p < 20000000).length },
    { label: "Above ₹2Cr", count: prices.filter(p => p >= 20000000).length },
  ];

  const analyticsData = {
    price: {
      title: "Price Distribution",
      avg: `₹${(avgPrice / 10000000).toFixed(2)}Cr`,
      trend: `${mockProperties.length} total properties`,
      data: priceRanges.map(r => `${r.label}: ${r.count} properties`),
      counts: priceRanges.map(r => r.count),
    },
    location: {
      title: "Properties by Location",
      avg: `${locations.length} locations`,
      trend: "Visakhapatnam",
      data: locations.slice(0, 4).map(loc => {
        const count = mockProperties.filter(p => p.city === loc || p.location === loc).length;
        return `${loc}: ${count} properties`;
      }),
      counts: locations.slice(0, 4).map(loc =>
        mockProperties.filter(p => p.city === loc || p.location === loc).length
      ),
    },
  };

  // Top locations with real data
  const topLocations = locations.slice(0, 4).map(loc => {
    const stats = getPriceStatistics(loc);
    const count = mockProperties.filter(p => p.city === loc || p.location === loc).length;
    return {
      name: loc,
      properties: count,
      avgPrice: `₹${(stats.avg / 10000000).toFixed(2)}Cr`,
    };
  });

  const marketInsights = [
    { label: "Total Properties", value: mockProperties.length.toString(), icon: "🏠" },
    { label: "Avg Price", value: `₹${(avgPrice / 10000000).toFixed(1)}Cr`, icon: "💰" },
    { label: "Locations", value: locations.length.toString(), icon: "📍" },
    { label: "Min Price", value: `₹${(Math.min(...prices) / 100000).toFixed(0)}L`, icon: "📉" },
  ];

  const filteredProperties = locationFilter
    ? mockProperties.filter(p =>
        p.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        p.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        p.description?.toLowerCase().includes(locationFilter.toLowerCase())
      )
    : [];

  const maxCount = Math.max(...(analyticsData[selectedMetric]?.counts || [1]));

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h2>
          <p className="text-gray-600">Real insights from {mockProperties.length} Vizag properties</p>
        </div>

        {/* Market Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {marketInsights.map((insight, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">{insight.label}</p>
                <span className="text-2xl">{insight.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{insight.value}</p>
            </div>
          ))}
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Metric</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedMetric === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {value.title}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{analyticsData[selectedMetric].title}</h3>
              <div className="flex gap-4 mt-2">
                <div className="text-3xl font-bold text-blue-600">{analyticsData[selectedMetric].avg}</div>
                <div className="text-lg text-green-600 font-semibold">{analyticsData[selectedMetric].trend}</div>
              </div>
            </div>
            <div className="space-y-3">
              {analyticsData[selectedMetric].data.map((item, index) => {
                const count = analyticsData[selectedMetric].counts[index];
                const width = Math.round((count / maxCount) * 100);
                return (
                  <div key={index}>
                    <p className="text-sm text-gray-700 font-medium mb-1">{item}</p>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ width: `${width || 5}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Locations - Real Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Top Locations in Vizag</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topLocations.map((location, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 hover:shadow-lg transition">
                <h4 className="text-lg font-bold text-gray-900">{location.name}</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold text-green-600">{location.properties}</span> properties
                </p>
                <p className="text-sm text-gray-600">
                  Avg: <span className="font-semibold text-green-600">{location.avgPrice}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Location Filter - searches real data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filter Properties by Location</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by location e.g. Beach Road, MVP Colony..."
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
                Found <span className="font-bold text-blue-600">{filteredProperties.length}</span> properties for "{locationFilter}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProperties.slice(0, 6).map((prop) => (
                  <div key={prop._id} className="border rounded-lg p-3 flex gap-3 items-center">
                    <img
                      src={prop.propertyImage}
                      alt={prop.userName}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => { e.target.src = "https://placehold.co/64x64/e2e8f0/64748b?text=No+Img"; }}
                    />
                    <div>
                      <p className="font-semibold text-sm">{prop.userName}</p>
                      <p className="text-xs text-gray-500">📍 {prop.city || prop.location}</p>
                      <p className="text-primary font-bold text-sm">{prop.valuationCost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}