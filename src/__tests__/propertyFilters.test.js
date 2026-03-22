import { describe, it, expect } from 'vitest';
import { getUniqueLocations, parsePrice, formatPrice } from '../api/propertyFilters';

describe('Property Filters', () => {
  describe('parsePrice', () => {
    it('should parse Indian currency format correctly', () => {
      expect(parsePrice('₹2,50,00,000')).toBe(25000000);
      expect(parsePrice('₹1,00,000')).toBe(100000);
    });

    it('should handle empty or invalid input', () => {
      expect(parsePrice('')).toBe(0);
      expect(parsePrice(null)).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('should format numbers to Indian currency', () => {
      expect(formatPrice(25000000)).toContain('₹');
      expect(formatPrice(100000)).toContain('₹');
    });
  });

  describe('getUniqueLocations', () => {
    it('should return array of unique locations', () => {
      const locations = getUniqueLocations([
        { location: "Vizag" },
        { location: "Hyderabad" },
        { location: "Vizag" },
        { location: "" },
        {},
      ]);
      expect(Array.isArray(locations)).toBe(true);
      expect(locations).toEqual(["Hyderabad", "Vizag"]);
    });
  });
});
