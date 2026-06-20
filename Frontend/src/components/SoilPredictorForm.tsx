import React, { useState } from 'react';
import {
  SoilFeaturesInput,
  LandPredictionResponse,
  COUNTRY_OPTIONS,
  LANDCOVER_OPTIONS,
  MONTH_OPTIONS,
} from '../types/agri';

const SOIL_FIELD_LABELS: Record<
  keyof Pick<
    SoilFeaturesInput,
    | 'nitrogen_total'
    | 'phosphorus_avail'
    | 'potassium_exch'
    | 'pH_water'
    | 'rainfall_annual'
    | 'organic_carbon'
    | 'sand_percent'
    | 'silt_percent'
    | 'clay_percent'
    | 'bulk_density'
    | 'cation_exchange_cap'
    | 'altitude'
    | 'NDVI_mean'
    | 'NDVI_std'
    | 'sampling_year'
  >,
  string
> = {
  nitrogen_total: 'Nitrogen (mg/kg) - Supports Leaf Growth',
  phosphorus_avail: 'Phosphorus (mg/kg) - Strengthens Roots & Fruit',
  potassium_exch: 'Potassium (cmol/kg) - Plant Strength',
  pH_water: 'Soil Acidity Level (pH) - 6-7 is Best',
  rainfall_annual: 'Annual Rainfall (mm) - Yearly Water',
  organic_carbon: 'Organic Carbon (%)',
  sand_percent: 'Sandy Content (%)',
  silt_percent: 'Silt Content (%)',
  clay_percent: 'Clay Content (%)',
  bulk_density: 'Soil Density (g/cm³) - Soil Compaction',
  cation_exchange_cap: 'Soil Nutrient Holding Capacity (CEC)',
  altitude: 'Land Height (m) - Above Sea Level',
  NDVI_mean: 'Green Vegetation Index (NDVI mean)',
  NDVI_std: 'Vegetation Variability (NDVI std)',
  sampling_year: 'Year Soil Was Tested',
};

const SOIL_NUMERIC_FIELDS = Object.keys(SOIL_FIELD_LABELS) as Array<keyof typeof SOIL_FIELD_LABELS>;

const selectClassName =
  'p-3 border-2 border-orange-200 rounded-lg text-gray-900 bg-white focus:bg-orange-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all text-base';

