/**
 * Policy Parser — parses CSV/XLSX files with dynamic schemas.
 * No fixed required columns are enforced.
 */

import * as XLSX from 'xlsx';

function normalizeHeader(header) {
  return String(header).trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeRowKeys(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    normalized[normalizeHeader(key)] = row[key];
  }
  return normalized;
}

/**
 * Parse a File (CSV or XLSX) into rows and metadata for dynamic LLM analysis.
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} { valid: Row[], errors: ErrorDetail[], meta: {...} }
 */
export async function parseAndValidatePolicyFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const csvText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });

  if (rawRows.length === 0) {
    return {
      valid: [],
      errors: [{ row: 0, message: 'File is empty or has no data rows' }],
      meta: {
        headers: [],
        csvText: '',
        rowCount: 0,
      },
    };
  }

  const normalizedRows = rawRows.map(normalizeRowKeys);
  const headers = Object.keys(normalizedRows[0] || {});

  return {
    valid: normalizedRows,
    errors: [],
    meta: {
      headers,
      csvText,
      rowCount: normalizedRows.length,
    },
  };
}

/**
 * Backwards-compatible export: no strict validation, just normalized rows.
 */
export function validateRows(rawRows) {
  return {
    valid: rawRows.map(normalizeRowKeys),
    errors: [],
  };
}
