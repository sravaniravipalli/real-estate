import { useState } from "react";
import {
  getUniqueLocations,
  filterPropertiesByLocationAndPrice,
  getPriceStatistics,
  getEffectivePrice,
  formatPrice,
  MIN_PROPERTY_PRICE_INR,
  recommendProperties,
  predictAvailabilityInLocation,
} from "api/propertyFilters";

export default function PropertyFilter({ properties = [], onFilterChange }) {
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [minPrice, setMinPrice] = useState(MIN_PROPERTY_PRICE_INR);
  const [maxPrice, setMaxPrice] = useState(600000000);
  const [bedrooms, setBedrooms] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [availability, setAvailability] = useState(null);

  const locations = ["All", ...getUniqueLocations(properties)];
  const stats = getPriceStatistics(properties, selectedLocation);

  const handleFilterChange = () => {
    const filtered = filterPropertiesByLocationAndPrice(
      properties,
      selectedLocation,
      minPrice,
      maxPrice
    );
    onFilterChange(filtered);
    setShowStats(true);
  };

  const handleRecommendation = () => {
    const budget = (minPrice + maxPrice) / 2;
    const prefs = {
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
    };
    const recs = recommendProperties(properties, selectedLocation, budget, prefs);
    setRecommendations(recs);
    
    // Predict availability
    const avail = predictAvailabilityInLocation(properties, selectedLocation, {
      min: minPrice,
      max: maxPrice,
    });
    setAvailability(avail);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-[#7C6EE4] mb-6">
        Find Your Perfect Home
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Location Filter */}
        <div>
          <label htmlFor="filter-location" className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <select
            id="filter-location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C6EE4]"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          {stats.count > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {stats.count} properties available
            </p>
          )}
        </div>

        {/* Min Price Filter */}
        <div>
          <label htmlFor="filter-minPrice" className="block text-sm font-semibold text-gray-700 mb-2">
            Min Price
          </label>
          <input
            id="filter-minPrice"
            type="range"
            min={MIN_PROPERTY_PRICE_INR}
            max="600000000"
            step="1000000"
            value={minPrice}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10) || MIN_PROPERTY_PRICE_INR;
              setMinPrice(next);
              if (next > maxPrice) setMaxPrice(next);
            }}
            className="w-full"
          />
          <p className="text-xs font-semibold text-[#7C6EE4] mt-1">
            {formatPrice(minPrice)}
          </p>
        </div>

        {/* Max Price Filter */}
        <div>
          <label htmlFor="filter-maxPrice" className="block text-sm font-semibold text-gray-700 mb-2">
            Max Price
          </label>
          <input
            id="filter-maxPrice"
            type="range"
            min={MIN_PROPERTY_PRICE_INR}
            max="600000000"
            step="1000000"
            value={maxPrice}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10) || MIN_PROPERTY_PRICE_INR;
              setMaxPrice(next);
              if (next < minPrice) setMinPrice(next);
            }}
            className="w-full"
          />
          <p className="text-xs font-semibold text-[#7C6EE4] mt-1">
            {formatPrice(maxPrice)}
          </p>
        </div>

        {/* Bedrooms Filter */}
        <div>
          <label htmlFor="filter-bedrooms" className="block text-sm font-semibold text-gray-700 mb-2">
            Min Bedrooms
          </label>
          <select
            id="filter-bedrooms"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C6EE4]"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 justify-end">
          <button
            onClick={handleFilterChange}
            className="bg-[#7C6EE4] text-white px-4 py-2 rounded-lg hover:bg-[#6C5ECC] transition font-semibold"
          >
            Search
          </button>
          <button
            onClick={handleRecommendation}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
          >
            Recommend
          </button>
        </div>
      </div>

      {/* Price Statistics */}
      {showStats && stats.count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Min Price</p>
            <p className="text-lg font-bold text-[#7C6EE4]">
              {formatPrice(stats.min)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Max Price</p>
            <p className="text-lg font-bold text-[#7C6EE4]">
              {formatPrice(stats.max)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Avg Price</p>
            <p className="text-lg font-bold text-[#7C6EE4]">
              {formatPrice(stats.avg)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Properties</p>
            <p className="text-lg font-bold text-[#7C6EE4]">{stats.count}</p>
          </div>
        </div>
      )}

      {/* Availability Prediction */}
      {availability && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📊 Availability Prediction
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Available in Range</p>
              <p className="text-2xl font-bold text-blue-600">
                {availability.available}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total in Location</p>
              <p className="text-2xl font-bold text-blue-600">
                {availability.totalInLocation}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Match Percentage</p>
              <p className="text-2xl font-bold text-blue-600">
                {availability.percentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            💡 Recommended Properties ({recommendations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((prop) => (
              <div
                key={prop._id}
                className="bg-white p-4 rounded border border-green-200 hover:shadow-md transition"
              >
                <h4 className="font-semibold text-gray-800 mb-2">
                  {prop.location}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {prop.description.slice(0, 80)}...
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#7C6EE4]">
                    {formatPrice(getEffectivePrice(prop.valuationCost))}
                  </span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    {prop.bedrooms}BHK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
