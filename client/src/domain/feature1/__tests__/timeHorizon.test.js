import { describe, it, expect } from 'vitest';
import { selectClimateSnapshot } from '../timeHorizon';

const districtFixture = {
  climate_historical: {
    temp_avg_celsius: 27.4,
    rainfall_avg_mm: 620,
    heat_days_per_year: 21,
  },
  climate_projected_2050: {
    temp_celsius: 30.2,
    rainfall_mm: 540,
  },
  feature_1_land_intelligence: {
    climate: {
      max_temp_c: 45,
      heat_stress_days_above_40c: 38,
    },
    water: {
      rainfall_mm_annual: 520,
    },
  },
};

describe('selectClimateSnapshot', () => {
  const currentYear = 2026;

  it('returns historical snapshot for 2000 and labels baseline', () => {
    const result = selectClimateSnapshot(districtFixture, 2000, currentYear);
    expect(result).toEqual({
      temp_celsius: 26.2,
      rainfall_mm: 694,
      heat_days_per_year: 11,
      label: 'Baseline',
    });
  });

  it('returns historical snapshot for 2024 and labels current', () => {
    const result = selectClimateSnapshot(districtFixture, currentYear, currentYear);
    expect(result).toEqual({
      temp_celsius: 27.4,
      rainfall_mm: 620,
      heat_days_per_year: 21,
      label: 'Current',
    });
  });

  it('returns projected snapshot for 2050 with historical heat-day fallback', () => {
    const result = selectClimateSnapshot(districtFixture, 2050, currentYear);
    expect(result).toEqual({
      temp_celsius: 30.2,
      rainfall_mm: 540,
      heat_days_per_year: 39,
      label: 'Projection',
    });
  });
});
