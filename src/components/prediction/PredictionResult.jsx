import React from 'react';

export default function PredictionResult({ price }) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className="space-y-6">
      {/* Main Price Display */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 font-semibold mb-2">Estimated Property Value</p>
        <h2 className="text-5xl font-bold text-green-600">{formattedPrice}</h2>
        <p className="text-green-700 text-sm mt-3">✅ Prediction Complete</p>
      </div>

      {/* Price Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 font-semibold mb-3">Price Estimate Details</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Base Estimate</span>
            <span className="font-semibold text-gray-900">{formattedPrice}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm">
            <span className="text-gray-600 italic">AI Model Confidence: High</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Note:</span> This is an automated estimate based on property features and market data. 
          For a professional appraisal, please consult a certified real estate appraiser.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors">
          🔄 New Prediction
        </button>
      </div>
    </div>
  );
}
