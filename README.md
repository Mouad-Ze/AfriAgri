# AfriAgri — Soil-to-Harvest Intelligence Platform

A full-stack machine learning application that analyzes Sub-Saharan African soil
samples and delivers fertility scores, soil zone classifications, and crop
recommendations. AfriAgri is the deployed implementation backing the paper
*"AfriAgri: A Leakage-Resistant and Zone-Aware Machine Learning Platform for Soil
Fertility Assessment and Crop Recommendation in Sub-Saharan Africa"*
(Zemzoumi, Ouballouk, Amar — Al Akhawayn University in Ifrane).

> **Status note:** the conversational RAG-based advisory layer described in the
> paper (Section 5.5) is a **planned extension and is not yet implemented** in
> this repository. Everything else described below — the regression, clustering,
> and classification pipelines, the FastAPI backend, and the React frontend — is
> implemented and runnable end to end.

---

## Overview

AfriAgri combines three predictive models behind a single REST API:

| Track | Model | Output |
|---|---|---|
| **A — Regression** | Soil fertility regressor (CatBoost) | Fertility score (0–100) |
| **B — Clustering** | K-Means soil zoning (k=4) | Fertility zone + description |
| **C — Classification** | Crop recommendation ensemble (CatBoost) | Top 5 crops with confidence |

The system supports **8 East/Southern African countries**: Ethiopia, Kenya,
Malawi, Rwanda, Tanzania, Uganda, Zambia, and Zimbabwe.

All three pipelines were benchmarked against 15 regression and 13 classification
algorithms respectively under a strict **leakage-resistant evaluation protocol**
(train/test split → preprocessing fitted on training data only → 5-fold CV on the
training partition only → held-out test evaluation). This is the central
methodological claim of the accompanying paper, and the training notebooks in
this repository (`notebooks/`) are provided specifically so that claim can be
independently verified rather than taken on faith.

---

## Architecture

```
AfriAgri/
├── Backend/                      # FastAPI inference server (Python)
│   ├── main.py                   # API endpoints
│   ├── features.py               # Feature engineering (matches training pipeline)
│   ├── models/                   # Serialized scikit-learn / CatBoost pipelines
│   └── requirements.txt
├── Frontend/                     # React + TypeScript + Tailwind CSS UI
│   └── src/
│       ├── components/SoilPredictorForm.tsx
│       └── types/agri.ts
├── notebooks/                    # Offline training and evaluation (see below)
│   ├── data/
│   │   ├── SubSaharan_Soil_Fertility_Dataset.csv
│   │   └── Crop_recommendation.csv
│   ├── soil_regression.ipynb
│   ├── soil_clustering.ipynb
│   └── crop_recommendation.ipynb
└── README.md
```

### Data Flow

1. User enters soil measurements and land context in the React form.
2. Frontend POSTs JSON to `POST /api/predict`.
3. Backend computes derived features (NPK ratios, pH category, texture class, encodings).
4. Three pre-trained pipelines run inference in parallel.
5. Results are returned as fertility score, zone label, and ranked crop list.

---

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

**Model training / evaluation**
- Jupyter notebooks, pandas, scikit-learn, CatBoost, XGBoost, LightGBM
- See `notebooks/` for the full leakage-resistant benchmarking pipeline (15
  regression models, 13 classification models, K-Means cluster validation)

---

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

Verify: `http://localhost:8000/api/health`

### Frontend

```bash
cd Frontend
npm install
npm start
```

Opens at `http://localhost:3000`. The form calls `http://localhost:8000/api/predict`.

### Reproducing the model training and benchmark results

```bash
cd notebooks
pip install -r requirements-dev.txt   # adds jupyter, matplotlib, seaborn
jupyter notebook
```

Run `soil_regression.ipynb`, `soil_clustering.ipynb`, and
`crop_recommendation.ipynb`. Each notebook loads its training data directly
from `notebooks/data/` (`SubSaharan_Soil_Fertility_Dataset.csv` for the
regression and clustering notebooks, `Crop_recommendation.csv` for the
classification notebook — see the Data Sources section below for schema and
provenance), implements the full leakage-resistant protocol from scratch
(stratified 80/20 split → preprocessing fit on training data only → 5-fold CV
→ held-out test evaluation), and exports the winning CatBoost pipelines to
`Backend/models/` as the final cell. This is the code path that produces the
benchmark figures reported in the paper (CatBoost test R²=0.9154 for fertility
regression; 97.27% accuracy / 0.9729 macro-F1 for crop recommendation).