export default function SoilPredictorForm() {
  const [formData, setFormData] = useState<SoilFeaturesInput>({
    nitrogen_total: 2.8,
    phosphorus_avail: 52.0,
    potassium_exch: 1.1,
    pH_water: 6.4,
    rainfall_annual: 1150,
    organic_carbon: 1.9,
    sand_percent: 38,
    silt_percent: 37,
    clay_percent: 25,
    bulk_density: 1.28,
    cation_exchange_cap: 20.2,
    altitude: 390,
    NDVI_mean: 0.58,
    NDVI_std: 0.063,
    country: 'Kenya',
    landcover_class: 'Cropland',
    sampling_year: 2026,
    sampling_month: 6,
  });

  const [prediction, setPrediction] = useState<LandPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const totalTexture = formData.sand_percent + formData.silt_percent + formData.clay_percent;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sampling_month' || name === 'sampling_year' ? Number(value) : value,
    }));
  };

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server returned error code: ${response.status}`);
      }

      const data: LandPredictionResponse = await response.json();
      setPrediction(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected inference engine error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 font-sans">
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🌾</span>
            <h1 className="text-4xl font-bold">AfriAgri</h1>
          </div>
          <p className="text-orange-100 text-lg font-medium">Smart Farming Intelligence for African Soil & Crops</p>
          <p className="text-orange-100 text-sm mt-1">Know your soil. Grow the right crops. Increase your harvest.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-lg border border-orange-100">
            <h3 className="text-2xl font-bold text-orange-700 mb-6 flex items-center gap-2">
              <span>🌱</span> Your Soil Information
            </h3>

            <form onSubmit={runAnalysis} className="space-y-8">
              <div>
                <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4">
                  Farm &amp; Land Context
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleSelectChange}
                      className={selectClassName}
                    >
                      {COUNTRY_OPTIONS.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Land Cover Type</label>
                    <select
                      name="landcover_class"
                      value={formData.landcover_class}
                      onChange={handleSelectChange}
                      className={selectClassName}
                    >
                      {LANDCOVER_OPTIONS.map(landcover => (
                        <option key={landcover} value={landcover}>
                          {landcover}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Month Soil Was Tested</label>
                    <select
                      name="sampling_month"
                      value={formData.sampling_month}
                      onChange={handleSelectChange}
                      className={selectClassName}
                    >
                      {MONTH_OPTIONS.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4">
                  Soil Measurements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {SOIL_NUMERIC_FIELDS.map(key => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-2">{SOIL_FIELD_LABELS[key]}</label>
                      <input
                        type="number"
                        step="any"
                        name={key}
                        value={formData[key]}
                        onChange={handleNumberChange}
                        className={selectClassName}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {totalTexture !== 100 && (
                <div className="text-sm font-semibold text-amber-800 bg-amber-100 p-4 rounded-lg border-2 border-amber-300 shadow-md">
                  ⚠️ Soil texture (Sand + Silt + Clay) = <strong className="text-lg">{totalTexture}%</strong>
                  <p className="text-xs mt-1">Adjust to make them equal 100% for accurate results</p>
                </div>
              )}
              {totalTexture === 100 && (
                <div className="text-sm font-semibold text-green-800 bg-green-100 p-4 rounded-lg border-2 border-green-300 shadow-md">
                  ✓ Perfect! Soil texture is correct (100%)
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              >
                {loading ? '⏳ Analyzing Your Soil...' : '🔍 Analyze My Soil & Get Crop Recommendations'}
              </button>
            </form>

            {error && (
              <div className="mt-4 text-sm font-bold text-red-700 bg-red-100 border-2 border-red-300 p-4 rounded-lg">
                ⚠️ <strong>Error:</strong> {error}
                <p className="text-xs mt-2">Make sure the backend server is running on port 8000</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-orange-100 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-orange-700 mb-6 flex items-center gap-2">
                <span>📊</span> Your Results
              </h3>

              {!prediction && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-6xl mb-4">🌾</p>
                  <p className="text-lg font-semibold">Enter your soil information and click</p>
                  <p className="text-base">"Analyze My Soil" to see results</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12 text-orange-600 font-semibold">
                  <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg">Analyzing your soil...</p>
                  <p className="text-sm text-gray-500 mt-2">This usually takes 2-3 seconds</p>
                </div>
              )}

              {prediction && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-6 rounded-xl border-4 border-orange-600 shadow-lg transform hover:scale-105 transition-transform">
                    <p className="text-white text-sm font-bold mb-2">🌱 SOIL FERTILITY SCORE</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white">{prediction.fertility_score.toFixed(0)}</span>
                      <span className="text-2xl font-bold text-orange-100">/ 100</span>
                    </div>
                    <p className="text-orange-100 text-sm mt-3">
                      {prediction.fertility_score >= 65
                        ? 'High fertility (excellent soil quality)'
                        : prediction.fertility_score >= 40
                          ? 'Medium fertility (good with proper care)'
                          : 'Low fertility (soil needs improvement)'}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-5 rounded-xl border-2 border-orange-300 shadow-md">
                    <p className="text-orange-700 font-bold mb-2 text-sm">📍 YOUR SOIL TYPE</p>
                    <p className="text-2xl font-bold text-orange-900">{prediction.fertility_zone}</p>
                    <p className="text-gray-700 text-sm mt-2 leading-relaxed">{prediction.zone_description}</p>
                  </div>

                  <div className="bg-green-50 p-5 rounded-xl border-2 border-green-400 shadow-md">
                    <p className="text-green-700 font-bold mb-3 text-sm">🌾 TOP 5 BEST CROPS FOR YOUR LAND</p>
                    <div className="space-y-3">
                      {prediction.recommended_crops.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-lg capitalize">
                              {index + 1}. {item.crop}
                            </span>
                            <div className="flex flex-col items-end">
                              <div className="w-24 h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                  style={{ width: `${item.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-green-700 mt-1">
                                {(item.confidence * 100).toFixed(0)}% suitable
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
