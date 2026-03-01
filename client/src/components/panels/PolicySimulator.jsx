/**
 * PolicySimulator Panel (Feature 3)
 * Upload CSV/XLSX -> optional deterministic checks -> freeform LLM brief -> PDF
 */

import { useState, useRef, useCallback } from 'react';
import { parseAndValidatePolicyFile } from '../../utils/policyParser';
import { detectRedFlags } from '../../domain/policyRedFlags';
import { calculateArbitrage } from '../../domain/policyArbitrage';
import {
  generate3YearRoadmap,
  calculatePoliticalFeasibility,
} from '../../domain/policyRoadmap';
import PolicyModal from './PolicyModal';

const USE_REAL_API = true;

const STRUCTURED_COLUMNS = [
  'district_id',
  'crop',
  'budget_amount_inr_lakh',
  'subsidy_type',
  'target_area_hectares',
];

function toStructuredPolicyRows(rows) {
  return rows
    .filter((row) => STRUCTURED_COLUMNS.every((column) => Object.hasOwn(row, column)))
    .map((row) => ({
      district_id: String(row.district_id || '').trim(),
      crop: String(row.crop || '').trim(),
      budget_amount_inr_lakh: Number(row.budget_amount_inr_lakh),
      subsidy_type: String(row.subsidy_type || '').trim(),
      target_area_hectares: Number(row.target_area_hectares),
    }))
    .filter(
      (row) =>
        row.district_id &&
        row.crop &&
        Number.isFinite(row.budget_amount_inr_lakh) &&
        Number.isFinite(row.target_area_hectares)
    );
}

