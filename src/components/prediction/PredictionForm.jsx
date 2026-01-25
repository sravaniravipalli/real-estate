import React, { useState } from 'react';

export default function PredictionForm({ onPredict, loading }) {
  const [formData, setFormData] = useState({
    bedrooms: 3,
    bathrooms: 2,
    livingArea: 2000,
    condition: 3,
    schoolsNearby: 2,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.bedrooms < 1 || formData.bedrooms > 10) {
      newErrors.bedrooms = 'Bedrooms must be between 1 and 10';
    }
    if (formData.bathrooms < 0.5 || formData.bathrooms > 10) {
      newErrors.bathrooms = 'Bathrooms must be between 0.5 and 10';
    }
    if (formData.livingArea < 500 || formData.livingArea > 10000) {
      newErrors.livingArea = 'Living area must be between 500 and 10,000 sq ft';
    }
    if (formData.condition < 1 || formData.condition > 5) {
      newErrors.condition = 'Condition must be between 1 and 5';
    }
    if (formData.schoolsNearby < 0 || formData.schoolsNearby > 10) {
      newErrors.schoolsNearby = 'Schools nearby must be between 0 and 10';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onPredict(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bedrooms */}
      <div>
        <label htmlFor="pred-bedrooms" className="block text-sm font-semibold text-gray-700 mb-2">
          🛏️ Bedrooms
        </label>
        <input
          id="pred-bedrooms"
          type="number"
          name="bedrooms"
          value={formData.bedrooms}
          onChange={handleChange}
          min="1"
          max="10"
          step="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.bedrooms && <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>}
        <p className="text-xs text-gray-500 mt-1">1-10 bedrooms</p>
      </div>

      {/* Bathrooms */}
      <div>
        <label htmlFor="pred-bathrooms" className="block text-sm font-semibold text-gray-700 mb-2">
          🚿 Bathrooms
        </label>
        <input
          id="pred-bathrooms"
          type="number"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          min="0.5"
          max="10"
          step="0.5"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.bathrooms && <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>}
        <p className="text-xs text-gray-500 mt-1">0.5-10 bathrooms</p>
      </div>

      {/* Living Area */}
      <div>
        <label htmlFor="pred-livingArea" className="block text-sm font-semibold text-gray-700 mb-2">
          📐 Living Area (sq ft)
        </label>
        <input
          id="pred-livingArea"
          type="number"
          name="livingArea"
          value={formData.livingArea}
          onChange={handleChange}
          min="500"
          max="10000"
          step="100"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.livingArea && <p className="text-red-500 text-sm mt-1">{errors.livingArea}</p>}
        <p className="text-xs text-gray-500 mt-1">500-10,000 square feet</p>
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="pred-condition" className="block text-sm font-semibold text-gray-700 mb-2">
          ⭐ Property Condition
        </label>
        <select
          id="pred-condition"
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Average</option>
          <option value="4">4 - Good</option>
          <option value="5">5 - Excellent</option>
        </select>
        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
      </div>

      {/* Schools Nearby */}
      <div>
        <label htmlFor="pred-schoolsNearby" className="block text-sm font-semibold text-gray-700 mb-2">
          🏫 Schools Nearby
        </label>
        <input
          id="pred-schoolsNearby"
          type="number"
          name="schoolsNearby"
          value={formData.schoolsNearby}
          onChange={handleChange}
          min="0"
          max="10"
          step="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.schoolsNearby && <p className="text-red-500 text-sm mt-1">{errors.schoolsNearby}</p>}
        <p className="text-xs text-gray-500 mt-1">0-10 schools</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 mt-6"
      >
        {loading ? 'Calculating...' : '🚀 Get Prediction'}
      </button>
    </form>
  );
}
