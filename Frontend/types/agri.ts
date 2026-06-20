// frontend/types/agri.ts
export interface SoilFeaturesInput {
  nitrogen_total: number;
  phosphorus_avail: number;
  potassium_exch: number;
  pH_water: number;
  rainfall_annual: number;
  organic_carbon: number;
  sand_percent: number;
  silt_percent: number;
  clay_percent: number;
  bulk_density: number;
  cation_exchange_cap: number;
  altitude: number;
  NDVI_mean: number;
}

export interface CropRecommendation {
  crop: string;
  confidence: number;
}

export interface LandPredictionResponse {
  fertility_score: number;
  fertility_zone: string;
  zone_description: string;
  recommended_crops: CropRecommendation[];
}