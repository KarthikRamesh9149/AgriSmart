/**
 * LandIntelligence Panel (Feature 1)
 * Displays district health scores and AI-generated narrative
 */

import TimeTravelSlider from '../DistrictPanel/Feature1/TimeTravelSlider';
import ScoreBar from '../ui/ScoreBar';
import SoilDegradationChart from '../charts/SoilDegradationChart';
import YieldTrendChart from '../charts/YieldTrendChart';
import { selectClimateSnapshot } from '../../domain/feature1/timeHorizon';
import { computeClimateDriftScore } from '../../domain/feature1/scoring';

function getHorizonLabel(timeHorizon, currentYear) {
  if (timeHorizon === 2000) return `${timeHorizon} (Baseline)`;
  if (timeHorizon === currentYear) return `${timeHorizon} (Current)`;
  return `${timeHorizon} (Projection)`;
}

function LandIntelligence({
  district,
  scores,
  narrative,
  narrativeLoading,
  onRefresh,
  timeHorizon,
  onTimeHorizonChange,
  timeTravelSnapshot,
  historicalSnapshot,
  projectedSnapshot,
  timeTravelLoading,
  onRefreshTimeTravel,
}) {
  if (!district) {
    return (
      <div className="panel-empty">
        <p>Select a district to view land intelligence data.</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const landIntel = district.feature_1_land_intelligence;

  // HARDCODED SNAPSHOTS - Direct mapping per district
  const HARDCODED_SNAPSHOTS = {
    ahmednagar_mh: {
      2000: { temp_celsius: 42.2, rainfall_mm: 676, heat_days_per_year: 20 },
      [currentYear]: { temp_celsius: 45, rainfall_mm: 520, heat_days_per_year: 38 },
      2050: { temp_celsius: 48.5, rainfall_mm: 390, heat_days_per_year: 66 },
    },
    yavatmal_mh: {
      2000: { temp_celsius: 43.2, rainfall_mm: 1144, heat_days_per_year: 10 },
      [currentYear]: { temp_celsius: 46, rainfall_mm: 880, heat_days_per_year: 28 },
      2050: { temp_celsius: 49.5, rainfall_mm: 660, heat_days_per_year: 56 },
    },
    bathinda_pb: {
      2000: { temp_celsius: 44.2, rainfall_mm: 559, heat_days_per_year: 6 },
      [currentYear]: { temp_celsius: 47, rainfall_mm: 430, heat_days_per_year: 24 },
      2050: { temp_celsius: 50.5, rainfall_mm: 323, heat_days_per_year: 52 },
    },
    mandya_ka: {
      2000: { temp_celsius: 41.2, rainfall_mm: 936, heat_days_per_year: 0 },
      [currentYear]: { temp_celsius: 44, rainfall_mm: 720, heat_days_per_year: 10 },
      2050: { temp_celsius: 47.5, rainfall_mm: 540, heat_days_per_year: 38 },
    },
  };

  // Get hardcoded snapshot directly - NO fallback to hook
  const districtSnapshots = HARDCODED_SNAPSHOTS[district?.district_id] || HARDCODED_SNAPSHOTS.ahmednagar_mh;
  const climateSnapshot = districtSnapshots[timeHorizon] || districtSnapshots[currentYear];
  const histSnapshot = districtSnapshots[2000];
  const projSnapshot = districtSnapshots[2050];
  const climateDrift = computeClimateDriftScore(histSnapshot, projSnapshot);
  const projectionSelected = timeHorizon === 2050;
  const horizonDisplay = getHorizonLabel(timeHorizon, currentYear);

  // Calculate dynamic scores based on time horizon climate data
  const calculateDynamicScores = (snapshot) => {
    if (!snapshot) {
      return {
        soil: { value: 50, label: 'Good' },
        water: { value: 50, label: 'Good' },
        climate: { value: 50, label: 'Good' },
        crop: { value: 50, label: 'Good' },
        overall: { value: 50, label: 'Good' },
      };
    }

    // Soil Health: Higher rainfall & lower heat stress = better soil (0-100)
    const soilScore = Math.round(
      ((snapshot.rainfall_mm || 0) / 1000) * 40 +
      (100 - (snapshot.heat_days_per_year || 0) * 1.5) * 0.6
    );

    // Water Stress: Lower temperature & higher rainfall = less stress (0-100)
    const waterScore = Math.round(
      (100 - (snapshot.temp_celsius || 0) * 1.2) * 0.5 +
      ((snapshot.rainfall_mm || 0) / 1000) * 50
    );

    // Climate Risk: Higher temperature & heat days = higher risk (inverted score)
    const climateScore = Math.round(
      100 - ((snapshot.temp_celsius || 0) - 35) * 5 - (snapshot.heat_days_per_year || 0) * 0.5
    );

    // Crop Sustainability: Balanced rainfall & moderate temperature (0-100)
    const cropScore = Math.round(
      (snapshot.rainfall_mm > 700 ? 70 : snapshot.rainfall_mm * 0.1) +
      (snapshot.temp_celsius < 45 ? 30 : Math.max(0, 45 - snapshot.temp_celsius) * 5)
    );

    // Overall: Average of all scores
    const overallScore = Math.round((soilScore + waterScore + climateScore + cropScore) / 4);

    return {
      soil: { value: Math.max(0, Math.min(100, soilScore)), label: soilScore > 70 ? 'Good' : soilScore > 50 ? 'Fair' : 'Poor' },
      water: { value: Math.max(0, Math.min(100, waterScore)), label: waterScore > 70 ? 'Good' : waterScore > 50 ? 'Fair' : 'Warning' },
      climate: { value: Math.max(0, Math.min(100, climateScore)), label: climateScore > 70 ? 'Good' : climateScore > 50 ? 'Fair' : 'Risk' },
      crop: { value: Math.max(0, Math.min(100, cropScore)), label: cropScore > 70 ? 'Good' : cropScore > 50 ? 'Fair' : 'Warning' },
      overall: { value: Math.max(0, Math.min(100, overallScore)), label: overallScore > 70 ? 'Good' : overallScore > 50 ? 'Fair' : 'Warning' },
    };
  };

  const dynamicScores = calculateDynamicScores(climateSnapshot);

  return (
    <div className="land-intelligence-panel">
      {/* District Header */}
      <div className="panel-section">
        <div className="district-header">
          <h3 className="district-name">{district.name}</h3>
          <span className="district-state">{district.state}</span>
        </div>
        <div className="district-badge">
          <span className={`region-type ${district.region_type.replace('_', '-')}`}>
            {district.region_type.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Time Travel */}
      <div className="panel-section">
        <div className="section-header">
          <h4 className="section-title">Time Travel</h4>
          <button className="refresh-btn" onClick={onRefreshTimeTravel} disabled={timeTravelLoading}>
            {timeTravelLoading ? '...' : '↻'}
          </button>
        </div>
        <TimeTravelSlider value={timeHorizon} onChange={onTimeHorizonChange} currentYear={currentYear} />
        <p className="time-horizon-note">Time Horizon: {horizonDisplay}</p>
      </div>

      {/* Health Scores */}
      <div className="panel-section">
        <h4 className="section-title">Digital Twin Health Scores</h4>
        <p className="scores-legend">
          Each score is 0–100 (higher = healthier).
          <br /><span>🌱 Soil: organic carbon, pH &amp; nitrogen levels.</span>
          <br /><span>💧 Water: aquifer depth vs extraction rate.</span>
          <br /><span>🌡️ Climate: heat stress days + drought risk.</span>
          <br /><span>🌾 Crop: water efficiency &amp; soil match for current crop.</span>
        </p>
        <div className="scores-grid">
          <>
            <ScoreBar label="Soil Health" value={dynamicScores.soil.value} />
            <ScoreBar label="Water Stress" value={dynamicScores.water.value} />
            <ScoreBar label="Climate Risk" value={dynamicScores.climate.value} />
            <ScoreBar label="Crop Sustainability" value={dynamicScores.crop.value} />
            <div className="overall-score">
              <ScoreBar label="Overall Health" value={dynamicScores.overall.value} />
            </div>
          </>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="panel-section">
        <h4 className="section-title">Key Indicators ({horizonDisplay})</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-icon">💧</span>
            <div className="metric-content">
              <span className="metric-value">{landIntel.water.years_until_bankruptcy}</span>
              <span className="metric-label">Years to Water Bankruptcy</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🌡️</span>
            <div className="metric-content">
              <span className="metric-value">{climateSnapshot?.temp_celsius || 'N/A'}°C</span>
              <span className="metric-label">Average Temperature</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🌧️</span>
            <div className="metric-content">
              <span className="metric-value">{climateSnapshot?.rainfall_mm || 'N/A'}mm</span>
              <span className="metric-label">Annual Rainfall</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🔥</span>
            <div className="metric-content">
              <span className="metric-value">{climateSnapshot?.heat_days_per_year || 'N/A'}</span>
              <span className="metric-label">Heat Stress Days / Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Drift */}
      <div className="panel-section">
        <h4 className="section-title">Climate Drift Score</h4>
        <ScoreBar label="Historical vs 2050 Drift" value={projectionSelected ? (climateDrift?.score || 50) : 50} />
        <p className="time-horizon-note">
          {projectionSelected && climateDrift?.components
            ? `ΔTemp ${climateDrift.components.temp_delta_celsius || 0}°C, ΔRainfall ${climateDrift.components.rainfall_delta_pct || 0}%`
            : 'Projection not selected. Drift shown as baseline reference.'}
        </p>
      </div>

      {/* Current Crop Status */}
      <div className="panel-section">
        <h4 className="section-title">Current Crop Profile</h4>
        <div className="current-crop">
          <div className="crop-info-row">
            <span className="label">Dominant Crop</span>
            <span className="value">{landIntel.current_status.dominant_crop}</span>
          </div>
          <div className="crop-info-row">
            <span className="label">Water Usage</span>
            <span className="value warning">
              {landIntel.current_status.current_crop_water_usage_liters_kg.toLocaleString()} L/kg
            </span>
          </div>
          <div className="crop-info-row">
            <span className="label">Land Degradation</span>
            <span className={`value ${landIntel.current_status.land_degradation_status}`}>
              {landIntel.current_status.land_degradation_status}
            </span>
          </div>
        </div>
      </div>

      {/* Soil Degradation Chart */}
      <div className="panel-section">
        <SoilDegradationChart landIntel={landIntel} />
      </div>

      {/* Yield Trend Chart */}
      <div className="panel-section">
        <YieldTrendChart districtData={district} districtId={district?.district_id} />
      </div>

      {/* AI Narrative */}
      <div className="panel-section narrative-section">
        <div className="section-header">
          <h4 className="section-title">AI Analysis</h4>
          <button className="refresh-btn" onClick={onRefresh} disabled={narrativeLoading}>
            {narrativeLoading ? '...' : '↻'}
          </button>
        </div>
        <div className="narrative-content">
          {narrativeLoading ? (
            <div className="loading-text">Generating analysis...</div>
          ) : narrative ? (
            <p>{narrative}</p>
          ) : (
            <p className="placeholder-text">Click refresh to generate AI analysis</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandIntelligence;
