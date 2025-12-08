import { useState } from "react";

export default function PropertyComparison() {
  const [selectedProperties, setSelectedProperties] = useState([0, 1]);

  const properties = [
    {
      id: 0,
      title: "Modern Downtown Apartment",
      price: "$650,000",
      bedrooms: 3,
      bathrooms: 2,
      area: "2,400 sqft",
      location: "Downtown",
      type: "Apartment",
      yearBuilt: 2020,
      garage: 2,
      pool: false,
      gym: true,
      parking: true,
      security: true,
      furnishing: "Fully Furnished",
      condition: "Excellent",
      rating: 4.8
    },
    {
      id: 1,
      title: "Waterfront Villa",
      price: "$1,200,000",
      bedrooms: 5,
      bathrooms: 4,
      area: "5,600 sqft",
      location: "Waterfront",
      type: "House",
      yearBuilt: 2018,
      garage: 3,
      pool: true,
      gym: false,
      parking: true,
      security: true,
      furnishing: "Semi-Furnished",
      condition: "Excellent",
      rating: 4.9
    },
    {
      id: 2,
      title: "Cozy Suburban Home",
      price: "$380,000",
      bedrooms: 2,
      bathrooms: 1,
      area: "1,200 sqft",
      location: "Suburbs",
      type: "House",
      yearBuilt: 2015,
      garage: 1,
      pool: false,
      gym: false,
      parking: true,
      security: false,
      furnishing: "Unfurnished",
      condition: "Good",
      rating: 4.3
    }
  ];

  const toggleProperty = (id, position) => {
    const newSelected = [...selectedProperties];
    newSelected[position] = id;
    setSelectedProperties(newSelected);
  };

  const getProperty = (id) => properties.find(p => p.id === id);
  const prop1 = getProperty(selectedProperties[0]);
  const prop2 = getProperty(selectedProperties[1]);

  const comparisonFeatures = [
    { label: "Price", key: "price" },
    { label: "Bedrooms", key: "bedrooms" },
    { label: "Bathrooms", key: "bathrooms" },
    { label: "Area (sqft)", key: "area" },
    { label: "Location", key: "location" },
    { label: "Type", key: "type" },
    { label: "Year Built", key: "yearBuilt" },
    { label: "Garage Spaces", key: "garage" },
    { label: "Pool", key: "pool", isBool: true },
    { label: "Gym", key: "gym", isBool: true },
    { label: "Parking", key: "parking", isBool: true },
    { label: "Security", key: "security", isBool: true },
    { label: "Furnishing", key: "furnishing" },
    { label: "Condition", key: "condition" },
    { label: "Rating", key: "rating" }
  ];

  return (
    <section className="p-8 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🔄 Property Comparison</h2>
          <p className="text-gray-600">Compare up to 2 properties side by side</p>
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
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.title} - {prop.price}
                  </option>
                ))}
              </select>
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
                      <span className="text-sm">{prop1?.title}</span>
                      <span className="text-lg font-bold text-yellow-300">{prop1?.price}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-bold">
                    <div className="flex flex-col">
                      <span className="text-sm">{prop2?.title}</span>
                      <span className="text-lg font-bold text-yellow-300">{prop2?.price}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{feature.label}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {feature.isBool ? (
                        prop1?.[feature.key] ? (
                          <span className="text-2xl">✅</span>
                        ) : (
                          <span className="text-2xl">❌</span>
                        )
                      ) : (
                        prop1?.[feature.key]
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {feature.isBool ? (
                        prop2?.[feature.key] ? (
                          <span className="text-2xl">✅</span>
                        ) : (
                          <span className="text-2xl">❌</span>
                        )
                      ) : (
                        prop2?.[feature.key]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[prop1, prop2].map((prop, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{prop?.title}</h3>
                  <p className="text-sm text-gray-500">📍 {prop?.location}</p>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ {prop?.rating}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-purple-600">{prop?.price}</p>
                <p className="text-gray-700"><strong>Type:</strong> {prop?.type}</p>
                <p className="text-gray-700"><strong>Size:</strong> {prop?.area}</p>
                <p className="text-gray-700"><strong>Bedrooms:</strong> {prop?.bedrooms} | <strong>Bathrooms:</strong> {prop?.bathrooms}</p>
                <p className="text-gray-700"><strong>Condition:</strong> {prop?.condition}</p>
              </div>

              <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
