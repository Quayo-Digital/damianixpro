import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMock = vi.hoisted(() => vi.fn());

vi.mock('openai', () => ({
  OpenAI: vi.fn(function OpenAIMock() {
    return {
      responses: {
        create: createMock,
      },
    };
  }),
}));

// Loaded after OpenAI mock (Vitest hoists vi.mock; keep below for clarity).
import { classifyIntent } from '../../../../server/intentDetectionService.mjs';

describe('intentDetectionService (server) classifyIntent', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('returns unknown with zero confidence for empty transcript without calling OpenAI', async () => {
    const out = await classifyIntent('   ');
    expect(out).toEqual({ intent: 'unknown', confidence: 0 });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('parses model JSON output into intent and bounded confidence', async () => {
    createMock.mockResolvedValue({
      output: [
        {
          content: [{ text: JSON.stringify({ intent: 'check_rent_balance', confidence: 0.912 }) }],
        },
      ],
    });

    const out = await classifyIntent('how much rent do I owe');

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(out.intent).toBe('check_rent_balance');
    expect(out.confidence).toBeCloseTo(0.912, 5);
  });

  it('returns unknown when model output is missing', async () => {
    createMock.mockResolvedValue({ output: [] });

    const out = await classifyIntent('any text');
    expect(out).toEqual({ intent: 'unknown', confidence: 0 });
  });

  it('returns unknown on invalid JSON from model', async () => {
    createMock.mockResolvedValue({
      output: [{ content: [{ text: 'not-json' }] }],
    });

    const out = await classifyIntent('any text');
    expect(out).toEqual({ intent: 'unknown', confidence: 0 });
  });

  it('clamps confidence to 0–1', async () => {
    createMock.mockResolvedValue({
      output: [{ content: [{ text: JSON.stringify({ intent: 'unknown', confidence: 99 }) }] }],
    });

    const out = await classifyIntent('x');
    expect(out.confidence).toBe(1);
  });
});
