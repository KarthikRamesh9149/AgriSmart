/**
 * Soil Degradation Chart Component
 * Displays current soil health status with visual indicator
 */

function SoilDegradationChart({ landIntel }) {
  if (!landIntel?.current_status) {
    return null;
  }

  const status = landIntel.current_status.land_degradation_status || 'low';

  // Map status to color and score
  const statusMap = {
    'severe': { score: 20, color: '#ef4444', label: 'Severe', description: 'Immediate intervention needed' },
    'moderate': { score: 50, color: '#f59e0b', label: 'Moderate', description: 'Significant degradation detected' },
    'low': { score: 75, color: '#eab308', label: 'Low', description: 'Minor degradation present' },
    'good': { score: 95, color: '#22c55e', label: 'Good', description: 'Healthy soil conditions' }
  };

  const current = statusMap[status.toLowerCase()] || statusMap['low'];

  return (
    <div className="soil-degradation-chart">
      <h4 className="section-title">Soil Health Status</h4>

      <div className="degradation-gauge">
        {/* Visual gauge */}
        <div className="gauge-track">
          <div
            className="gauge-fill"
            style={{
              width: `${current.score}%`,
              backgroundColor: current.color,
              transition: 'width 0.6s ease-out'
            }}
          />
        </div>

        {/* Status badge */}
        <div className="status-badge" style={{ borderLeftColor: current.color }}>
          <span className="status-label">{current.label}</span>
          <span className="status-description">{current.description}</span>
        </div>
      </div>

      {/* Contributing factors */}
      <div className="degradation-factors">
        <div className="factor-item">
          <span className="factor-icon">💧</span>
          <div className="factor-content">
            <span className="factor-name">Water Impact</span>
            <span className="factor-value">
              {landIntel.current_status.current_crop_water_usage_liters_kg.toLocaleString()} L/kg
            </span>
          </div>
        </div>

        <div className="factor-item">
          <span className="factor-icon">🌱</span>
          <div className="factor-content">
            <span className="factor-name">Organic Carbon</span>
            <span className="factor-value">
              {(landIntel.geography?.organic_carbon_percent || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="factor-item">
          <span className="factor-icon">🧪</span>
          <div className="factor-content">
            <span className="factor-name">Soil pH</span>
            <span className="factor-value">{(landIntel.geography?.soil_ph || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoilDegradationChart;
