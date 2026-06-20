# AfriAgri (S2H) — Soil-to-Harvest Intelligence Platform

A full-stack machine learning application that analyzes African soil samples and delivers fertility scores, soil zone classifications, and crop recommendations. Built as part of a Statistical Analysis course project.

## Overview

**AfriAgri** (branded in the UI) combines three predictive models behind a single REST API:

| Track | Model | Output |
|-------|-------|--------|
| **A — Regression** | Soil fertility regressor | Fertility score (0–100) |
| **B — Clustering** | K-means soil clustering | Fertility zone + description |
| **C — Classification** | Crop recommendation ensemble | Top 5 crops with confidence |

The system supports **8 East/Southern African countries**: Ethiopia, Kenya, Malawi, Rwanda, Tanzania, Uganda, Zambia, and Zimbabwe.

## Architecture

```
S2H/
├── Backend/          # FastAPI inference server (Python)
│   ├── main.py       # API endpoints
│   ├── features.py   # Feature engineering (matches training pipeline)
│   ├── models/       # Serialized scikit-learn / CatBoost pipelines
│   └── requirements.txt
└── Frontend/         # React + TypeScript + Tailwind CSS UI
    └── src/
        ├── components/SoilPredictorForm.tsx
        └── types/agri.ts
```

### Data Flow

1. User enters soil measurements and land context in the React form.
2. Frontend POSTs JSON to `POST /api/predict`.
3. Backend computes derived features (NPK ratios, pH category, texture class, encodings).
4. Three pre-trained pipelines run inference in parallel.
5. Results are returned as fertility score, zone label, and ranked crop list.

## Tech Stack

**Backend**
- FastAPI + Uvicorn
- scikit-learn, CatBoost, XGBoost (training dependencies)
- joblib for model serialization
- NumPy, Pydantic v2

**Frontend**
- React 18 + TypeScript
- Create React App
- Tailwind CSS 3

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd Backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Frontend

```bash
cd Frontend
npm install
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). The form calls `http://localhost:8000/api/predict`.

## API Reference

### `GET /api/health`

Health check.

### `POST /api/predict`

**Request body** (JSON):

| Field | Type | Description |
|-------|------|-------------|
| `nitrogen_total` | float | Total nitrogen (mg/kg) |
| `phosphorus_avail` | float | Available phosphorus (mg/kg) |
| `potassium_exch` | float | Exchangeable potassium (cmol/kg) |
| `pH_water` | float | Soil pH |
| `rainfall_annual` | float | Annual rainfall (mm) |
| `organic_carbon` | float | Organic carbon (%) |
| `sand_percent` | float | Sand texture (%) |
| `silt_percent` | float | Silt texture (%) |
| `clay_percent` | float | Clay texture (%) |
| `bulk_density` | float | Bulk density (g/cm³) |
| `cation_exchange_cap` | float | CEC |
| `altitude` | float | Elevation (m) |
| `NDVI_mean` | float | Mean vegetation index |
| `NDVI_std` | float | NDVI variability (default 0.063) |
| `country` | string | One of 8 supported countries |
| `landcover_class` | string | Cropland, Grassland, Forest, etc. |
| `sampling_year` | int | 2010–2030 |
| `sampling_month` | int | 1–12 |

**Response:**

```json
{
  "fertility_score": 72.4,
  "fertility_zone": "Zone 2",
  "zone_description": "...",
  "recommended_crops": [
    { "crop": "maize", "confidence": 0.87 }
  ]
}
```

## Feature Engineering

The regression pipeline uses 24 features, including derived ratios (`N_to_P`, `N_to_K`, `P_to_K`, `NPK_total`), categorical encodings (pH category, texture class, land cover, country), and temporal context (sampling year/month). See `Backend/features.py` for the full pipeline.

## License

Academic / course project. All rights reserved unless otherwise specified.
