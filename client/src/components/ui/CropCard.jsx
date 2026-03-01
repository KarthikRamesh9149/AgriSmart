/**
 * CropCard Component
 * Displays a crop recommendation with match score and key stats
 */

import ScoreBar from './ScoreBar';

function CropCard({ crop, rank, isExpanded = false, onToggle }) {
  const { name, local_name, match_score, score_breakdown, agronomy, economics, companion } = crop;

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // Color code based on sustainability threshold (60 pts min)
  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--accent-green)';
    if (score >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className={`crop-card ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="crop-card-header">
        <div className="crop-card-rank">{getMedalEmoji(rank)}</div>
        <div className="crop-card-info">
          <div className="crop-card-name">{name}</div>
          <div className="crop-card-local">{local_name}</div>
        </div>
        <div className="crop-card-score">
          <span className="score-value" style={{ color: getScoreColor(match_score) }}>
            {match_score}
          </span>
          <span className="score-label">Match</span>
        </div>
      </div>

      <div className="crop-card-bar">
        <ScoreBar value={match_score} showValue={false} size="small" />
      </div>

      {isExpanded && (
        <div className="crop-card-details">
          <div className="crop-card-breakdown">
            <div className="breakdown-title">Score Breakdown</div>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="breakdown-label">Water Efficiency</span>
                <span className="breakdown-value">{score_breakdown.water_efficiency} pts</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Profit Potential</span>
                <span className="breakdown-value">{score_breakdown.profit} pts</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Soil Match</span>
                <span className="breakdown-value">{score_breakdown.soil_match} pts</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Drought Tolerance</span>
                <span className="breakdown-value">{score_breakdown.drought} pts</span>
              </div>
              <div className="breakdown-item sustainability-threshold">
                <span className="breakdown-label">Min. for sustainability</span>
                <span className="breakdown-value">60 pts</span>
              </div>
            </div>
          </div>

          <div className="crop-card-stats">
            <div className="stat-item">
              <span className="stat-icon">💧</span>
              <span className="stat-value">{agronomy.water_liters_per_kg.toLocaleString()}</span>
              <span className="stat-label">L/kg</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🌡️</span>
              <span className="stat-value">{agronomy.temp_max_survival_c}°C</span>
              <span className="stat-label">max</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-value">Band {economics.profit_band}</span>
              <span className="stat-label">profit</span>
            </div>
            {agronomy.nitrogen_fixation && (
              <div className="stat-item nitrogen-badge">
                <span className="stat-icon">🌱</span>
                <span className="stat-value">N₂ Fixer</span>
              </div>
            )}
          </div>

          <div className="crop-card-companion">
            <span className="companion-label">Best paired with:</span>
            <span className="companion-value">
              {companion.best_companion_crop_id} ({companion.intercropping_ratio})
            </span>
          </div>
        </div>
      )}

      <div className="crop-card-expand-hint">
        {isExpanded ? 'Click to collapse' : 'Click for details'}
      </div>
    </div>
  );
}

export default CropCard;
