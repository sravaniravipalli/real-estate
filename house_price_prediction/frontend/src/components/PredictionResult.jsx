import React from 'react';
import './PredictionResult.css';

const BREAKDOWN_WEIGHTS = {
    landValue:         { label: 'Land Value',           weight: 0.35, icon: '🏗️' },
    constructionCost:  { label: 'Construction Cost',    weight: 0.30, icon: '🧱' },
    interiorFinish:    { label: 'Interior & Finishing',  weight: 0.15, icon: '🪟' },
    locationPremium:   { label: 'Location Premium',     weight: 0.12, icon: '📍' },
    amenitiesSchools:  { label: 'Amenities & Schools',  weight: 0.08, icon: '🏫' },
};

const PredictionResult = ({ price, isLoading }) => {
    const breakdown = price
        ? Object.entries(BREAKDOWN_WEIGHTS).map(([key, { label, weight, icon }]) => ({
              key,
              label,
              icon,
              amount: Math.round(price * weight),
              percent: Math.round(weight * 100),
          }))
        : [];

    return (
        <div className="prediction-result">
            <h2>Predicted Price</h2>

            {isLoading ? (
                <div className="loading-wrapper">
                    <div className="loading-spinner" />
                    <p className="loading-text">Calculating breakdown…</p>
                </div>
            ) : price ? (
                <>
                    <p className="price">₹{price.toLocaleString()}</p>
                    <p className="price-subtitle">Estimated market value</p>

                    <div className="breakdown-section">
                        <h3 className="breakdown-title">Price Breakdown</h3>
                        <div className="breakdown-list">
                            {breakdown.map(({ key, label, icon, amount, percent }) => (
                                <div className="breakdown-item" key={key}>
                                    <div className="breakdown-header">
                                        <span className="breakdown-icon">{icon}</span>
                                        <span className="breakdown-label">{label}</span>
                                        <span className="breakdown-amount">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="breakdown-bar-track">
                                        <div
                                            className="breakdown-bar-fill"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="breakdown-percent">{percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <p className="no-prediction">Submit the form to see the predicted price</p>
            )}
        </div>
    );
};

export default PredictionResult;