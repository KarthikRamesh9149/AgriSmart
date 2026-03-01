/**
 * PolicyModal Component
 * Full-screen modal showing agricultural policy analysis with dual panels:
 * Left: Government's subsidised strategy, Right: AI-recommended strategy
 * Includes soil degradation comparison and bar chart
 */

function PolicyModal({
  isOpen,
  onClose,
  districtId,
  districtData,
  cropRecommendations,
  cabinetBrief,
  redFlags,
  arbitrage,
  structuredRows,
  fileName,
  parseMeta,
  validRows,
}) {
  if (!isOpen) return null;

  // Extract government's subsidised crop from CSV (use highest-budget crop as main gov strategy)
  const govCrop = (() => {
    const rows = (structuredRows?.length > 0 ? structuredRows : validRows) || [];
    if (rows.length === 0) return 'Unknown';

    // Sum budgets per crop to find which crop gets the most subsidy
    const budgetByCrop = {};
    rows.forEach((row) => {
      const c = (row.crop || row.Crop || '').trim();
      const b = Number(row.budget_amount_inr_lakh || row.budget_amount_inr || row.budget_amount || 0);
      if (c) budgetByCrop[c] = (budgetByCrop[c] || 0) + b;
    });

    // Return crop with highest total budget
    const sorted = Object.entries(budgetByCrop).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'Unknown';
  })();

  // Extract AI-recommended crop from cropRecommendations
  const aiCropData =
    cropRecommendations && cropRecommendations.top_crops && cropRecommendations.top_crops.length > 0
      ? cropRecommendations.top_crops[0]
      : null;
  const aiCrop = aiCropData ? aiCropData.name : 'Not available';

  // Get soil degradation status from districtData
  const soilDegradationStatus = districtData?.feature_1_land_intelligence?.current_status?.land_degradation_status || 'Unknown';
  const govCropWater = districtData?.feature_1_land_intelligence?.current_status?.current_crop_water_usage_liters_kg || 0;
  const aiCropWater = aiCropData?.agronomy?.water_liters_per_kg || 0;

  // Calculate scores for graph (0-100 scale)
  const getSoilImpactScore = (degradation, hasNitrogenFixation, droughtTolerance) => {
    let score = 50; // baseline
    if (degradation.toLowerCase() === 'severe') score = 20;
    else if (degradation.toLowerCase() === 'moderate') score = 40;
    else if (degradation.toLowerCase() === 'low') score = 70;
    else if (degradation.toLowerCase() === 'good') score = 90;

    if (hasNitrogenFixation) score += 20;
    if (droughtTolerance > 0.7) score += 10;
    return Math.min(100, score);
  };

  const getWaterEfficiencyScore = (waterLitersPerKg) => {
    // Lower water usage = higher score
    // 0 L/kg = 100, 22000+ L/kg = 0
    return Math.max(0, Math.min(100, ((22000 - waterLitersPerKg) / 22000) * 100));
  };

  const getProfitBandScore = (profitBand) => {
    // profitBand is 1-5
    return (profitBand / 5) * 100;
  };

  // Government crop scores (using current districtData)
  const govSoilScore = getSoilImpactScore(soilDegradationStatus, false, 0);
  const govWaterScore = getWaterEfficiencyScore(govCropWater);
  const govProfitScore = 60; // placeholder since we don't have exact profit band for gov crop

  // AI crop scores
  const aiSoilScore = getSoilImpactScore(soilDegradationStatus, aiCropData?.agronomy?.nitrogen_fixation || false, aiCropData?.agronomy?.drought_tolerance || 0);
  const aiWaterScore = getWaterEfficiencyScore(aiCropWater);
  const aiProfitScore = aiCropData ? getProfitBandScore(aiCropData.economics?.profit_band || 1) : 0;

  // Soil improvement statement
  const getSoilImprovementStatement = () => {
    if (!aiCropData) return 'AI crop recommendation not available.';

    if (aiCropData.agronomy?.nitrogen_fixation) {
      return 'Switching to this crop enables biological nitrogen fixation, which can recover organic carbon by +0.1–0.3% over 3 seasons, reversing soil degradation.';
    }
    if (aiCropData.agronomy?.drought_tolerance > 0.7) {
      return 'Lower water demand reduces aquifer stress and soil compaction over time, supporting long-term soil health.';
    }
    return 'Reduced input costs improve farmer margins; direct soil impact is neutral.';
  };

  const exportPdf = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('policy-modal-export');
      if (!element) return;

      const date = new Date().toISOString().split('T')[0];
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `policy-analysis-${districtId || 'analysis'}-${date}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <div className="policy-modal-overlay">
      <div className="policy-modal">
        {/* Modal Header */}
        <div className="policy-modal-header">
          <h2 className="policy-modal-title">🌾 Agricultural Policy Analysis</h2>
          <button className="policy-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Dual Panel Section */}
        <div className="policy-dual-panel">
          {/* Left Panel: Government Strategy */}
          <div className="policy-panel-gov">
            <div className="policy-panel-title gov-title">Government's Strategy</div>
            <div className="policy-panel-subtitle">(from your CSV)</div>

            <div className="policy-strategy-content">
              <div className="strategy-crop">
                <span className="label">Current Crop:</span>
                <span className="value">{govCrop}</span>
              </div>

              <div className="strategy-consequences">
                <div className="consequence-label">⚠ Consequences:</div>
                <ul className="consequence-list">
                  <li>
                    <span className="consequence-icon">💧</span>
                    <span>Water: {govCropWater.toLocaleString()} L/kg</span>
                  </li>
                  <li>
                    <span className="consequence-icon">🌱</span>
                    <span>Soil: {soilDegradationStatus} degradation</span>
                  </li>
                  {districtData?.feature_1_land_intelligence?.water?.aquifer_status === 'overexploited' && (
                    <li>
                      <span className="consequence-icon">⚡</span>
                      <span>Aquifer at risk (overexploited)</span>
                    </li>
                  )}
                </ul>
              </div>

              {redFlags && redFlags.length > 0 && (
                <div className="strategy-flags">
                  <div className="flags-label">Red Flags from CSV:</div>
                  <div className="flags-badges">
                    {redFlags.slice(0, 3).map((flag, i) => (
                      <span key={i} className={`flag-badge ${flag.severity.toLowerCase()}`}>
                        {flag.severity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: AI Strategy */}
          <div className="policy-panel-ai">
            <div className="policy-panel-title ai-title">AI Strategy</div>
            <div className="policy-panel-subtitle">(Mistral-recommended)</div>

            <div className="policy-strategy-content">
              <div className="strategy-crop">
                <span className="label">Recommended Crop:</span>
                <span className="value">{aiCrop}</span>
              </div>

              {aiCropData && (
                <div className="strategy-benefits">
                  <div className="benefit-icon">✅</div>
                  <div className="benefit-text">+{cropRecommendations?.economic_comparison?.savings?.income_increase_pct || 62}% income potential</div>
                </div>
              )}

              <div className="strategy-consequences">
                <div className="consequence-label">✅ Consequences:</div>
                <ul className="consequence-list">
                  <li>
                    <span className="consequence-icon">💧</span>
                    <span>Water: {aiCropWater.toLocaleString()} L/kg</span>
                  </li>
                  <li>
                    <span className="consequence-icon">🌱</span>
                    <span>
                      {aiCropData?.agronomy?.nitrogen_fixation ? 'Nitrogen fixation' : 'Climate-resilient growth'}
                    </span>
                  </li>
                  <li>
                    <span className="consequence-icon">🏜️</span>
                    <span>Drought tolerance: {(aiCropData?.agronomy?.drought_tolerance || 0).toFixed(2)}</span>
                  </li>
                </ul>
              </div>

              <div className="strategy-why">
                <div className="why-label">Why AI suggests this:</div>
                <p className="why-text">{cabinetBrief.substring(0, 200)}...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Soil Degradation Section */}
        <div className="policy-soil-section">
          <h3 className="soil-section-title">🌍 Soil Degradation Status</h3>
          <div className="soil-details">
            <div className="soil-stat">
              <span className="soil-label">Current Status:</span>
              <span className="soil-value">{soilDegradationStatus}</span>
            </div>
            <div className="soil-stat">
              <span className="soil-label">Primary Driver:</span>
              <span className="soil-value">High water extraction + monoculture</span>
            </div>
            <div className="soil-stat">
              <span className="soil-label">Recovery Timeline:</span>
              <span className="soil-value">3-5 seasons with sustainable crops</span>
            </div>
          </div>
        </div>

        {/* Soil Health Comparison Graph */}
        <div className="policy-graph-section">
          <h3 className="graph-title">📊 Soil Health Comparison</h3>

          <div className="graph-metric">
            <div className="graph-metric-label">Soil Impact Score</div>
            <div className="graph-bars">
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill gov-fill" style={{ width: `${govSoilScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">Gov</span>
                  <span className="bar-value">{Math.round(govSoilScore)}</span>
                </div>
              </div>
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill ai-fill" style={{ width: `${aiSoilScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">AI</span>
                  <span className="bar-value">{Math.round(aiSoilScore)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="graph-metric">
            <div className="graph-metric-label">Water Efficiency</div>
            <div className="graph-bars">
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill gov-fill" style={{ width: `${govWaterScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">Gov</span>
                  <span className="bar-value">{Math.round(govWaterScore)}</span>
                </div>
              </div>
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill ai-fill" style={{ width: `${aiWaterScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">AI</span>
                  <span className="bar-value">{Math.round(aiWaterScore)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="graph-metric">
            <div className="graph-metric-label">Profit Potential</div>
            <div className="graph-bars">
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill gov-fill" style={{ width: `${govProfitScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">Gov</span>
                  <span className="bar-value">{Math.round(govProfitScore)}</span>
                </div>
              </div>
              <div className="graph-bar">
                <div className="graph-bar-track">
                  <div className="graph-bar-fill ai-fill" style={{ width: `${aiProfitScore}%` }}></div>
                </div>
                <div className="graph-bar-values">
                  <span className="bar-label">AI</span>
                  <span className="bar-value">{Math.round(aiProfitScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Soil Improvement Statement */}
          <div className="soil-statement">
            <span className="statement-icon">🌱</span>
            <div className="statement-text">{getSoilImprovementStatement()}</div>
          </div>
        </div>

        {/* Bottom spacer so graphs scroll fully into view */}
        <div style={{ height: 40, flexShrink: 0 }} />
        </div>
        {/* End Scrollable Content */}

        {/* Modal Footer with Actions */}
        <div className="policy-modal-footer">
          <button className="modal-btn export-btn" onClick={exportPdf}>
            📥 Export to PDF
          </button>
          <button className="modal-btn close-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Hidden export element */}
        <div id="policy-modal-export" className="pdf-export-container" style={{ display: 'none' }}>
          <h1>Agricultural Policy Analysis</h1>
          <p>
            File: {fileName} | Rows: {validRows.length} | Generated: {new Date().toLocaleDateString()}
          </p>
          <h2>Government Strategy</h2>
          <p>Crop: {govCrop}</p>
          <p>Water Usage: {govCropWater} L/kg</p>
          <p>Soil Status: {soilDegradationStatus}</p>
          <h2>AI-Recommended Strategy</h2>
          <p>Crop: {aiCrop}</p>
          <p>Water Usage: {aiCropWater} L/kg</p>
          <h2>Analysis</h2>
          <p>{cabinetBrief}</p>
        </div>
      </div>
    </div>
  );
}

export default PolicyModal;
