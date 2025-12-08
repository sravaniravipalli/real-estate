# House Price Prediction Integration Guide

## Overview
Your real estate website now includes a **House Price Prediction** feature powered by a machine learning model. This guide will help you set up the Flask backend API required for the predictions to work.

## Setup Instructions

### Step 1: Clone the Repository
Open a terminal and run:
```bash
git clone https://github.com/Rishiraj8/house_price_prediction.git
cd house_price_prediction/backend
```

### Step 2: Install Python Dependencies
Make sure you have Python 3.8+ installed, then install required packages:
```bash
pip install -r requirements.txt
```

Required packages:
- Flask
- Flask-CORS
- numpy
- pandas
- scikit-learn

### Step 3: Run the Flask Server
Start the Flask API server (this must run in a separate terminal):
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

### Step 4: Access the Price Prediction Page
1. Make sure your React app is running: `npm run dev`
2. Navigate to: `http://localhost:5173/price-prediction`
3. Enter property details and click "Get Prediction"

---

## How It Works

### Frontend (React)
- **File:** `src/pages/pricePrediction/PricePrediction.jsx`
- **Components:**
  - `PredictionForm.jsx` - Collects property details from user
  - `PredictionResult.jsx` - Displays predicted price
- **API Endpoint:** `POST http://localhost:5000/predict`

### Backend (Flask)
- **URL:** `http://localhost:5000/predict`
- **Method:** POST
- **Input (JSON):**
  ```json
  {
    "bedrooms": 3,
    "bathrooms": 2,
    "livingArea": 2000,
    "condition": 3,
    "schoolsNearby": 2
  }
  ```
- **Output (JSON):**
  ```json
  {
    "predicted_price": 450000
  }
  ```

---

## Property Details to Enter

| Field | Range | Description |
|-------|-------|-------------|
| **Bedrooms** | 1-10 | Number of bedrooms |
| **Bathrooms** | 0.5-10 | Number of bathrooms (can be 0.5 increments) |
| **Living Area** | 500-10,000 sq ft | Total living space in square feet |
| **Condition** | 1-5 | Property condition (1=Poor, 5=Excellent) |
| **Schools Nearby** | 0-10 | Number of schools within reasonable distance |

---

## ML Model Details

- **Algorithm:** Random Forest Regressor
- **Number of Trees:** 100
- **Preprocessing:** StandardScaler for feature normalization
- **Accuracy:** High confidence predictions based on training data

---

## Troubleshooting

### "Connection Refused" Error
- Make sure Flask server is running: `python app.py`
- Check if port 5000 is available
- Try: `netstat -tuln | grep 5000` (Linux/Mac) or `netstat -ano | findstr :5000` (Windows)

### CORS Error
- Flask-CORS should be enabled in `app.py`
- If not, ensure this line exists: `CORS(app)`

### Model Not Found
- Verify `house_price_model.pkl` and `scaler.pkl` exist in the `backend/model/` directory
- The path in `app.py` should correctly reference these files

### Python Module Not Found
- Reinstall requirements: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.8+)

---

## Frontend Navigation
The Price Prediction page is now available in:
- **Navigation Menu:** "Price Prediction" link
- **Direct URL:** `http://localhost:5173/price-prediction`
- **Route:** `/price-prediction`

---

## File Structure
```
Real Estate AI Project/
├── src/
│   ├── pages/
│   │   └── pricePrediction/
│   │       └── PricePrediction.jsx
│   ├── components/
│   │   └── prediction/
│   │       ├── PredictionForm.jsx
│   │       └── PredictionResult.jsx
│   └── routes/
│       └── routes/Routes.jsx (updated)
└── ...

House Price Prediction Backend/
├── backend/
│   ├── app.py
│   ├── model/
│   │   ├── house_price_model.pkl
│   │   └── scaler.pkl
│   └── requirements.txt
```

---

## Running Both Servers

### Terminal 1 (React App)
```bash
cd real-estate-ai
npm run dev
```
Access: `http://localhost:5173`

### Terminal 2 (Flask API)
```bash
cd house_price_prediction/backend
python app.py
```
Access: `http://localhost:5000`

---

## Features

✅ Real-time price predictions  
✅ Input validation and error handling  
✅ Beautiful, responsive UI  
✅ Formatted currency output  
✅ Property condition selection (1-5 scale)  
✅ Mobile-friendly design  
✅ Loading states and error messages  

---

## Next Steps

1. Clone and set up the Flask backend
2. Run both servers
3. Test predictions with different property details
4. Integrate additional features like saved predictions or comparisons
5. Consider deploying to production (AWS, Heroku, etc.)

---

## Support

For issues with the Flask backend, visit: https://github.com/Rishiraj8/house_price_prediction

For React integration issues, check:
- `src/pages/pricePrediction/PricePrediction.jsx`
- Console errors (F12 - Developer Tools)
- Flask server logs
