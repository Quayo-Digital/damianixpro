import 'dotenv/config';
import express from 'express';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTENT_SCHEMA = {
  name: 'detect_intent',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'The detected intent label',
        enum: [
          'check_rent_balance',
          'pay_rent',
          'report_maintenance',
          'search_property',
          'schedule_viewing',
          'financial_total_income',
          'financial_total_expenses',
          'financial_net_profit',
          'financial_expenses_by_category',
          'landlord_financial_report',
          'unknown',
        ],
      },
      confidence: {
        type: 'number',
        description: 'Confidence score between 0 and 1',
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['intent', 'confidence'],
    additionalProperties: false,
  },
};

export async function classifyIntent(transcript) {
  if (!transcript || !transcript.trim()) {
    return { intent: 'unknown', confidence: 0 };
  }

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      'You are DamianixPro Voice AI intent classifier for Nigerian property management.',
      'Classify the user transcript into one intent and return JSON only.',
      'Financial intents (for owners/managers): financial_total_income (income, revenue), financial_total_expenses (total spending), financial_net_profit (profit), financial_expenses_by_category (spending on maintenance, repairs, etc).',
      'If the request does not clearly match any intent, use "unknown" with low confidence.',
      '',
      `Transcript: "${transcript}"`,
    ].join('\n'),
    response_format: {
      type: 'json_schema',
      json_schema: INTENT_SCHEMA,
    },
  });

  const output = response.output[0]?.content?.[0]?.text;

  if (!output) {
    return { intent: 'unknown', confidence: 0 };
  }

  try {
    const parsed = JSON.parse(output);
    return {
      intent: parsed.intent ?? 'unknown',
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0,
    };
  } catch {
    return { intent: 'unknown', confidence: 0 };
  }
}

const SENSITIVE_INTENTS = new Set(['pay_rent']);

router.get('/api/ai/intent/requires-verification', (_req, res) => {
  res.json({ intents: [...SENSITIVE_INTENTS] });
});

router.post('/api/ai/intent', async (req, res) => {
  try {
    const transcript = req.body?.transcript ?? req.body?.message ?? '';
    const result = await classifyIntent(String(transcript));
    result.requires_verification = SENSITIVE_INTENTS.has(result.intent);
    res.json(result);
  } catch (error) {
    console.error('[intent] Failed to detect intent', error);
    res.status(500).json({ error: 'Failed to detect intent' });
  }
});

export function createIntentRouter() {
  return router;
}

