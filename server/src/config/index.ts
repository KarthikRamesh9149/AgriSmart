import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const blankToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalNumber = z.preprocess(blankToUndefined, z.coerce.number().positive().optional());
const optionalString = z.preprocess(blankToUndefined, z.string().optional());

const configSchema = z.object({
  port: z.preprocess(blankToUndefined, z.coerce.number().int().positive().default(8787)),
  nodeEnv: z.preprocess(blankToUndefined, z.enum(['development', 'production', 'test']).default('development')),
  logLevel: z.preprocess(blankToUndefined, z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info')),
  aiMode: z.preprocess(blankToUndefined, z.enum(['disabled', 'mistral']).default('disabled')),
  auth: z.object({
    mode: z.preprocess(blankToUndefined, z.enum(['demo', 'token']).default('demo')),
    demoToken: optionalString,
    tokensJson: z.preprocess(blankToUndefined, z.string().default('{}')),
  }),
  aiLimits: z.object({
    actorRequests: optionalNumber.default(10),
    tenantRequests: optionalNumber.default(50),
    actorCostUsd: optionalNumber.default(0.25),
    tenantCostUsd: optionalNumber.default(1),
  }),
  clientOrigins: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  mistral: z.object({
    feature1: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-small-latest'),
    }),
    feature2: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-small-latest'),
    }),
    feature3: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-large-latest'),
    }),
    feature4: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-large-latest'),
    }),
    brief: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-medium-latest'),
    }),
  }),
}).superRefine((value, ctx) => {
  if (value.nodeEnv === 'production' && value.auth.mode === 'demo') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['auth', 'mode'], message: 'AUTH_MODE=token is required in production' });
  }
});

export type Config = z.infer<typeof configSchema>;

const rawConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  aiMode: process.env.AI_MODE,
  auth: {
    mode: process.env.AUTH_MODE,
    demoToken: process.env.DEMO_API_TOKEN,
    tokensJson: process.env.AUTH_TOKENS_JSON,
  },
  aiLimits: {
    actorRequests: process.env.AI_ACTOR_REQUEST_LIMIT,
    tenantRequests: process.env.AI_TENANT_REQUEST_LIMIT,
    actorCostUsd: process.env.AI_ACTOR_COST_LIMIT_USD,
    tenantCostUsd: process.env.AI_TENANT_COST_LIMIT_USD,
  },
  clientOrigins: process.env.CLIENT_ORIGINS,
  mistral: {
    feature1: {
      key: process.env.MISTRAL_FEATURE1_KEY,
      model: process.env.MISTRAL_FEATURE1_MODEL,
    },
    feature2: {
      key: process.env.MISTRAL_FEATURE2_KEY,
      model: process.env.MISTRAL_FEATURE2_MODEL,
    },
    feature3: {
      key: process.env.MISTRAL_FEATURE3_KEY,
      model: process.env.MISTRAL_FEATURE3_MODEL,
    },
    feature4: {
      key: process.env.MISTRAL_FEATURE4_KEY,
      model: process.env.MISTRAL_FEATURE4_MODEL,
    },
    brief: {
      key: process.env.MISTRAL_BRIEF_KEY,
      model: process.env.MISTRAL_BRIEF_MODEL,
    },
  },
};

export const config: Config = configSchema.parse(rawConfig);

export function parseAuthTokens(raw: string): Record<string, { actorId: string; tenantId: string }> {
  const parsed: unknown = JSON.parse(raw);
  return z.record(z.object({
    actorId: z.string().min(1).max(100),
    tenantId: z.string().min(1).max(100),
  })).parse(parsed);
}
