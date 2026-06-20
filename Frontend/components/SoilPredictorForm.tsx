import React, { useState } from 'react';
import { SoilFeaturesInput, LandPredictionResponse } from '../types/agri';

// Human-readable labels mapped with exact agricultural scientific measurement metrics
const FEATURE_LABELS: Record<keyof SoilFeaturesInput, string> = {
  nitrogen_total: "Total Nitrogen (mg/kg)",
  phosphorus_avail: "Available Phosphorus (mg/kg)",
  potassium_exch: "Exchangeable Potassium (cmol/kg)",
  pH_water: "Soil pH Level",
  rainfall_annual: "Annual Rainfall depth (mm)",
  organic_carbon: "Organic Carbon (%)",
  sand_percent: "Sand Texture Composition (%)",
  silt_percent: "Silt Texture Composition (%)",
  clay_percent: "Clay Texture Composition (%)",
  bulk_density: "Soil Bulk Density (g/cm³)",
  cation_exchange_cap: "Cation Exchange Capacity (CEC)",
  altitude: "Elevation / Altitude (m)",
  NDVI_mean: "Mean NDVI Index Context"
};

export default function SoilPredictorForm() {
  // Set default baseline form numbers matching your dataset benchmarks
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
  });

  const [prediction, setPrediction] = useState<LandPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live soil texture composition checker
  const totalTexture = formData.sand_percent + formData.silt_percent + formData.clay_percent;

  // Update form inputs dynamically while handling type conversions
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-green-900 tracking-tight">
          AgriLand Predictive Intelligence System
        </h1>
        <p className="text-gray-600 mt-2">
          Analyze land metrics and match target cultivations via backend machine learning pipelines
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CONTROL INPUT METRICS FORM */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Land Feature Input Metrics</h3>
          
          <form onSubmit={runAnalysis} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((featureKey) => {
              const key = featureKey as keyof SoilFeaturesInput;
              return (
                <div key={key} className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {FEATURE_LABELS[key]}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="p-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              );
            })}
            
            {/* Texture composition validation warning */}
            {totalTexture !== 100 && (
              <div className="md:col-span-2 text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200 shadow-sm transition-all">
                ⚠️ Structural Alert: Soil texture attributes sum up to <strong className="font-bold">{totalTexture}%</strong>. For optimal machine learning model accuracy, adjust parameters until Sand + Silt + Clay equal exactly 100%.
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 mt-4 w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-md shadow-md transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing ML Pipeline Matrices...' : 'Execute Predictive Diagnostics'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
              ⚠️ Connection Error: {error}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ANALYTICAL METRICS OUTPUT DIAGNOSTICS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Diagnostic Reports</h3>
            
            {!prediction && !loading && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-2">🌱</p>
                <p className="text-sm">Submit geological data parameters to generate multi-track predictions.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-20 text-green-700 font-semibold animate-pulse">
                <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Querying core pipelines...
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                {/* Score Panel */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Continuous Fertility Assessment</span>
                  <div className="text-4xl font-black text-gray-800 mt-1">
                    {prediction.fertility_score.toFixed(1)} <span className="text-sm font-normal text-gray-500">/ 100</span>
                  </div>
                </div>

                {/* Zone Panel */}
                <div className="p-4 border border-gray-100 bg-gray-50 rounded-lg">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assigned Geo-Zoning Profile</span>
                  <div className="text-xl font-bold text-green-800 mt-0.5">{prediction.fertility_zone}</div>
                  <p className="text-sm text-gray-600 mt-1 italic leading-relaxed">{prediction.zone_description}</p>
                </div>

                {/* Recommendations List */}
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase block mb-2 tracking-wide">Recommended Target Cultivations</span>
                  <div className="space-y-2">
                    {prediction.recommended_crops.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-green-300 transition-colors">
                        <span className="font-bold text-gray-800 capitalize tracking-wide">{item.crop}</span>
                        <span className="text-xs font-mono font-bold bg-green-600 text-white px-2 py-1 rounded shadow-xs">
                          {(item.confidence * 100).toFixed(1)}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center font-mono">
            API Channel Status: Connected to Port 8000
          </div>
        </div>
        
      </div>
    </div>
  );
}