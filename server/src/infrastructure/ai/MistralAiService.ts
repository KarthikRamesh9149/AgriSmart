/**
 * MistralAiService
 * Implements IAiService using Mistral API
 */

import type {
  IAiService,
  NarrativeContext,
  CropContext,
  PolicyContext,
  PolicyDataContext,
  TimeTravelContext,
  TimeTravelSnapshot,
} from '../../application/ports/IAiService.js';
import { MistralClient, type MistralConfig } from './MistralClient.js';
import { buildNarrativePrompt } from './prompts/feature1Narrative.js';
import { buildCropWhyPrompt } from './prompts/feature2Why.js';
import { buildPolicyBriefPrompt } from './prompts/feature3Brief.js';
import { buildPolicyDataPrompt } from './prompts/feature3PolicyData.js';
import { buildTimeTravelPrompt } from './prompts/feature4TimeTravel.js';
import { logger } from '../logging/logger.js';

export class MistralAiService implements IAiService {
  private readonly client: MistralClient;
  private readonly config: MistralConfig;

  constructor(client: MistralClient, config: MistralConfig) {
    this.client = client;
    this.config = config;
  }

  isAvailable(feature: 1 | 2 | 3 | 4): boolean {
    switch (feature) {
      case 1:
        return this.client.hasKey('feature1');
      case 2:
        return this.client.hasKey('feature2');
      case 3:
        return this.client.hasKey('feature3');
      case 4:
        return this.client.hasKey('feature4');
      default:
        return false;
    }
  }

