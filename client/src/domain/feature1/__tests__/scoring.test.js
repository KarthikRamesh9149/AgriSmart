import { describe, it, expect } from 'vitest';
import { computeClimateDriftScore } from '../scoring';

describe('computeClimateDriftScore', () => {
  it('computes a deterministic drift score from historical vs projected values', () => {
    const result = computeClimateDriftScore(
      { temp_celsius: 27, rainfall_mm: 600, heat_days_per_year: 20 },
      { temp_celsius: 30, rainfall_mm: 510, heat_days_per_year: 30 }
    );

    expect(result.isFallback).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.temp_delta_celsius).toBe(3);
    expect(result.components.heat_days_delta).toBe(10);
  });

  it('uses safe fallbacks when projected fields are missing', () => {
    const result = computeClimateDriftScore(
      { temp_celsius: 27, rainfall_mm: 600, heat_days_per_year: 20 },
      {}
    );

    expect(result.isFallback).toBe(false);
    expect(result.score).toBe(100);
    expect(result.components.temp_delta_celsius).toBe(0);
    expect(result.components.rainfall_delta_pct).toBe(0);
    expect(result.components.heat_days_delta).toBe(0);
  });

  it('returns structured fallback when historical data is missing', () => {
    const result = computeClimateDriftScore(null, { temp_celsius: 32 });
    expect(result.isFallback).toBe(true);
    expect(result.score).toBe(50);
    expect(result.message).toContain('Insufficient historical data');
  });
});
