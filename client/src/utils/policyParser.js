/**
 * Policy Parser - parses CSV/XLSX files with dynamic schemas.
 * No fixed required columns are enforced.
 */

import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';

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

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

function rowsToObjects(rows) {
  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow ?? []).map(normalizeHeader);

  return dataRows
    .filter((row) => row.some((value) => value !== null && value !== undefined && value !== ''))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
    );
}

async function parseCsvFile(file) {
  const text = await file.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return {
      rows: [],
      errors: parsed.errors.map((error) => ({
        row: error.row ?? 0,
        message: error.message,
      })),
      csvText: text,
    };
  }

  return {
    rows: parsed.data.map(normalizeRowKeys),
    errors: [],
    csvText: text,
  };
}

async function parseXlsxFile(file) {
  const rows = await readXlsxFile(file);

  return {
    rows: rowsToObjects(rows),
    errors: [],
    csvText: rowsToCsv(rows),
  };
}

/**
 * Parse a File (CSV or XLSX) into rows and metadata for dynamic LLM analysis.
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} { valid: Row[], errors: ErrorDetail[], meta: {...} }
 */
export async function parseAndValidatePolicyFile(file) {
  const lowerName = file.name.toLowerCase();
  const parsed = lowerName.endsWith('.csv')
    ? await parseCsvFile(file)
    : lowerName.endsWith('.xlsx')
      ? await parseXlsxFile(file)
      : {
          rows: [],
          errors: [{ row: 0, message: 'Unsupported file type. Upload a CSV or XLSX file.' }],
          csvText: '',
        };

  if (parsed.errors.length > 0) {
    return {
      valid: [],
      errors: parsed.errors,
      meta: {
        headers: [],
        csvText: parsed.csvText,
        rowCount: 0,
      },
    };
  }

  if (parsed.rows.length === 0) {
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

  const normalizedRows = parsed.rows.map(normalizeRowKeys);
  const headers = Object.keys(normalizedRows[0] || {});

  return {
    valid: normalizedRows,
    errors: [],
    meta: {
      headers,
      csvText: parsed.csvText,
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
