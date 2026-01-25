import React, { useState } from 'react';
import PredictionForm from '../../components/prediction/PredictionForm';
import PredictionResult from '../../components/prediction/PredictionResult';
import useTitle from '../../hook/useTitle';

export default function PricePrediction() {
  useTitle('Price Prediction');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      setPrediction(data.predicted_price);
    } catch (err) {
      // If backend is not available, use mock prediction
      console.warn('Backend API not available, using mock prediction');
      
      // Simple mock calculation based on inputs
      const basePrice = 100000;
      const bedroomValue = formData.bedrooms * 50000;
      const bathroomValue = formData.bathrooms * 30000;
      const areaValue = formData.livingArea * 150;
      const conditionMultiplier = formData.condition * 0.1 + 0.8;
      const schoolBonus = formData.schoolsNearby * 10000;
      
      const mockPrice = Math.round(
        (basePrice + bedroomValue + bathroomValue + areaValue + schoolBonus) * conditionMultiplier
      );
      
      setPrediction(mockPrice);
      setError('Note: Using estimated calculation. For accurate ML predictions, please start the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-prediction-page p-6 max-w-6xl mx-auto mt-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2 mt-8">House Price Prediction</h1>
        <p className="text-center text-gray-600">
          Get an instant estimate for your property using our AI-powered prediction model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="modern-card p-6">
          <h2 className="text-2xl font-bold mb-6">Enter Property Details</h2>
          <PredictionForm onPredict={handlePredict} loading={loading} />
        </div>

        {/* Result Section */}
        <div className="modern-card p-6">
          <h2 className="text-2xl font-bold mb-6">Predicted Price</h2>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600">Calculating prediction...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              <p className="font-semibold">⚠️ Notice</p>
              <p>{error}</p>
            </div>
          )}
          {prediction && <PredictionResult price={prediction} />}
          {!loading && !error && !prediction && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Enter property details and click "Get Prediction" to see the estimated price</p>
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-12 modern-card p-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">🤖 AI-Powered Model</h3>
            <p className="text-gray-700">
              Our prediction uses a trained Random Forest machine learning model that analyzes multiple property features to estimate market value.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">📊 Data Features</h3>
            <p className="text-gray-700">
              The model considers bedrooms, bathrooms, living area, property condition, and nearby schools to make accurate predictions.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">⚡ Instant Results</h3>
            <p className="text-gray-700">
              Get estimated property prices in seconds. Perfect for quick valuations and market research.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">✅ Accurate Estimates</h3>
            <p className="text-gray-700">
              Based on real property data, our model provides reliable price estimates for residential properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
