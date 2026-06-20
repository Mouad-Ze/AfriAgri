"""Map API soil inputs to regression model feature vectors."""

from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

SOIL_MODEL_FEATURES = [
    "nitrogen_total",
    "phosphorus_avail",
    "potassium_exch",
    "pH_water",
    "organic_carbon",
    "sand_percent",
    "silt_percent",
    "clay_percent",
    "bulk_density",
    "cation_exchange_cap",
    "NDVI_mean",
    "NDVI_std",
    "rainfall_annual",
    "altitude",
    "NPK_total",
    "N_to_P",
    "N_to_K",
    "P_to_K",
    "pH_category_encoded",
    "texture_encoded",
    "landcover_encoded",
    "sampling_year",
    "sampling_month",
    "country_encoded",
]

PH_CLASSES = [
    "moderately_acid",
    "moderately_alkaline",
    "neutral",
    "strongly_acid",
    "strongly_alkaline",
]
TEXTURE_CLASSES = ["clay", "loam", "sandy", "sandy_loam", "silty"]
LANDCOVER_CLASSES = ["Bare", "Cropland", "Forest", "Grassland", "Unknown", "Wetland"]
COUNTRY_CLASSES = [
    "Ethiopia",
    "Kenya",
    "Malawi",
    "Rwanda",
    "Tanzania",
    "Uganda",
    "Zambia",
    "Zimbabwe",
]


def ph_category(ph: float) -> str:
    if ph < 5.5:
        return "strongly_acid"
    if ph < 6.5:
        return "moderately_acid"
    if ph < 7.5:
        return "neutral"
    if ph < 8.5:
        return "moderately_alkaline"
    return "strongly_alkaline"


def texture_class(sand: float, silt: float, clay: float) -> str:
    if clay >= 40:
        return "clay"
    if sand >= 70:
        return "sandy"
    if silt >= 50 and clay < 27:
        return "silty"
    if sand >= 45 and clay < 20:
        return "sandy_loam"
    return "loam"


def _label_encode(value: str, classes: list[str]) -> int:
    encoder = LabelEncoder()
    encoder.classes_ = np.array(classes)
    return int(encoder.transform([value])[0])


def _payload_value(payload: Any, name: str, default: Any) -> Any:
    value = getattr(payload, name, None)
    return default if value is None else value


def build_raw_regression_features(payload: Any) -> np.ndarray:
    """Build the 24 raw regression features expected before scaling."""
    npk_total = payload.nitrogen_total + payload.phosphorus_avail + payload.potassium_exch
    n_to_p = payload.nitrogen_total / (payload.phosphorus_avail + 1e-6)
    n_to_k = payload.nitrogen_total / (payload.potassium_exch + 1e-6)
    p_to_k = payload.phosphorus_avail / (payload.potassium_exch + 1e-6)

    ph_label = ph_category(payload.pH_water)
    texture_label = texture_class(
        payload.sand_percent, payload.silt_percent, payload.clay_percent
    )

    values = {
        "nitrogen_total": payload.nitrogen_total,
        "phosphorus_avail": payload.phosphorus_avail,
        "potassium_exch": payload.potassium_exch,
        "pH_water": payload.pH_water,
        "organic_carbon": payload.organic_carbon,
        "sand_percent": payload.sand_percent,
        "silt_percent": payload.silt_percent,
        "clay_percent": payload.clay_percent,
        "bulk_density": payload.bulk_density,
        "cation_exchange_cap": payload.cation_exchange_cap,
        "NDVI_mean": payload.NDVI_mean,
        "NDVI_std": _payload_value(payload, "NDVI_std", 0.063),
        "rainfall_annual": payload.rainfall_annual,
        "altitude": payload.altitude,
        "NPK_total": npk_total,
        "N_to_P": n_to_p,
        "N_to_K": n_to_k,
        "P_to_K": p_to_k,
        "pH_category_encoded": _label_encode(ph_label, PH_CLASSES),
        "texture_encoded": _label_encode(texture_label, TEXTURE_CLASSES),
        "landcover_encoded": _label_encode(
            _payload_value(payload, "landcover_class", "Cropland"), LANDCOVER_CLASSES
        ),
        "sampling_year": float(_payload_value(payload, "sampling_year", 2026)),
        "sampling_month": float(_payload_value(payload, "sampling_month", 6)),
        "country_encoded": _label_encode(
            _payload_value(payload, "country", "Kenya"), COUNTRY_CLASSES
        ),
    }

    return np.array([[values[name] for name in SOIL_MODEL_FEATURES]], dtype=float)


def build_scaled_regression_features(payload: Any, feature_scaler: StandardScaler) -> np.ndarray:
    raw = build_raw_regression_features(payload)
    return feature_scaler.transform(raw)


def fit_and_save_regression_feature_scaler(
    soil_zoned_path: str, output_path: str
) -> StandardScaler:
    import pandas as pd

    soil = pd.read_csv(soil_zoned_path)
    scaler = StandardScaler()
    scaler.fit(soil[SOIL_MODEL_FEATURES].values)
    joblib.dump(scaler, output_path)
    return scaler


if __name__ == "__main__":
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    soil_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "soil_zoned.csv")
    )
    out_path = os.path.join(model_dir, "regression_feature_scaler.joblib")
    fit_and_save_regression_feature_scaler(soil_path, out_path)
    print(f"Saved regression feature scaler to {out_path}")
