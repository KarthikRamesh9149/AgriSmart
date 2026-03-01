import type { District } from '../../../domain/entities/District.js';
import type { MistralMessage } from '../MistralClient.js';

export function buildTimeTravelPrompt(
  district: District,
  timeHorizon: number,
  currentYear: number
): MistralMessage[] {
  const landIntel = district.feature_1_land_intelligence;

  const systemPrompt = `You are an agro-climate modeling assistant.
Return ONLY valid JSON with these exact keys:
{
  "temp_celsius": number,
  "rainfall_mm": number,
  "heat_days_per_year": number,
  "label": string
}

Rules:
- 2000 should represent historical baseline (cooler, wetter, fewer heat days than current)
- current year should represent present baseline
- 2050 should represent climate projection (warmer, potentially lower rainfall, more heat days)
- Keep outputs realistic for Indian district climate contexts
- No markdown, no extra text`;

  const userPrompt = `District: ${district.name}, ${district.state}
Region: ${district.region_type}
Current baseline from digital twin:
- max_temp_c: ${landIntel.climate.max_temp_c}
- heat_stress_days_above_40c: ${landIntel.climate.heat_stress_days_above_40c}
- rainfall_mm_annual: ${landIntel.water.rainfall_mm_annual}
- rainfall_trend_20yr: ${landIntel.water.rainfall_trend_20yr}
- drought_probability: ${landIntel.climate.drought_probability}

Target horizon: ${timeHorizon}
Current year: ${currentYear}

Generate one climate snapshot JSON for the target horizon only.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