> Model artifacts in `Backend/models/` are tracked via [Git LFS](https://git-lfs.com/).
> Run `git lfs install && git lfs pull` after cloning if the `.joblib` files
> appear as small pointer files instead of full binaries.

---

## API Reference

### `GET /api/health`

Health check.

### `POST /api/predict`

**Request body** (JSON):

| Field | Type | Description |
|---|---|---|
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

---

## Feature Engineering

The regression pipeline uses 24 features, including derived ratios (`N_to_P`,
`N_to_K`, `P_to_K`, `NPK_total`), categorical encodings (pH category, texture
class, land cover, country), and temporal context (sampling year/month). See
`Backend/features.py` for the inference-time pipeline and `notebooks/` for the
training-time pipeline they are derived from.

---

## Data Sources

The training data integrates four open-access geospatial sources: soil
physicochemical properties from [ISRIC World Soil Information](https://www.isric.org),
climate and rainfall surfaces from [WorldClim v2.1](https://www.worldclim.org),
vegetation indices (NDVI) derived from Landsat-8 via
[Google Earth Engine](https://earthengine.google.com), and the agronomic
fertility-weighting scheme of Sanchez (2002), *Soil fertility and hunger in
Africa*, Science 295(5562). The crop recommendation benchmark dataset is from
[Ingle (2020), Kaggle](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset).

The cleaned, merged CSVs used to train the models are in
[`notebooks/data/`](notebooks/data/):

| File | Rows | Used by |
|---|---|---|
| `SubSaharan_Soil_Fertility_Dataset.csv` | 5,000 | `soil_regression.ipynb`, `soil_clustering.ipynb` |
| `Crop_recommendation.csv` | 2,200 | `crop_recommendation.ipynb` |

### Important caveat on `fertility_score`

The `fertility_score` target variable in `SubSaharan_Soil_Fertility_Dataset.csv`
is **not an independently measured field outcome**. It is a deterministic
function of other columns in the same dataset, computed via the Sanchez (2002)
weighting scheme:

```
fertility_score = 0.25 × N_norm + 0.25 × P_norm + 0.20 × K_norm
                + 0.15 × pH_optimal_norm + 0.15 × OC_norm
```

A model trained to predict `fertility_score` from the other columns is
learning to recover a known formula, not predicting an independently measured
quantity. High R² is therefore expected by construction and should not be
read as evidence of real-world predictive validity without separate field
validation. `Crop_recommendation.csv` is also artificially balanced across
its 22 crop classes and does not reflect real-world crop frequency or
geographic distribution. Both caveats are discussed in full in Section 3.1
and Section 6.1 of the accompanying paper.

---

## Roadmap

- [x] Three-track parallel inference (regression / clustering / classification)
- [x] Leakage-resistant training and evaluation pipeline
- [x] React/TypeScript frontend with real-time input validation
- [ ] RAG-based conversational advisory layer for plain-language farmer guidance
      (planned — see paper Section 5.5 for the proposed architecture)
- [ ] Field validation with laboratory-measured fertility outcomes
- [ ] Ablation study isolating the predictive contribution of fertility zoning

---

## Citation

If you use this code or platform, please cite:

```bibtex
@article{zemzoumi2026afriagri,
  title   = {AfriAgri: A Leakage-Resistant and Zone-Aware Machine Learning
             Platform for Soil Fertility Assessment and Crop Recommendation
             in Sub-Saharan Africa},
  author  = {Zemzoumi, Mouad and Ouballouk, Mohamed and Amar, Amine},
  school  = {Al Akhawayn University in Ifrane},
  year    = {2026}
}
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contributing

Issues and pull requests are welcome. If you find a discrepancy between this
repository and the published paper, please open an issue — reproducibility is
the central point of this project.
