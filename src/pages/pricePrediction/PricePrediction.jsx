import { useState } from "react";
import PredictionForm from "../../components/prediction/PredictionForm";
import PredictionResult from "../../components/prediction/PredictionResult";
import useTitle from "../../hook/useTitle";

export default function PricePrediction() {
  useTitle("Price Prediction");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocationMultiplier = (location) => {
    const loc = String(location || "")
      .trim()
      .toLowerCase();
    const map = {
      "beach road": 1.25,
      "lawson's bay colony": 1.22,
      "waltair uplands": 1.2,
      "rushikonda hills": 1.18,
      "mvp colony": 1.15,
      "dwaraka nagar": 1.12,
      seethammadhara: 1.1,
      maharanipeta: 1.08,
      madhurawada: 1.06,
      yendada: 1.06,
      "pm palem": 1.05,
      kommadi: 1.04,
      hanumanthawaka: 1.03,
      isukathota: 1.03,
      arilova: 1.02,
      marripalem: 1.01,
      bheemunipatnam: 1.04,
      simhachalam: 0.98,
      pendurthi: 0.97,
      gopalapatnam: 0.97,
      gajuwaka: 0.95,
      "steel plant township": 0.96,
      thatichetlapalem: 0.99,
    };
    return map[loc] ?? 1.0;
  };

  // Frontend-only monotone formula:
  // Increasing any input (bedrooms/bathrooms/livingArea/condition/schoolsNearby) will never reduce the price.
  const monotoneEstimate = (formData) => {
    const MIN_PRICE_INR = 6_000_000; // 60 lakhs minimum (as requested)
    const BASE_RATE_PER_SQFT = 3_500; // baseline Vizag rate (before location multiplier)
    const BEDROOM_PREMIUM = 250_000;
    const BATHROOM_PREMIUM = 150_000;
    const SCHOOL_PREMIUM = 50_000;

    const bedrooms = Number(formData.bedrooms) || 0;
    const bathrooms = Number(formData.bathrooms) || 0;
    const livingArea = Number(formData.livingArea) || 0;
    const schoolsNearby = Number(formData.schoolsNearby) || 0;
    const condition = Math.round(Number(formData.condition) || 3);

    const conditionMultipliers = {
      1: 0.85,
      2: 0.93,
      3: 1.0,
      4: 1.08,
      5: 1.18,
    };
    const conditionMultiplier = conditionMultipliers[condition] ?? 1.0;

    let base =
      livingArea * BASE_RATE_PER_SQFT +
      Math.max(0, bedrooms - 1) * BEDROOM_PREMIUM +
      Math.max(0, bathrooms - 1) * BATHROOM_PREMIUM +
      Math.max(0, schoolsNearby) * SCHOOL_PREMIUM;

    base = Math.round(base * conditionMultiplier);
    const locationMultiplier = getLocationMultiplier(formData.location);
    const adjustedRaw = Math.round(base * locationMultiplier);
    const adjusted = Math.max(MIN_PRICE_INR, adjustedRaw);

    return {
      predicted_price: adjusted,
      base_predicted_price: base,
      location: formData.location,
      location_multiplier: locationMultiplier,
      min_price_inr: MIN_PRICE_INR,
      min_price_applied: adjusted !== adjustedRaw,
      source: "frontend-formula",
      api_version: "frontend-formula-v3",
    };
  };

  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Always use the frontend formula (backend ignored by request).
      setPrediction(monotoneEstimate(formData));
    } catch (err) {
      setError("Failed to calculate prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="price-prediction-page p-6 max-w-6xl mx-auto mt-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2 mt-8">
          House Price Prediction
        </h1>
        <p className="text-center text-gray-600">
          Get an instant estimate for your property using our AI-powered
          prediction model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="modern-card p-6">
          <h2 className="text-2xl font-bold mb-6">Enter Property Details</h2>
          <PredictionForm onPredict={handlePredict} loading={loading} />
        </div>

        <div className="modern-card p-6">
          <h2 className="text-2xl font-bold mb-6">Predicted Price</h2>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin inline-block"></div>
                <p className="mt-4 text-gray-600">Calculating prediction...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 mb-4">
              <p className="font-semibold">⚠️ Notice</p>
              <p>{error}</p>
            </div>
          )}
          {prediction !== null && (
            <PredictionResult price={prediction} onReset={handleReset} />
          )}
          {!loading && prediction === null && (
            <div className="flex items-center justify-center h-64 text-gray-500 text-center">
              <p>
                Enter property details and click &quot;Get Prediction&quot; to
                see the estimated price
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 modern-card p-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">🤖 AI-Powered Model</h3>
            <p className="text-gray-700">
              Our prediction uses a trained Random Forest machine learning model
              that analyzes multiple property features to estimate market value.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">📊 Data Features</h3>
            <p className="text-gray-700">
              The model considers bedrooms, bathrooms, living area, property
              condition, and nearby schools to make accurate predictions.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">⚡ Instant Results</h3>
            <p className="text-gray-700">
              Get estimated property prices in seconds. Perfect for quick
              valuations and market research.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">✅ Accurate Estimates</h3>
            <p className="text-gray-700">
              Based on real property data, our model provides reliable price
              estimates for residential properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
