// Property filtering/statistics helpers.
// All functions operate on the provided `properties` array so the UI can use DB data.

// Get unique locations from properties
export const getUniqueLocations = (properties = []) => {
  return [...new Set((properties || []).map((prop) => prop.location).filter(Boolean))].sort();
};

// Parse price string to number (e.g., "₹2,50,00,000" -> 25000000)
export const parsePrice = (priceString) => {
  if (!priceString) return 0;
  return parseInt(String(priceString).replace(/[₹â‚¹,\s]/g, ""), 10) || 0;
};

// Format number to price string (e.g., 25000000 -> "₹2,50,00,000")
export const formatPrice = (price) => {
  const crores = Math.floor(price / 10000000);
  const lakhs = Math.floor((price % 10000000) / 100000);

  if (crores > 0) {
    if (lakhs > 0) {
      return `₹${crores},${lakhs.toString().padStart(2, "0")},00,000`;
    }
    return `₹${crores},00,00,000`;
  }
  return `₹${lakhs},00,000`;
};

// Filter properties by location and price range
export const filterPropertiesByLocationAndPrice = (properties = [], location, minPrice, maxPrice) => {
  return (properties || []).filter((property) => {
    const propertyPrice = parsePrice(property.valuationCost);
    const locationMatch = location === "All" || property.location === location;
    const priceMatch = propertyPrice >= minPrice && propertyPrice <= maxPrice;
    return locationMatch && priceMatch;
  });
};

// Get price statistics for a location
export const getPriceStatistics = (properties = [], location) => {
  const props =
    location === "All"
      ? (properties || [])
      : (properties || []).filter((prop) => prop.location === location);

  if (props.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0 };
  }

  const prices = props.map((prop) => parsePrice(prop.valuationCost));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  return { min, max, avg, count: props.length };
};

// Recommend properties based on user budget and preferences
export const recommendProperties = (properties = [], location, budget, preferences = {}) => {
  const { bedrooms = null, maxArea = null } = preferences;

  let filtered = filterPropertiesByLocationAndPrice(
    properties,
    location,
    budget * 0.8, // 20% less than budget
    budget * 1.2 // 20% more than budget
  );

  if (bedrooms) {
    filtered = filtered.filter((prop) => prop.bedrooms >= bedrooms);
  }

  if (maxArea) {
    filtered = filtered.filter((prop) => {
      const area = parseInt(prop.area, 10);
      return area <= maxArea;
    });
  }

  // Sort by closeness to budget
  return filtered.sort((a, b) => {
    const priceA = parsePrice(a.valuationCost);
    const priceB = parsePrice(b.valuationCost);
    return Math.abs(priceA - budget) - Math.abs(priceB - budget);
  });
};

// Get comparison data for properties
export const getComparisonData = (properties) => {
  return (properties || []).map((prop) => ({
    ...prop,
    priceNumeric: parsePrice(prop.valuationCost),
    pricePerSqft: Math.round(parsePrice(prop.valuationCost) / parseInt(prop.area, 10)),
  }));
};

// Predict availability in location
export const predictAvailabilityInLocation = (allProperties = [], location, priceRange) => {
  const properties = filterPropertiesByLocationAndPrice(
    allProperties,
    location,
    priceRange.min,
    priceRange.max
  );

  const totalInLocation = (allProperties || []).filter((p) => p.location === location).length;
  return {
    available: properties.length,
    totalInLocation,
    percentage: totalInLocation ? Math.round((properties.length / totalInLocation) * 100) : 0,
    properties,
  };
};
