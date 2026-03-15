# Frontend ↔ Backend ↔ Database (SQLite) Setup

This project uses:
- **Frontend**: Vite + React (`npm run dev`)
- **Backend**: Flask (`python app.py`)
- **Database**: SQLite (`house_price_prediction/backend/app.db`)

## 1) Start the backend (creates DB)

```powershell
cd house_price_prediction\backend
python -m pip install -r requirements.txt
python app.py
```

After the first run, the DB file will exist at:
- `house_price_prediction/backend/app.db`

## 2) Insert the 25 frontend properties into the DB (seed)

With the backend running, open a new terminal and run:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/mock-properties | ConvertTo-Json
```

## 2b) Seed blogs + property videos into the DB

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/blogs | ConvertTo-Json
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/videos | ConvertTo-Json
```

Or seed everything in one go:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/all | ConvertTo-Json -Depth 20
```

## 2c) Upload images + videos into the DB (BLOB storage)

This copies files from:
- `public/houses/*`
- `public/assets/videos/*.mp4`

Into SQLite table `media_assets`, and the backend will return media URLs like:
- `http://127.0.0.1:5000/media/houses/img1.jpg`
- `http://127.0.0.1:5000/media/assets/videos/property1.mp4`

Run:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/media | ConvertTo-Json
```

## 2d) Upload ML model + scaler into the DB

This copies:
- `house_price_prediction/backend/model/house_price_model.pkl`
- `house_price_prediction/backend/model/scaler.pkl`

Into SQLite table `ml_artifacts`.

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:5000/seed/ml | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:5000/ml/status | ConvertTo-Json
```

## 3) Start the frontend (reads properties from DB via backend)

Make sure `.env` contains:

```env
VITE_REACT_API_URL=http://localhost:5000
```

Then:

```powershell
npm install
npm run dev
```

## 4) Verify the frontend is using DB data

```powershell
Invoke-RestMethod http://127.0.0.1:5000/properties | ConvertTo-Json -Depth 50
```

## Important

- The frontend is now **DB-only** for properties/blogs/videos: if the backend is not running, the UI will show an error instead of mock/fallback data.
