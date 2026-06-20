# backend/main.py
import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from features import (
    COUNTRY_CLASSES,
    LANDCOVER_CLASSES,
    build_scaled_regression_features,
)

app = FastAPI(title="Land Soil Fertility & Crop Advisory Production Engine")

# Enable CORS so your TypeScript frontend can talk to this API safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AgriLand API is running"}

# 1. Resolve asset path and load saved pipeline objects at server spin-up
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

try:
    reg_pipeline = joblib.load(os.path.join(MODEL_DIR, "soil_regression_pipeline.joblib"))
    cluster_pipeline = joblib.load(os.path.join(MODEL_DIR, "soil_clustering_pipeline.joblib"))
    zone_labels = joblib.load(os.path.join(MODEL_DIR, "zone_metadata.joblib"))
    crop_pipeline = joblib.load(os.path.join(MODEL_DIR, "crop_classification_pipeline.joblib"))
    crop_encoder = joblib.load(os.path.join(MODEL_DIR, "crop_label_encoder.joblib"))
    regression_feature_scaler = joblib.load(
        os.path.join(MODEL_DIR, "regression_feature_scaler.joblib")
    )
    print("🚀 All predictive intelligence engines loaded successfully!")
except Exception as e:
    print(f"❌ Error loading serialized models: {e}")
    raise e

# 2. Define standard validation schemas for incoming requests
class LandAnalysisRequest(BaseModel):
    nitrogen_total: float = Field(..., description="Total Nitrogen Content")
    phosphorus_avail: float = Field(..., description="Available Phosphorus")
    potassium_exch: float = Field(..., description="Exchangeable Potassium")
    pH_water: float = Field(..., description="Soil pH level")
    rainfall_annual: float = Field(..., description="Annual Rainfall depth")
    organic_carbon: float = Field(..., description="Organic Carbon percentage")
    sand_percent: float = Field(..., description="Sand texture percentage")
    silt_percent: float = Field(..., description="Silt texture percentage")
    clay_percent: float = Field(..., description="Clay texture percentage")
    bulk_density: float = Field(..., description="Soil bulk density")
    cation_exchange_cap: float = Field(..., description="Cation Exchange Capacity")
    altitude: float = Field(..., description="Elevation/Altitude value")
    NDVI_mean: float = Field(..., description="Normalized Difference Vegetation Index context")
    NDVI_std: float = Field(
        0.063, ge=0.01, le=0.31, description="NDVI variability (seasonal greenness spread)"
    )
    country: str = Field("Kenya", description="Country where the soil sample was taken")
    landcover_class: str = Field("Cropland", description="Dominant land cover around the sample site")
    sampling_year: int = Field(2026, ge=2010, le=2030, description="Year the soil was sampled")
    sampling_month: int = Field(6, ge=1, le=12, description="Month the soil was sampled (1-12)")

    @field_validator("country")
    @classmethod
    def validate_country(cls, value: str) -> str:
        if value not in COUNTRY_CLASSES:
            raise ValueError(f"country must be one of: {', '.join(COUNTRY_CLASSES)}")
        return value

    @field_validator("landcover_class")
    @classmethod
    def validate_landcover(cls, value: str) -> str:
        if value not in LANDCOVER_CLASSES:
            raise ValueError(f"landcover_class must be one of: {', '.join(LANDCOVER_CLASSES)}")
        return value

@app.post("/api/predict")
async def predict_soil_and_crops(payload: LandAnalysisRequest):
    try:
        # 1. Compute dynamic compound structural ratios exactly like training
        npk_total = payload.nitrogen_total + payload.phosphorus_avail + payload.potassium_exch
        n_to_p = payload.nitrogen_total / (payload.phosphorus_avail + 1e-5)
        n_to_k = payload.nitrogen_total / (payload.potassium_exch + 1e-5)
        p_to_k = payload.phosphorus_avail / (payload.potassium_exch + 1e-5)

        # 2. Build track A (Regression) input using the same scaling pipeline as training
        reg_input = build_scaled_regression_features(payload, regression_feature_scaler)

        # 3. Build track B (Clustering) input feature array - Expects 14 features
        cluster_input = np.array([[
            payload.nitrogen_total, payload.phosphorus_avail, payload.potassium_exch,
            payload.pH_water, payload.organic_carbon, payload.sand_percent,
            payload.silt_percent, payload.clay_percent, payload.bulk_density,
            payload.cation_exchange_cap, payload.NDVI_mean, payload.rainfall_annual,
            payload.altitude, npk_total
        ]])
        
        # 4. Build track C (Crop Recommendation) input feature array - Expects 9 features
        crop_input = np.array([[
            payload.nitrogen_total, payload.phosphorus_avail, payload.potassium_exch,
            payload.pH_water, payload.rainfall_annual, npk_total, n_to_p, n_to_k, p_to_k
        ]])

        # 5. Run inferences via the saved serialized pipelines
        predicted_score = float(reg_pipeline.predict(reg_input)[0])
        predicted_zone_id = int(cluster_pipeline.predict(cluster_input)[0])
        zone_description = zone_labels.get(predicted_zone_id, "Standard Production Matrix Profile")

        # Extract top ranked probability distributions from classification ensemble
        probabilities = crop_pipeline.predict_proba(crop_input)[0]
        top_5_indices = np.argsort(probabilities)[::-1][:5]
        
        # Map model class indices to human-readable crop names via the label encoder
        model_classes = crop_pipeline.classes_
        
        recommended_crops = []
        for idx in top_5_indices:
            class_id = int(model_classes[idx])
            crop_name = str(crop_encoder.inverse_transform([class_id])[0])
            
            recommended_crops.append({
                "crop": crop_name,
                "confidence": float(probabilities[idx])
            })

        return {
            "fertility_score": min(max(predicted_score, 0.0), 100.0),
            "fertility_zone": f"Zone {predicted_zone_id}",
            "zone_description": zone_description,
            "recommended_crops": recommended_crops
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution engine error: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AgriLand Predictive Intelligence System", "version": "1.0.0"}