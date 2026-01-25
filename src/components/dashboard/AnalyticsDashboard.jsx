import { useState } from "react";

export default function AnalyticsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState("price");
  const [locationFilter, setLocationFilter] = useState("");

  // Mock data for analytics
  const analyticsData = {
    price: {
      title: "Price Distribution",
      avg: "₹3,73,50,000",
      trend: "+12%",
      data: ["₹1.66Cr-₹2.49Cr: 25 properties", "₹2.49Cr-₹3.32Cr: 45 properties", "₹3.32Cr-₹4.98Cr: 38 properties", "₹4.98Cr+: 22 properties"]
    },
    bedrooms: {
      title: "Bedroom Distribution",
      avg: "3.2 avg",
      trend: "2-4 BHK popular",
      data: ["1 BHK: 15 properties", "2 BHK: 42 properties", "3 BHK: 58 properties", "4+ BHK: 35 properties"]
    },
    area: {
      title: "Property Size Distribution",
      avg: "2,450 sqft",
      trend: "1000-5000 range",
      data: ["<1000 sqft: 22 properties", "1000-2000 sqft: 45 properties", "2000-3000 sqft: 52 properties", "3000+ sqft: 31 properties"]
    }
  };

  const topLocations = [
    { name: "Downtown", properties: 145, avgPrice: "₹4,31,60,000" },
    { name: "Waterfront", properties: 98, avgPrice: "₹5,64,40,000" },
    { name: "Suburbs", properties: 187, avgPrice: "₹3,15,40,000" },
    { name: "Urban Center", properties: 156, avgPrice: "₹3,73,50,000" }
  ];

  const marketInsights = [
    { label: "Total Properties", value: "2,450", icon: "🏠" },
    { label: "Avg Price", value: "₹3.74Cr", icon: "💰" },
    { label: "New Listings", value: "124", icon: "📈" },
    { label: "Locations", value: "45", icon: "📍" }
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h2>
          <p className="text-gray-600">Explore market insights and property statistics</p>
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
          {/* Metric Selection */}
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

          {/* Chart/Data Display */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{analyticsData[selectedMetric].title}</h3>
              <div className="flex gap-4 mt-2">
                <div className="text-3xl font-bold text-blue-600">{analyticsData[selectedMetric].avg}</div>
                <div className="text-lg text-green-600 font-semibold">{analyticsData[selectedMetric].trend}</div>
              </div>
            </div>

            {/* Vertical Bar Chart Simulation */}
            <div className="space-y-3">
              {analyticsData[selectedMetric].data.map((item, index) => {
                const widths = [45, 65, 55, 40];
                return (
                  <div key={index}>
                    <p className="text-sm text-gray-700 font-medium mb-1">{item}</p>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-6 rounded-full flex items-center justify-center"
                        style={{ width: `${widths[index]}%` }}
                      >
                        <span className="text-xs font-bold text-white">{widths[index]}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-green-600">📍</span>
            Top Locations
          </h3>

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

        {/* Location Filter */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filter by Location</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter location (e.g., Downtown, Waterfront)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition">
              Search
            </button>
          </div>
          {locationFilter && (
            <p className="mt-4 text-gray-600">
              Showing results for: <span className="font-bold text-blue-600">{locationFilter}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}