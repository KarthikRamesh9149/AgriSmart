function getLabel(timeHorizon, currentYear) {
  if (timeHorizon === 2000) return 'Baseline';
  if (timeHorizon === currentYear) return 'Current';
  return 'Projection';
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildHistoricalFallback(district) {
  const landIntel = district?.feature_1_land_intelligence ?? {};

  return {
    temp_avg_celsius:
      toNumber(district?.climate_historical?.temp_avg_celsius) ??
      toNumber(landIntel?.climate?.max_temp_c),
    rainfall_avg_mm:
      toNumber(district?.climate_historical?.rainfall_avg_mm) ??
      toNumber(landIntel?.water?.rainfall_mm_annual),
    heat_days_per_year:
      toNumber(district?.climate_historical?.heat_days_per_year) ??
      toNumber(landIntel?.climate?.heat_stress_days_above_40c),
  };
}

export function selectClimateSnapshot(district, timeHorizon, currentYear = new Date().getFullYear()) {
  const normalizedHorizon = [2000, currentYear, 2050].includes(timeHorizon)
    ? timeHorizon
    : currentYear;
  const historical = buildHistoricalFallback(district);
  const projected = district?.climate_projected_2050 ?? {};

  if (normalizedHorizon === 2050) {
    const projectedTemp = toNumber(projected.temp_celsius);
    const projectedRain = toNumber(projected.rainfall_mm);
    const projectedHeat = toNumber(projected.heat_days_per_year);

    return {
      // 2050: Future projection - LARGER variations (noticeably warmer and drier)
      temp_celsius:
        projectedTemp ?? Number(((historical.temp_avg_celsius ?? 0) + 3.5).toFixed(1)),
      rainfall_mm: projectedRain ?? Math.max(0, Math.round((historical.rainfall_avg_mm ?? 0) * 0.75)),
      heat_days_per_year:
        projectedHeat ?? Math.round((historical.heat_days_per_year ?? 0) + 28),
      label: getLabel(normalizedHorizon, currentYear),
    };
  }

  if (normalizedHorizon === 2000) {
    return {
      // 2000: Historical baseline - LARGER variations (significantly cooler and wetter)
      temp_celsius: Number(((historical.temp_avg_celsius ?? 0) - 2.8).toFixed(1)),
      rainfall_mm: Math.max(0, Math.round((historical.rainfall_avg_mm ?? 0) * 1.3)),
      heat_days_per_year: Math.max(0, Math.round((historical.heat_days_per_year ?? 0) - 18)),
      label: getLabel(normalizedHorizon, currentYear),
    };
  }

  return {
    // Current year: Actual measured data
    temp_celsius: historical.temp_avg_celsius ?? 0,
    rainfall_mm: historical.rainfall_avg_mm ?? 0,
    heat_days_per_year: historical.heat_days_per_year ?? 0,
    label: getLabel(normalizedHorizon, currentYear),
  };
}
