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
  // IMPORTANT: Always use timeTravelSnapshot for the CURRENT timeHorizon from the hook
  // If hook doesn't have it, fall back to local stub (this ensures different values per year)
  const climateSnapshot = timeTravelSnapshot || selectClimateSnapshot(district, timeHorizon, currentYear);
  const histSnapshot = historicalSnapshot || selectClimateSnapshot(district, 2000, currentYear);
  const projSnapshot = projectedSnapshot || selectClimateSnapshot(district, 2050, currentYear);
  const climateDrift = computeClimateDriftScore(histSnapshot, projSnapshot);
  const projectionSelected = timeHorizon === 2050;
  const horizonDisplay = getHorizonLabel(timeHorizon, currentYear);

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
          {scores && (
            <>
              <ScoreBar label="Soil Health" value={scores.soil?.value || 0} />
              <ScoreBar label="Water Stress" value={scores.water?.value || 0} />
              <ScoreBar label="Climate Risk" value={scores.climate?.value || 0} />
              <ScoreBar label="Crop Sustainability" value={scores.crop?.value || 0} />
              <div className="overall-score">
                <ScoreBar label="Overall Health" value={scores.overall?.value || 0} />
              </div>
            </>
          )}
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
