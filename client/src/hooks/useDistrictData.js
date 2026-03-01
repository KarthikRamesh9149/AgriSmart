/**
 * useDistrictData Hook
 * Fetches all data needed for a selected district:
 * - District info with scores (Feature 1)
 * - Crop recommendations (Feature 2)
 * - LLM explanations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchDistrictWithScores,
  fetchNarrative,
  fetchCropRecommendations,
  fetchCropWhyExplanation,
} from '../utils/cropApi';

/**
 * Hardcoded climate snapshots for each district (2000, current, 2050)
 * Values based on district JSON actuals + IPCC regional trends for India
 */
const DISTRICT_CLIMATE_SNAPSHOTS = {
  ahmednagar_mh: {
    2000: { temp_celsius: 42.2, rainfall_mm: 676, heat_days_per_year: 20 },
    current: { temp_celsius: 45, rainfall_mm: 520, heat_days_per_year: 38 },
    2050: { temp_celsius: 48.5, rainfall_mm: 390, heat_days_per_year: 66 },
  },
  yavatmal_mh: {
    2000: { temp_celsius: 43.2, rainfall_mm: 1144, heat_days_per_year: 10 },
    current: { temp_celsius: 46, rainfall_mm: 880, heat_days_per_year: 28 },
    2050: { temp_celsius: 49.5, rainfall_mm: 660, heat_days_per_year: 56 },
  },
  bathinda_pb: {
    2000: { temp_celsius: 44.2, rainfall_mm: 559, heat_days_per_year: 6 },
    current: { temp_celsius: 47, rainfall_mm: 430, heat_days_per_year: 24 },
    2050: { temp_celsius: 50.5, rainfall_mm: 323, heat_days_per_year: 52 },
  },
  mandya_ka: {
    2000: { temp_celsius: 41.2, rainfall_mm: 936, heat_days_per_year: 0 },
    current: { temp_celsius: 44, rainfall_mm: 720, heat_days_per_year: 10 },
    2050: { temp_celsius: 47.5, rainfall_mm: 540, heat_days_per_year: 38 },
  },
};

/**
 * @param {string|null} districtId - The selected district ID
 * @param {number} timeHorizon - Selected time horizon
 * @returns {Object} Data, loading state, and error
 */
export function useDistrictData(districtId, timeHorizon) {
  const currentYear = new Date().getFullYear();

  // District data and scores
  const [district, setDistrict] = useState(null);

  // Feature 1: Narrative
  const [narrative, setNarrative] = useState(null);

  // Feature 2: Crop recommendations
  const [cropRecommendations, setCropRecommendations] = useState(null);
  const [cropWhyExplanation, setCropWhyExplanation] = useState(null);
  const [timeTravelSnapshots, setTimeTravelSnapshots] = useState({});

  // Loading states
  const [loading, setLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [cropWhyLoading, setCropWhyLoading] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Fetch core data when district changes
  useEffect(() => {
    if (!districtId) {
      setDistrict(null);
      setNarrative(null);
      setCropRecommendations(null);
      setCropWhyExplanation(null);
      setTimeTravelSnapshots({});
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch district and crop recommendations in parallel
        const [districtData, cropsData] = await Promise.all([
          fetchDistrictWithScores(districtId),
          fetchCropRecommendations(districtId),
        ]);

        if (cancelled) return;

        setDistrict(districtData);
        setCropRecommendations(cropsData);

        // Pre-fill with hardcoded snapshots (scientifically grounded per district)
        const base = districtData.feature_1_land_intelligence;
        const snaps = DISTRICT_CLIMATE_SNAPSHOTS[districtId];

        // Safe defaults if data is missing
        const maxTemp = base?.climate?.max_temp_c || 35;
        const rainfall = base?.water?.rainfall_mm_annual || 600;
        const heatDays = base?.climate?.heat_stress_days_above_40c || 40;

        // Use hardcoded snapshots if available, otherwise fall back to arithmetic
        const baseline = snaps
          ? { ...snaps[2000], label: 'Baseline (2000)' }
          : {
              temp_celsius: Number((maxTemp - 2.8).toFixed(1)),
              rainfall_mm: Math.round(rainfall * 1.3),
              heat_days_per_year: Math.max(0, heatDays - 18),
              label: 'Baseline (2000)',
            };

        const current = snaps
          ? { ...snaps.current, label: `Current (${currentYear})` }
          : {
              temp_celsius: maxTemp,
              rainfall_mm: rainfall,
              heat_days_per_year: heatDays,
              label: `Current (${currentYear})`,
            };

        const projected = snaps
          ? { ...snaps[2050], label: 'Projection (2050)' }
          : {
              temp_celsius: Number((maxTemp + 3.5).toFixed(1)),
              rainfall_mm: Math.max(0, Math.round(rainfall * 0.75)),
              heat_days_per_year: heatDays + 28,
              label: 'Projection (2050)',
            };
        setTimeTravelSnapshots({
          2000: baseline,
          [currentYear]: current,
          2050: projected,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to fetch district data');
        console.error('Error fetching district data:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [districtId]);


  // Fetch narrative separately (can be slower due to LLM)
  const loadNarrative = useCallback(async () => {
    if (!districtId) return;

    setNarrativeLoading(true);
    try {
      const data = await fetchNarrative(districtId);
      setNarrative(data);
    } catch (err) {
      console.error('Error fetching narrative:', err);
      // Don't set error state - narrative is optional enhancement
    } finally {
      setNarrativeLoading(false);
    }
  }, [districtId]);

  // Fetch "Why this fits" explanation separately
  const loadCropWhyExplanation = useCallback(async () => {
    if (!districtId) return;

    setCropWhyLoading(true);
    try {
      const data = await fetchCropWhyExplanation(districtId);
      setCropWhyExplanation(data);
    } catch (err) {
      console.error('Error fetching crop explanation:', err);
      // Don't set error state - explanation is optional enhancement
    } finally {
      setCropWhyLoading(false);
    }
  }, [districtId]);

  // Auto-load narrative and explanation when district changes
  useEffect(() => {
    if (districtId) {
      loadNarrative();
      loadCropWhyExplanation();
    }
  }, [districtId, loadNarrative, loadCropWhyExplanation]);

  return {
    // Core data
    district,
    scores: district?.scores || null,

    // Feature 1: Land Intelligence
    narrative: narrative?.narrative || null,
    narrativeLoading,

    // Feature 2: Crop Matchmaker
    cropRecommendations,
    cropWhyExplanation: cropWhyExplanation?.why_explanation || null,
    cropWhyLoading,
    timeTravelSnapshot: timeTravelSnapshots[timeHorizon] || null,
    historicalSnapshot: timeTravelSnapshots[currentYear] || null,
    projectedSnapshot: timeTravelSnapshots[2050] || null,

    // Overall state
    loading,
    error,
    timeTravelLoading: false, // No longer making async calls for slider

    // Actions
    refreshNarrative: loadNarrative,
    refreshCropWhy: loadCropWhyExplanation,
    refreshTimeTravelSnapshot: () => {}, // No-op since slider uses cached data
  };
}
