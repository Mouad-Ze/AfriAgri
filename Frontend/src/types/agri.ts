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
  NDVI_std: number;
  country: string;
  landcover_class: string;
  sampling_year: number;
  sampling_month: number;
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

export const COUNTRY_OPTIONS = [
  'Ethiopia',
  'Kenya',
  'Malawi',
  'Rwanda',
  'Tanzania',
  'Uganda',
  'Zambia',
  'Zimbabwe',
] as const;

export const LANDCOVER_OPTIONS = [
  'Cropland',
  'Grassland',
  'Forest',
  'Bare',
  'Wetland',
  'Unknown',
] as const;

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;
