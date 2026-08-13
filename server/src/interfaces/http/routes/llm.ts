import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import type { ActorContext } from '../../../infrastructure/security/ActorContext.js';
import { requireActor } from '../../../infrastructure/security/ActorContext.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { logger } from '../../../infrastructure/logging/logger.js';

const districtId = z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/);
const LlmRequestSchema = z.object({ district_id: districtId }).strict();
const FreeformPolicyRequestSchema = z.object({
  csv_text: z.string().min(1).max(20_000),
  file_name: z.string().trim().min(1).max(255).optional(),
  district_id: districtId.optional(),
  headers: z.array(z.string().trim().min(1).max(100)).max(64).optional(),
  row_count: z.number().int().nonnegative().max(100_000).optional(),
  mode: z.enum(['analyze', 'polish']).default('analyze'),
  draft: z.string().max(8_000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.mode === 'polish' && !value.draft?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['draft'], message: 'draft required' });
  }
});
const TimeTravelRequestSchema = z.object({
  district_id: districtId,
  time_horizon: z.number().int().gte(1900).lte(2100),
  current_year: z.number().int().gte(1900).lte(2100).optional(),
}).strict();
const IdempotencyKeySchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);

type LlmBody = z.input<typeof LlmRequestSchema>;
type PolicyBody = z.input<typeof FreeformPolicyRequestSchema>;
type TimeBody = z.input<typeof TimeTravelRequestSchema>;

function invalid(reply: FastifyReply) {
  return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } });
}

function reserveIfProvider(container: Container, actor: ActorContext, feature: 1 | 2 | 3 | 4, cost: number): void {
  if (container.aiService.isAvailable(feature)) container.aiBudget.reserve(actor, cost);
}

export function createLlmRoutes(container: Container) {
  return async function llmRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post<{ Body: LlmBody }>('/llm/feature1-narrative', async (request, reply) => {
      const actor = requireActor(request);
      const parsed = LlmRequestSchema.safeParse(request.body);
      if (!parsed.success) return invalid(reply);
      reserveIfProvider(container, actor, 1, 0.01);
      return reply.send(await container.generateNarrativeUseCase.execute(parsed.data.district_id));
    });

    fastify.post<{ Body: LlmBody }>('/llm/feature2-why', async (request, reply) => {
      const actor = requireActor(request);
      const parsed = LlmRequestSchema.safeParse(request.body);
      if (!parsed.success) return invalid(reply);
      reserveIfProvider(container, actor, 2, 0.02);
      return reply.send(await container.generateCropWhyUseCase.execute(parsed.data.district_id));
    });

    for (const route of ['/llm/feature3-brief', '/llm/feature3-polish'] as const) {
      fastify.post<{ Body: LlmBody }>(route, async (request, reply) => {
        const actor = requireActor(request);
        const parsed = LlmRequestSchema.safeParse(request.body);
        if (!parsed.success) return invalid(reply);
        reserveIfProvider(container, actor, 3, 0.05);
        return reply.send(await container.generatePolicyBriefUseCase.execute(parsed.data.district_id));
      });
    }

    fastify.post<{ Body: PolicyBody; Headers: { 'idempotency-key'?: string } }>(
      '/llm/policy-freeform',
      async (request: FastifyRequest<{ Body: PolicyBody; Headers: { 'idempotency-key'?: string } }>, reply) => {
        const actor = requireActor(request);
        const parsed = FreeformPolicyRequestSchema.safeParse(request.body);
        const keyResult = IdempotencyKeySchema.safeParse(request.headers['idempotency-key']);
        if (!parsed.success || !keyResult.success) return invalid(reply);
        const key = keyResult.data;
        const route = request.routeOptions.url ?? '/llm/policy-freeform';
        const cached = container.idempotencyStore.get(actor, route, key);
        if (cached) return reply.send(cached);

        const data = parsed.data;
        const district = data.district_id ? await container.districtRepo.findById(data.district_id) : null;
        let analysis: string;
        if (container.aiService.isAvailable(3)) {
          reserveIfProvider(container, actor, 3, 0.08);
          try {
            analysis = await container.aiService.analyzePolicyData({
              csvText: data.csv_text, fileName: data.file_name, headers: data.headers,
              rowCount: data.row_count, district, mode: data.mode, draft: data.draft,
            });
          } catch {
            logger.warn({ requestId: request.requestId, feature: 3 }, 'Optional AI policy analysis failed');
            analysis = fallbackPolicy(data.row_count, data.headers, district?.name);
          }
        } else {
          analysis = fallbackPolicy(data.row_count, data.headers, district?.name);
        }
        const response = { analysis, generated_at: new Date().toISOString() };
        container.idempotencyStore.set(actor, route, key, response);
        return reply.send(response);
      }
    );

    fastify.post<{ Body: TimeBody }>('/llm/feature4-time-travel', async (request, reply) => {
      const actor = requireActor(request);
      const parsed = TimeTravelRequestSchema.safeParse(request.body);
      if (!parsed.success) return invalid(reply);
      const district = await container.districtRepo.findById(parsed.data.district_id);
      if (!district) throw AppError.notFound('District');
      reserveIfProvider(container, actor, 4, 0.02);
      const snapshot = await container.aiService.generateTimeTravelSnapshot({
        district, timeHorizon: parsed.data.time_horizon,
        currentYear: parsed.data.current_year ?? new Date().getUTCFullYear(),
      });
      return reply.send({ district_id: parsed.data.district_id, time_horizon: parsed.data.time_horizon, snapshot, generated_at: new Date().toISOString() });
    });
  };
}

function fallbackPolicy(rows?: number, headers?: string[], district?: string): string {
  return `Local policy summary. Rows: ${rows ?? 0}. Columns: ${(headers ?? []).join(', ') || 'unknown'}. District: ${district ?? 'not provided'}. Review data quality and validate recommendations with qualified decision-makers.`;
}
