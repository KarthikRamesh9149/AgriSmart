function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function levelFromScore(score) {
  if (score >= 70) return 'stable';
  if (score >= 40) return 'warning';
  return 'critical';
}

export function computeClimateDriftScore(historical, projected2050) {
  const hasHistorical =
    historical &&
    (Number.isFinite(Number(historical.temp_celsius)) ||
      Number.isFinite(Number(historical.rainfall_mm)) ||
      Number.isFinite(Number(historical.heat_days_per_year)));

  if (!hasHistorical) {
    return {
      score: 50,
      level: 'warning',
      isFallback: true,
      message: 'Insufficient historical data; using fallback climate drift score.',
      components: {
        temp_delta_celsius: 0,
        rainfall_delta_pct: 0,
        heat_days_delta: 0,
      },
    };
  }

  const histTemp = toNumber(historical?.temp_celsius, 0);
  const histRain = toNumber(historical?.rainfall_mm, 0);
  const histHeat = toNumber(historical?.heat_days_per_year, 0);

  const projTemp = toNumber(projected2050?.temp_celsius, histTemp);
  const projRain = toNumber(projected2050?.rainfall_mm, histRain);
  const projHeat = toNumber(projected2050?.heat_days_per_year, histHeat);

  const tempDelta = Math.abs(projTemp - histTemp);
  const rainfallDeltaPct = histRain > 0 ? (Math.abs(projRain - histRain) / histRain) * 100 : 0;
  const heatDaysDelta = Math.abs(projHeat - histHeat);

  const penaltyRaw = tempDelta * 12 + rainfallDeltaPct * 0.8 + heatDaysDelta * 1.2;
  const penalty = Math.min(100, Math.max(0, penaltyRaw));
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    score,
    level: levelFromScore(score),
    isFallback: false,
    message: 'Computed from historical vs selected 2050 projection.',
    components: {
      temp_delta_celsius: Number(tempDelta.toFixed(2)),
      rainfall_delta_pct: Number(rainfallDeltaPct.toFixed(2)),
      heat_days_delta: Number(heatDaysDelta.toFixed(2)),
    },
  };
}