function PolicySimulator({ districtId, districtData, cropRecommendations }) {
  const fileInputRef = useRef(null);

  // State
  const [fileName, setFileName] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [structuredRows, setStructuredRows] = useState([]);
  const [parseMeta, setParseMeta] = useState({ headers: [], csvText: '', rowCount: 0 });
  const [validationErrors, setValidationErrors] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [arbitrage, setArbitrage] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [feasibility, setFeasibility] = useState(null);
  const [cabinetBrief, setCabinetBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Cached data
  const [cropsDb, setCropsDb] = useState(null);
  const [districtsMap, setDistrictsMap] = useState(null);

  const hasStructuredRows = structuredRows.length > 0;

  /**
   * Load crops database and district data
   */
  const loadReferenceData = useCallback(async () => {
    if (cropsDb && districtsMap) return { cropsDb, districtsMap };

    const [cropsRes, ...districtResArr] = await Promise.all([
      fetch('/data/crops_database.json'),
      fetch('/districts/ahmednagar_mh.json'),
      fetch('/districts/yavatmal_mh.json'),
      fetch('/districts/bathinda_pb.json'),
      fetch('/districts/mandya_ka.json'),
    ]);

    const crops = await cropsRes.json();
    const districts = await Promise.all(districtResArr.map((r) => r.json()));
    const distMap = {
      ahmednagar_mh: districts[0],
      yavatmal_mh: districts[1],
      bathinda_pb: districts[2],
      mandya_ka: districts[3],
    };

    setCropsDb(crops);
    setDistrictsMap(distMap);
    return { cropsDb: crops, districtsMap: distMap };
  }, [cropsDb, districtsMap]);

  /**
   * Handle file upload
   */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setProcessing(true);
    setCabinetBrief('');

    try {
      const { valid, errors, meta } = await parseAndValidatePolicyFile(file);
      const normalizedStructuredRows = toStructuredPolicyRows(valid);

      setValidRows(valid);
      setStructuredRows(normalizedStructuredRows);
      setParseMeta(meta);
      setValidationErrors(errors);

      if (valid.length === 0) {
        setRedFlags([]);
        setArbitrage([]);
        setRoadmap(null);
        setFeasibility(null);
        return;
      }

      if (normalizedStructuredRows.length === 0) {
        // Dynamic schema: skip deterministic rules and rely on LLM section
        setRedFlags([]);
        setArbitrage([]);
        setRoadmap(null);
        setFeasibility(null);
        return;
      }

      // Deterministic analysis for compatible schemas
      const refData = await loadReferenceData();

      const flags = detectRedFlags(normalizedStructuredRows, refData.cropsDb, refData.districtsMap);
      setRedFlags(flags);

      const arb = calculateArbitrage(normalizedStructuredRows, refData.cropsDb, refData.districtsMap);
      setArbitrage(arb);

      const rm = generate3YearRoadmap(normalizedStructuredRows);
      setRoadmap(rm);

      const shiftedBudget = arb.reduce((sum, a) => sum + a.budget_inr_lakh, 0);
      const totalBudget = normalizedStructuredRows.reduce(
        (sum, r) => sum + r.budget_amount_inr_lakh,
        0
      );
      const hasCriticalNoAlt =
        flags.some((f) => f.severity === 'CRITICAL') && arb.some((a) => a.feasibility === 'low');

      const feas = calculatePoliticalFeasibility(
        normalizedStructuredRows,
        flags,
        shiftedBudget,
        totalBudget,
        hasCriticalNoAlt
      );
      setFeasibility(feas);
    } catch (err) {
      console.error('Policy analysis error:', err);
      setValidationErrors([{ row: 0, message: `File processing error: ${err.message}` }]);
    } finally {
      setProcessing(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Generate cabinet brief from LLM using whole CSV (dynamic schema supported)
   */
  const generateBrief = async () => {
    if (validRows.length === 0) {
      alert('Please upload and parse a CSV file first.');
      return;
    }

    const targetDistrict = districtId || structuredRows[0]?.district_id || null;

    setBriefLoading(true);
    try {
      if (USE_REAL_API) {
        console.log('Generating brief via /api/llm/policy-freeform with', {
          district_id: targetDistrict,
          file_name: fileName,
          row_count: parseMeta.rowCount,
        });

        const res = await fetch('/api/llm/policy-freeform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district_id: targetDistrict,
            file_name: fileName,
            csv_text: parseMeta.csvText,
            headers: parseMeta.headers,
            row_count: parseMeta.rowCount,
            mode: 'analyze',
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('Brief response:', data);
        const briefText = data.analysis || data.cabinet_brief || data.narrative || '';
        setCabinetBrief(briefText);
        if (briefText) setShowModal(true);
      } else {
        const stubBrief = generateStubBrief({
          districtId: targetDistrict,
          rows: validRows,
          headers: parseMeta.headers,
        });
        setCabinetBrief(stubBrief);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Brief generation error:', err);
      const errorMsg = `Error: ${err.message || 'Failed to generate brief. Please check console.'}`;
      setCabinetBrief(errorMsg);
    } finally {
      setBriefLoading(false);
    }
  };

  /**
   * Polish cabinet brief via LLM
   */
  const polishBrief = async () => {
    if (!cabinetBrief) return;

    const targetDistrict = districtId || structuredRows[0]?.district_id || null;

    setPolishLoading(true);
    try {
      if (USE_REAL_API) {
        const res = await fetch('/api/llm/policy-freeform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district_id: targetDistrict,
            file_name: fileName,
            csv_text: parseMeta.csvText,
            headers: parseMeta.headers,
            row_count: parseMeta.rowCount,
            draft: cabinetBrief,
            mode: 'polish',
          }),
        });
        const data = await res.json();
        setCabinetBrief(data.analysis || data.cabinet_brief || data.narrative || cabinetBrief);
      } else {
        setCabinetBrief(
          `${cabinetBrief}\n\nPolished Version: Language tightened for executive and cabinet review.`
        );
      }
    } catch (err) {
      console.error('Polish error:', err);
    } finally {
      setPolishLoading(false);
    }
  };

  /**
   * Export to PDF
   */
  const exportPdf = async () => {
    setPdfExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('policy-brief-export');
      if (!element) return;

      const targetDistrict = districtId || structuredRows[0]?.district_id || 'dynamic-dataset';
      const date = new Date().toISOString().split('T')[0];

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `cabinet-brief-${targetDistrict}-${date}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  const severityClass = (severity) =>
    severity === 'CRITICAL' ? 'flag-critical' : severity === 'HIGH' ? 'flag-high' : 'flag-medium';

  const feasibilityClass = (score) =>
    score >= 70 ? 'feas-high' : score >= 40 ? 'feas-medium' : 'feas-low';

  return (
    <div className="policy-simulator-panel">
      {/* Upload Section */}
      <div className="panel-section">
        <h4 className="section-title">Upload Policy Sheet</h4>
        <div className="upload-zone" onDrop={onDrop} onDragOver={onDragOver}>
          <div className="upload-icon">📄</div>
          <p className="upload-text">{fileName ? fileName : 'Drag & drop CSV/XLSX or click to browse'}</p>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Browse Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          <p className="upload-hint">
            Dynamic schema supported. The full sheet is analyzed directly by AI.
          </p>
        </div>
      </div>

      {/* Parsing Errors */}
      {validationErrors.length > 0 && (
        <div className="panel-section">
          <h4 className="section-title">⚠️ File Parsing Alerts</h4>
          <div className="validation-errors">
            {validationErrors.map((err, i) => (
              <div key={i} className="validation-error">
                <span className="error-row">Row {err.row}</span>
                <span className="error-msg">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis results (only show after successful parse) */}
      {validRows.length > 0 && !processing && (
        <>
          {/* Parsed Summary */}
          <div className="panel-section">
            <h4 className="section-title">✅ {parseMeta.rowCount || validRows.length} Rows Loaded</h4>
            <div className="parsed-summary">
              <div className="summary-stat">
                <span className="stat-value">{parseMeta.rowCount || validRows.length}</span>
                <span className="stat-label">Rows</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{parseMeta.headers.length}</span>
                <span className="stat-label">Columns</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{hasStructuredRows ? 'Yes' : 'No'}</span>
                <span className="stat-label">Structured Policy Schema</span>
              </div>
            </div>
          </div>

          {!hasStructuredRows && (
            <div className="panel-section">
              <p className="placeholder-text">
                Deterministic policy rules are skipped for dynamic schemas. Use Generate for AI-based
                interpretation of your full sheet.
              </p>
            </div>
          )}

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <div className="panel-section">
              <h4 className="section-title">🚩 Red Flags ({redFlags.length})</h4>
              <div className="red-flags-list">
                {redFlags.map((flag, i) => (
                  <div key={i} className={`red-flag-item ${severityClass(flag.severity)}`}>
                    <div className="flag-header">
                      <span className={`flag-badge ${severityClass(flag.severity)}`}>
                        {flag.severity}
                      </span>
                      <span className="flag-crop">{flag.crop}</span>
                      <span className="flag-district">{flag.district_id}</span>
                    </div>
                    <p className="flag-reason">{flag.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arbitrage Table */}
          {arbitrage.length > 0 && (
            <div className="panel-section">
              <h4 className="section-title">🔄 Crop Arbitrage Opportunities</h4>
              <div className="arbitrage-table">
                <div className="arb-header">
                  <span>From</span>
                  <span>To</span>
                  <span>Water ↓</span>
                  <span>Feasibility</span>
                </div>
                {arbitrage.map((row, i) => (
                  <div key={i} className="arb-row">
                    <span className="arb-from">{row.from_crop}</span>
                    <span className="arb-to">{row.to_crop}</span>
                    <span className="arb-water">-{row.water_reduction_pct}%</span>
                    <span className={`arb-feas feas-${row.feasibility}`}>{row.feasibility}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-Year Roadmap */}
          {roadmap && (
            <div className="panel-section">
              <h4 className="section-title">📅 3-Year Transition Roadmap</h4>
              <div className="roadmap-timeline">
                {roadmap.years.map((yr) => (
                  <div key={yr.year} className="roadmap-year">
                    <div className="year-marker">
                      <span className="year-number">Year {yr.year}</span>
                      <span className="year-shift">{yr.cumulative_shift_pct}% shifted</span>
                    </div>
                    <div className="year-details">
                      <span className="year-area">{yr.area_transitioned_ha.toLocaleString()} ha</span>
                      <span className="year-budget">₹{yr.budget_allocated_lakh.toLocaleString()}L</span>
                    </div>
                    <div className="year-progress">
                      <div
                        className="year-progress-fill"
                        style={{ width: `${yr.cumulative_shift_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Political Feasibility */}
          {feasibility && (
            <div className="panel-section">
              <h4 className="section-title">🏛️ Political Feasibility</h4>
              <div className={`feasibility-gauge ${feasibilityClass(feasibility.score)}`}>
                <div className="feas-score-display">
                  <span className="feas-score-value">{feasibility.score}</span>
                  <span className="feas-score-label">/100</span>
                </div>
                <div className="feas-bar">
                  <div className="feas-bar-fill" style={{ width: `${feasibility.score}%` }} />
                </div>
                <div className="feas-breakdown">
                  <div className="feas-factor">
                    <span className="feas-factor-label">Farmers Affected</span>
                    <span className="feas-factor-value">
                      {(feasibility.breakdown.farmers_affected_ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="feas-factor">
                    <span className="feas-factor-label">Budget Shift</span>
                    <span className="feas-factor-value">
                      {(feasibility.breakdown.budget_shift_percent * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="feas-factor">
                    <span className="feas-factor-label">No-Alt Penalty</span>
                    <span className="feas-factor-value">
                      {feasibility.breakdown.no_alternative_penalty ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cabinet Brief */}
          <div className="panel-section">
            <div className="section-header">
              <h4 className="section-title">📋 Cabinet Brief</h4>
              <div className="brief-actions">
                <button className="brief-btn generate" onClick={generateBrief} disabled={briefLoading}>
                  {briefLoading ? '...' : '✨ Generate'}
                </button>
                {cabinetBrief && (
                  <button className="brief-btn polish" onClick={polishBrief} disabled={polishLoading}>
                    {polishLoading ? '...' : '💎 Polish'}
                  </button>
                )}
              </div>
            </div>
            {cabinetBrief ? (
              <div className="brief-content">
                <p className="brief-text">{cabinetBrief}</p>
              </div>
            ) : (
              <p className="placeholder-text">Click Generate for AI-powered sheet analysis</p>
            )}
          </div>

          {/* PDF Export */}
          <div className="panel-section">
            <button className="pdf-export-btn" onClick={exportPdf} disabled={pdfExporting}>
              {pdfExporting ? 'Exporting...' : '📥 Export Cabinet Brief as PDF'}
            </button>
          </div>

          {/* Hidden element for PDF export */}
          <div id="policy-brief-export" className="pdf-export-container">
            <h1 style={{ color: '#1a1a1a', marginBottom: '16px' }}>Agricultural Policy Cabinet Brief</h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              File: {fileName || 'uploaded-sheet'} | Rows: {parseMeta.rowCount || validRows.length} | Generated:{' '}
              {new Date().toLocaleDateString()}
            </p>

            {cabinetBrief && (
              <div>
                <h2 style={{ color: '#1a1a1a', fontSize: '18px' }}>AI Analysis</h2>
                <p style={{ color: '#333', whiteSpace: 'pre-line' }}>{cabinetBrief}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Policy Analysis Modal */}
      {showModal && cabinetBrief && (
        <PolicyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          districtId={districtId}
          districtData={districtData}
          cropRecommendations={cropRecommendations}
          cabinetBrief={cabinetBrief}
          redFlags={redFlags}
          arbitrage={arbitrage}
          structuredRows={structuredRows}
          fileName={fileName}
          parseMeta={parseMeta}
          validRows={validRows}
        />
      )}
    </div>
  );
}

/**
 * Generate a stub cabinet brief for offline mode
 */
function generateStubBrief({ districtId, rows, headers }) {
  const resolvedDistrict = districtId ? districtId.replace('_', ' ') : 'uploaded region';
  const previewRows = rows.slice(0, 3).map((row) => JSON.stringify(row)).join('\n');

  return `CABINET BRIEF — ${resolvedDistrict.toUpperCase()}

EXECUTIVE SUMMARY:
The uploaded policy sheet contains ${rows.length} rows across ${headers.length} columns. Dynamic schema parsing completed successfully, and the entire dataset is eligible for AI interpretation.

DATA OBSERVATIONS:
• Column set detected: ${headers.join(', ') || 'No headers found'}
• Sample rows analyzed:
${previewRows || 'No preview rows available'}

RECOMMENDATIONS:
1. Prioritize allocations tied to water-efficient and climate-resilient interventions.
2. Introduce phased transition support where high-risk spending is concentrated.
3. Add measurable KPIs for budget outcomes (water, yield stability, farmer income).
4. Review district-specific exposure before final subsidy commitments.

This is an offline stub brief. Enable real API mode to generate a full LLM report from the complete CSV/XLSX contents.`;
}

export default PolicySimulator;
