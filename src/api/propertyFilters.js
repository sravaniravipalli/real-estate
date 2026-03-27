// Property filtering/statistics helpers.
// All functions operate on the provided `properties` array so the UI can use DB data.

export const MIN_PROPERTY_PRICE_INR = 6_000_000; // 60 lakhs

export const getUniqueLocations = (properties = []) => {
  return [
    ...new Set((properties || []).map((prop) => prop.location).filter(Boolean)),
  ].sort();
};

// Parse any price-like value to a number (e.g., "₹2,50,00,000" -> 25000000)
export const parsePrice = (priceLike) => {
  if (priceLike === null || priceLike === undefined) return 0;
  if (typeof priceLike === "number" && Number.isFinite(priceLike)) return priceLike;
  const numeric = Number(String(priceLike).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

export const clampMinPrice = (price, minPrice = MIN_PROPERTY_PRICE_INR) => {
  const n = Number(price) || 0;
  return n > 0 ? Math.max(minPrice, Math.round(n)) : 0;
};

export const getEffectivePrice = (priceLike, minPrice = MIN_PROPERTY_PRICE_INR) => {
  return clampMinPrice(parsePrice(priceLike), minPrice);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
};

export const filterPropertiesByLocationAndPrice = (
  properties = [],
  location,
  minPrice,
  maxPrice
) => {
  return (properties || []).filter((property) => {
    const propertyPrice = getEffectivePrice(property.valuationCost);
    const locationMatch = location === "All" || property.location === location;
    const priceMatch = propertyPrice >= minPrice && propertyPrice <= maxPrice;
    return locationMatch && priceMatch;
  });
};

export const getPriceStatistics = (properties = [], location) => {
  const props =
    location === "All"
      ? properties || []
      : (properties || []).filter((prop) => prop.location === location);

  if (props.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0 };
  }

  const prices = props.map((prop) => getEffectivePrice(prop.valuationCost));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  return { min, max, avg, count: props.length };
};

export const recommendProperties = (
  properties = [],
  location,
  budget,
  preferences = {}
) => {
  const { bedrooms = null, maxArea = null } = preferences;

  let filtered = filterPropertiesByLocationAndPrice(
    properties,
    location,
    budget * 0.8,
    budget * 1.2
  );

  if (bedrooms) {
    filtered = filtered.filter((prop) => prop.bedrooms >= bedrooms);
  }

  if (maxArea) {
    filtered = filtered.filter((prop) => {
      const area = parseInt(prop.area, 10);
      return Number.isFinite(area) ? area <= maxArea : false;
    });
  }

  return filtered.sort((a, b) => {
    const priceA = getEffectivePrice(a.valuationCost);
    const priceB = getEffectivePrice(b.valuationCost);
    return Math.abs(priceA - budget) - Math.abs(priceB - budget);
  });
};

export const getComparisonData = (properties) => {
  return (properties || []).map((prop) => {
    const priceNumeric = getEffectivePrice(prop.valuationCost);
    const area = parseInt(prop.area, 10);
    return {
      ...prop,
      priceNumeric,
      pricePerSqft: area ? Math.round(priceNumeric / area) : 0,
    };
  });
};

export const predictAvailabilityInLocation = (allProperties = [], location, priceRange) => {
  const properties = filterPropertiesByLocationAndPrice(
    allProperties,
    location,
    priceRange.min,
    priceRange.max
  );

  const totalInLocation =
    location === "All"
      ? (allProperties || []).length
      : (allProperties || []).filter((p) => p.location === location).length;

  return {
    available: properties.length,
    totalInLocation,
    percentage: totalInLocation
      ? Math.round((properties.length / totalInLocation) * 100)
      : 0,
    properties,
  };
};

