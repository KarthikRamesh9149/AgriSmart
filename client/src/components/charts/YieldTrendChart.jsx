/**
 * Yield Trend Chart Component
 * Displays 5-year yield trend with visual indicators
 */

const DISTRICT_YIELD_DATA = {
  ahmednagar_mh: {
    five_year_trend: 'down',
    baseline_yield_kg_per_hectare: 5800,
    current_yield_kg_per_hectare: 4600,
  },
  yavatmal_mh: {
    five_year_trend: 'down',
    baseline_yield_kg_per_hectare: 5200,
    current_yield_kg_per_hectare: 4400,
  },
  bathinda_pb: {
    five_year_trend: 'stable',
    baseline_yield_kg_per_hectare: 8400,
    current_yield_kg_per_hectare: 8200,
  },
  mandya_ka: {
    five_year_trend: 'up',
    baseline_yield_kg_per_hectare: 6200,
    current_yield_kg_per_hectare: 7800,
  },
};

function YieldTrendChart({ districtData, districtId }) {
  if (!districtData?.feature_1_land_intelligence) {
    return null;
  }

  // Use hardcoded district data if yield_info not available
  const yieldInfo = districtData.feature_1_land_intelligence.yield_info
    || DISTRICT_YIELD_DATA[districtId]
    || {
        five_year_trend: 'stable',
        baseline_yield_kg_per_hectare: 5200,
        current_yield_kg_per_hectare: 5200
      };

  const trend = yieldInfo.five_year_trend || 'stable';
  const baseline = yieldInfo.baseline_yield_kg_per_hectare || 5200;
  const currentYield = yieldInfo.current_yield_kg_per_hectare || baseline;

  // Calculate trend direction and percentage
  const trendPercentage = baseline > 0 ? ((currentYield - baseline) / baseline) * 100 : 0;

  // Map trend to visual representation
  const trendMap = {
    'up': { icon: '📈', label: 'Increasing', color: '#22c55e', description: 'Yield improving over time' },
    'down': { icon: '📉', label: 'Declining', color: '#ef4444', description: 'Yield declining - intervention needed' },
    'stable': { icon: '➡️', label: 'Stable', color: '#3b82f6', description: 'Steady yield production' }
  };

  const trendInfo = trendMap[trend] || trendMap['stable'];

  // Generate simple 5-year data points
  const generateTrendPoints = () => {
    const years = 5;
    const points = [];

    for (let i = 0; i < years; i++) {
      const year = new Date().getFullYear() - (years - 1 - i);

      if (trend === 'up') {
        const value = baseline + ((currentYield - baseline) * (i / (years - 1)));
        points.push({ year, value });
      } else if (trend === 'down') {
        const value = baseline - ((baseline - currentYield) * (i / (years - 1)));
        points.push({ year, value });
      } else {
        points.push({ year, value: baseline });
      }
    }

    return points;
  };

  const trendPoints = generateTrendPoints();
  const maxValue = Math.max(...trendPoints.map(p => p.value), baseline, currentYield);
  const minValue = Math.min(...trendPoints.map(p => p.value), baseline, currentYield);
  const range = maxValue - minValue || 1;

  return (
    <div className="yield-trend-chart">
      <h4 className="section-title">5-Year Yield Trend</h4>

      {/* Trend Summary */}
      <div className="trend-summary" style={{ borderLeftColor: trendInfo.color }}>
        <span className="trend-icon">{trendInfo.icon}</span>
        <div className="trend-info">
          <span className="trend-label">{trendInfo.label}</span>
          <span className="trend-description">{trendInfo.description}</span>
          {Math.abs(trendPercentage) > 0.1 && (
            <span className="trend-change" style={{ color: trendPercentage > 0 ? '#22c55e' : '#ef4444' }}>
              {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="trend-chart-container">
        <div className="trend-chart">
          <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="var(--border-default)" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="var(--border-default)" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="90" x2="400" y2="90" stroke="var(--border-default)" strokeWidth="1" opacity="0.5" />

            {/* Trend line */}
            <polyline
              points={trendPoints
                .map((p, i) => {
                  const x = (i / (trendPoints.length - 1)) * 380 + 10;
                  const normalizedValue = (p.value - minValue) / range;
                  const y = 100 - normalizedValue * 80;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={trendInfo.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {trendPoints.map((p, i) => {
              const x = (i / (trendPoints.length - 1)) * 380 + 10;
              const normalizedValue = (p.value - minValue) / range;
              const y = 100 - normalizedValue * 80;

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={trendInfo.color}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Year labels */}
        <div className="trend-labels">
          {trendPoints.map((p, i) => (
            <span key={i} className="year-label">
              {p.year}
            </span>
          ))}
        </div>
      </div>

      {/* Yield metrics */}
      <div className="yield-metrics">
        <div className="metric-item">
          <span className="metric-label">Baseline Yield</span>
          <span className="metric-value">{baseline.toLocaleString()} kg/ha</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Current Yield</span>
          <span className="metric-value">{currentYield.toLocaleString()} kg/ha</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Change</span>
          <span className="metric-value" style={{ color: trendPercentage > 0 ? '#22c55e' : '#ef4444' }}>
            {trendPercentage > 0 ? '+' : ''}{(currentYield - baseline).toLocaleString()} kg/ha
          </span>
        </div>
      </div>
    </div>
  );
}

export default YieldTrendChart;
