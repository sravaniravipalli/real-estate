import { useState } from "react";
import { mockProperties } from "../../data/mockProperties";

const parsePrice = (priceString) => {
  if (!priceString) return 0;
  return parseInt(priceString.replace(/[₹,]/g, "")) || 0;
};


export default function PropertyComparison() {
  const [selectedProperties, setSelectedProperties] = useState([0, 1]);

  const toggleProperty = (id, position) => {
    const newSelected = [...selectedProperties];
    newSelected[position] = id;
    setSelectedProperties(newSelected);
  };

  const prop1 = mockProperties[selectedProperties[0]];
  const prop2 = mockProperties[selectedProperties[1]];

  const comparisonFeatures = [
    { label: "Price", key: "valuationCost" },
    { label: "Location", key: "city" },
    { label: "State", key: "location" },
    { label: "Description", key: "description" },
  ];

  const isBetter = (key, val1, val2) => {
    if (key === "valuationCost") {
      return parsePrice(val1) < parsePrice(val2);
    }
    return false;
  };

  return (
    <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🔄 Property Comparison</h2>
          <p className="text-gray-600">Compare any 2 properties from our listings</p>
        </div>

        {/* Property Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[0, 1].map((position) => (
            <div key={position} className="bg-white rounded-lg p-4 shadow">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Property {position + 1}
              </label>
              <select
                value={selectedProperties[position]}
                onChange={(e) => toggleProperty(parseInt(e.target.value), position)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {mockProperties.map((prop, idx) => (
                  <option key={prop._id} value={idx}>
                    {prop.userName} — {prop.city || prop.location} — {prop.valuationCost}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Property Image Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[prop1, prop2].map((prop, idx) => (
            <div key={idx} className="bg-white rounded-lg overflow-hidden shadow">
              <img
                src={prop?.propertyImage}
                alt={prop?.userName}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
                }}
              />
              <div className="p-3">
                <p className="font-bold text-gray-900">{prop?.userName}</p>
                <p className="text-primary font-bold text-lg">{prop?.valuationCost}</p>
                <p className="text-sm text-gray-500">📍 {prop?.city || prop?.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="px-6 py-4 text-left font-bold">Feature</th>
                  <th className="px-6 py-4 text-left font-bold">
                    <div className="flex flex-col">
                      <span className="text-sm">{prop1?.userName}</span>
                      <span className="text-lg font-bold text-yellow-300">{prop1?.valuationCost}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-bold">
                    <div className="flex flex-col">
                      <span className="text-sm">{prop2?.userName}</span>
                      <span className="text-lg font-bold text-yellow-300">{prop2?.valuationCost}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{feature.label}</td>
                    <td className={`px-6 py-4 ${isBetter(feature.key, prop1?.[feature.key], prop2?.[feature.key]) ? "text-green-600 font-bold" : "text-gray-700"}`}>
                      {feature.key === "description"
                        ? prop1?.[feature.key]?.slice(0, 80) + "..."
                        : prop1?.[feature.key]}
                    </td>
                    <td className={`px-6 py-4 ${isBetter(feature.key, prop2?.[feature.key], prop1?.[feature.key]) ? "text-green-600 font-bold" : "text-gray-700"}`}>
                      {feature.key === "description"
                        ? prop2?.[feature.key]?.slice(0, 80) + "..."
                        : prop2?.[feature.key]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[prop1, prop2].map((prop, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{prop?.userName}</h3>
              <p className="text-sm text-gray-500 mb-3">📍 {prop?.city || prop?.location}</p>
              <p className="text-2xl font-bold text-purple-600 mb-3">{prop?.valuationCost}</p>
              <p className="text-sm text-gray-600 line-clamp-3">{prop?.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}