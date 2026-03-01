/**
 * LLM Routes
 * POST /api/llm/feature1-narrative - Generate land intelligence narrative
 * POST /api/llm/feature2-why - Generate crop recommendation explanation
 * POST /api/llm/feature3-brief - Generate policy cabinet brief
 * POST /api/llm/policy-freeform - Analyze dynamic CSV/XLSX policy data
 * POST /api/llm/feature4-time-travel - Generate climate snapshot for time horizon
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import { logger } from '../../../infrastructure/logging/logger.js';

const LlmRequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

const FreeformPolicyRequestSchema = z.object({
  csv_text: z.string().min(1, 'csv_text is required'),
  file_name: z.string().optional(),
  district_id: z.string().optional(),
  headers: z.array(z.string()).optional(),
  row_count: z.number().int().nonnegative().optional(),
  mode: z.enum(['analyze', 'polish']).optional(),
  draft: z.string().optional(),
});

const TimeTravelRequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
  time_horizon: z.number().int().gte(1900).lte(2100),
  current_year: z.number().int().gte(1900).lte(2100).optional(),
});

interface LlmRequestBody {
  district_id: string;
}

interface FreeformPolicyRequestBody {
  csv_text: string;
  file_name?: string;
  district_id?: string;
  headers?: string[];
  row_count?: number;
  mode?: 'analyze' | 'polish';
  draft?: string;
}

interface TimeTravelRequestBody {
  district_id: string;
  time_horizon: number;
  current_year?: number;
}

export function createLlmRoutes(container: Container) {
  return async function llmRoutes(fastify: FastifyInstance): Promise<void> {
    // Feature 1: Land Intelligence Narrative
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature1-narrative', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature1 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature1-narrative',
      }, 'Generating narrative');

      const result = await container.generateNarrativeUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Narrative generated');

      return reply.send(result);
    });

    // Feature 2: Crop Matchmaker "Why this fits"
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature2-why', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature2 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature2-why',
      }, 'Generating crop explanation');

      const result = await container.generateCropWhyUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Crop explanation generated');

      return reply.send(result);
    });

    // Feature 3: Policy Simulator Cabinet Brief
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature3-brief', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature3 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature3-brief',
      }, 'Generating policy brief');

      const result = await container.generatePolicyBriefUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Policy brief generated');

      return reply.send(result);
    });

    // Feature 3: Policy Simulator Polish (optional enhancement)
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature3-polish', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      // For now, polish just returns the same as brief
      // In future, this could use a different model or prompt for refinement
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;
      const result = await container.generatePolicyBriefUseCase.execute(district_id);
      return reply.send(result);
    });

    // Feature 3: Dynamic CSV/XLSX freeform policy analysis
    fastify.post<{
      Body: FreeformPolicyRequestBody;
    }>('/llm/policy-freeform', async (request: FastifyRequest<{ Body: FreeformPolicyRequestBody }>, reply: FastifyReply) => {
      try {
        const parseResult = FreeformPolicyRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: parseResult.error.errors,
            },
          });
        }

        const data = parseResult.data;
        const csvText = data.csv_text.slice(0, 20000);
        const district =
          data.district_id && data.district_id.length > 0
            ? await container.districtRepo.findById(data.district_id)
            : null;

        if (container.aiService.isAvailable(3)) {
          try {
            const analysis = await container.aiService.analyzePolicyData({
              csvText,
              fileName: data.file_name,
              headers: data.headers,
              rowCount: data.row_count,
              district,
              mode: data.mode ?? 'analyze',
              draft: data.draft,
            });

            return reply.send({
              analysis,
              generated_at: new Date().toISOString(),
            });
          } catch (aiError) {
            logger.error(
              {
                error: (aiError as Error).message,
                feature: 3,
                csv_rows: data.row_count,
              },
              'Policy analysis failed, using fallback'
            );
            // Fall through to fallback mode
          }
        }

        // Fallback when AI is unavailable or fails
        return reply.send({
          analysis: `Policy analysis generated in fallback mode.
Rows: ${data.row_count ?? 0}
Columns: ${(data.headers ?? []).join(', ') || 'unknown'}
District: ${district?.name ?? data.district_id ?? 'not provided'}
Summary: Using fallback analysis mode. Recommendations:
- Verify MISTRAL_FEATURE3_KEY is set for full dynamic CSV analysis
- Check API limits and rate limits
- Ensure CSV is well-formed`,
          generated_at: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            endpoint: '/llm/policy-freeform',
          },
          'Policy freeform endpoint error'
        );
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Policy analysis failed: ' + (error as Error).message,
          },
        });
      }
    });

    // Feature 4: Time-travel climate snapshot generation
    fastify.post<{
      Body: TimeTravelRequestBody;
    }>('/llm/feature4-time-travel', async (request: FastifyRequest<{ Body: TimeTravelRequestBody }>, reply: FastifyReply) => {
      const parseResult = TimeTravelRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id, time_horizon, current_year } = parseResult.data;
      const district = await container.districtRepo.findById(district_id);

      if (!district) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `District '${district_id}' not found`,
          },
        });
      }

      const snapshot = await container.aiService.generateTimeTravelSnapshot({
        district,
        timeHorizon: time_horizon,
        currentYear: current_year ?? new Date().getUTCFullYear(),
      });

      return reply.send({
        district_id,
        time_horizon,
        snapshot,
        generated_at: new Date().toISOString(),
      });
    });
  };
}
