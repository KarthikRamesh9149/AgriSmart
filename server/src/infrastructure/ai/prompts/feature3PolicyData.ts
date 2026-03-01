import type { District } from '../../../domain/entities/District.js';
import type { MistralMessage } from '../MistralClient.js';

export interface PolicyDataPromptInput {
  csvText: string;
  fileName?: string;
  headers?: string[];
  rowCount?: number;
  district?: District | null;
  mode?: 'analyze' | 'polish';
  draft?: string;
}

export function buildPolicyDataPrompt(input: PolicyDataPromptInput): MistralMessage[] {
  const mode = input.mode ?? 'analyze';
  const districtLine = input.district
    ? `District context: ${input.district.name}, ${input.district.state} (${input.district.region_type})`
    : 'District context: not explicitly provided in request';

  if (mode === 'polish') {
    return [
      {
        role: 'system',
        content:
          'You are a policy editor. Rewrite and improve the brief for cabinet-level readability while preserving factual meaning.',
      },
      {
        role: 'user',
        content: `Polish this policy brief in clear executive language:\n\n${input.draft ?? ''}`,
      },
    ];
  }

  return [
    {
      role: 'system',
      content: `You are a senior agricultural policy analyst for Indian state governments.
Analyze arbitrary CSV/XLSX policy data and produce an executive brief.
Keep it practical, structured, and specific. Avoid markdown symbols and avoid fabrication.`,
    },
    {
      role: 'user',
      content: `Analyze the uploaded sheet and write a concise policy brief.

File: ${input.fileName ?? 'uploaded-sheet'}
Rows: ${input.rowCount ?? 0}
Headers: ${(input.headers ?? []).join(', ') || 'unknown'}
${districtLine}

Raw data (truncated for safety if needed):
${input.csvText}

Output format:
1) Executive Summary
2) Key Risks
3) Opportunities
4) Recommended Actions (numbered)
5) Implementation Notes

Keep under 350 words.`,
    },
  ];
}