  async generateNarrative(context: NarrativeContext): Promise<string> {
    const { district, scores } = context;

    logger.info({
      feature: 'feature1',
      district_id: district.district_id,
    }, 'Generating land intelligence narrative');

    try {
      const messages = buildNarrativePrompt(district, scores);
      const response = await this.client.chat('feature1', messages, {
        temperature: 0.7,
        maxTokens: 256,
      });

      logger.info({
        feature: 'feature1',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Narrative generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature1',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate narrative');

      throw error;
    }
  }

  async generateCropWhy(context: CropContext): Promise<string> {
    const { district } = context;

    logger.info({
      feature: 'feature2',
      district_id: district.district_id,
    }, 'Generating crop recommendation explanation');

    try {
      const messages = buildCropWhyPrompt(district);
      const response = await this.client.chat('feature2', messages, {
        temperature: 0.7,
        maxTokens: 512,
      });

      logger.info({
        feature: 'feature2',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Crop explanation generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature2',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate crop explanation');

      throw error;
    }
  }

  async generatePolicyBrief(context: PolicyContext): Promise<string> {
    const { district } = context;

    logger.info({
      feature: 'feature3',
      district_id: district.district_id,
    }, 'Generating policy cabinet brief');

    try {
      const messages = buildPolicyBriefPrompt(district);
      const response = await this.client.chat('feature3', messages, {
        temperature: 0.6, // Slightly lower for more formal output
        maxTokens: 1024,
      });

      logger.info({
        feature: 'feature3',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Policy brief generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature3',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate policy brief');

      throw error;
    }
  }

  async analyzePolicyData(context: PolicyDataContext): Promise<string> {
    logger.info(
      {
        feature: 'feature3',
        mode: context.mode ?? 'analyze',
        district_id: context.district?.district_id,
        rowCount: context.rowCount ?? 0,
        hasKey: this.client.hasKey('feature3'),
      },
      'Generating freeform policy analysis'
    );

    // Check if key is available
    if (!this.client.hasKey('feature3')) {
      logger.error({ feature: 'feature3' }, 'Feature3 API key not configured');
      throw new Error('Feature3 API key not configured');
    }

    try {
      const messages = buildPolicyDataPrompt(context);
      logger.debug(
        { messageCount: messages.length, feature: 'feature3' },
        'Built policy prompt'
      );

      logger.debug({ feature: 'feature3' }, 'Calling Mistral API for feature3');
      const response = await this.client.chat('feature3', messages, {
        temperature: context.mode === 'polish' ? 0.4 : 0.5,
        maxTokens: 1200,
      });

      logger.info(
        {
          feature: 'feature3',
          responseLength: response.length,
          mode: context.mode,
        },
        'Successfully generated policy analysis'
      );

      return response.trim();
    } catch (error) {
      logger.error(
        {
          feature: 'feature3',
          mode: context.mode ?? 'analyze',
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
        'Failed to generate freeform policy analysis'
      );
      throw error;
    }
  }

  async generateTimeTravelSnapshot(context: TimeTravelContext): Promise<TimeTravelSnapshot> {
    const { district, timeHorizon, currentYear } = context;
    const base = district.feature_1_land_intelligence;

    // Build deterministic snapshot with LARGER variations so changes are clearly visible
    const deterministic: TimeTravelSnapshot =
      timeHorizon === 2000
        ? {
            // 2000: Historical baseline - significantly cooler and wetter
            temp_celsius: Number((base.climate.max_temp_c - 2.8).toFixed(1)),
            rainfall_mm: Math.round(base.water.rainfall_mm_annual * 1.3),
            heat_days_per_year: Math.max(0, base.climate.heat_stress_days_above_40c - 18),
            label: 'Baseline (2000)',
          }
        : timeHorizon === currentYear
          ? {
              // Current year: Actual measured data
              temp_celsius: base.climate.max_temp_c,
              rainfall_mm: base.water.rainfall_mm_annual,
              heat_days_per_year: base.climate.heat_stress_days_above_40c,
              label: `Current (${currentYear})`,
            }
          : {
              // 2050+: Future projection - noticeably warmer and drier
              temp_celsius: Number((base.climate.max_temp_c + 3.5).toFixed(1)),
              rainfall_mm: Math.max(0, Math.round(base.water.rainfall_mm_annual * 0.75)),
              heat_days_per_year: base.climate.heat_stress_days_above_40c + 28,
              label: `Projection (${timeHorizon})`,
            };

    // Try Mistral API if key is available
    const hasKey = this.client.hasKey('feature4');
    logger.info(
      {
        feature: 'feature4',
        timeHorizon,
        district_id: district.district_id,
        hasKey,
      },
      'Time travel snapshot requested'
    );

    if (hasKey) {
      try {
        logger.info({ feature: 'feature4', timeHorizon }, 'Calling Mistral API');
        const messages = buildTimeTravelPrompt(district, timeHorizon, currentYear);
        const raw = await this.client.chat('feature4', messages, {
          temperature: 0.2,
          maxTokens: 260,
        });

        logger.debug({ feature: 'feature4', responseLength: raw.length }, 'API response received');

        const parsed = this.parseTimeTravelResponse(raw);
        if (parsed && this.isValidSnapshot(parsed)) {
          logger.info(
            {
              feature: 'feature4',
              district_id: district.district_id,
              timeHorizon,
              source: 'mistral_api',
              temp: parsed.temp_celsius,
              rain: parsed.rainfall_mm,
              heat: parsed.heat_days_per_year,
            },
            'Time-travel snapshot from Mistral API SUCCESS'
          );
          return {
            temp_celsius: parsed.temp_celsius,
            rainfall_mm: parsed.rainfall_mm,
            heat_days_per_year: parsed.heat_days_per_year,
            label: parsed.label || deterministic.label,
          };
        } else {
          logger.warn({ feature: 'feature4', raw: raw.substring(0, 200) }, 'Failed to parse response');
        }
      } catch (error) {
        logger.error(
          {
            feature: 'feature4',
            district_id: district.district_id,
            timeHorizon,
            error: (error as Error).message,
          },
          'Mistral API FAILED'
        );
      }
    }

    logger.info(
      { feature: 'feature4', timeHorizon, source: 'deterministic_fallback' },
      'Returning deterministic fallback'
    );
    return deterministic;
  }

  private isValidSnapshot(snapshot: Partial<TimeTravelSnapshot>): boolean {
    const temp = Number(snapshot.temp_celsius);
    const rain = Number(snapshot.rainfall_mm);
    const heat = Number(snapshot.heat_days_per_year);
    return Number.isFinite(temp) && Number.isFinite(rain) && Number.isFinite(heat);
  }

  private parseTimeTravelResponse(raw: string): TimeTravelSnapshot | null {
    const jsonCandidate = this.extractFirstJsonObject(raw);
    if (!jsonCandidate) return null;

    try {
      const parsed = JSON.parse(jsonCandidate) as Partial<TimeTravelSnapshot>;
      const temp = Number(parsed.temp_celsius);
      const rain = Number(parsed.rainfall_mm);
      const heat = Number(parsed.heat_days_per_year);

      if (!Number.isFinite(temp) || !Number.isFinite(rain) || !Number.isFinite(heat)) {
        return null;
      }

      return {
        temp_celsius: Number(temp.toFixed(1)),
        rainfall_mm: Math.round(rain),
        heat_days_per_year: Math.round(heat),
        label: typeof parsed.label === 'string' && parsed.label.length > 0 ? parsed.label : 'Current',
      };
    } catch {
      return null;
    }
  }

  private extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return text.slice(start, end + 1);
  }
}
