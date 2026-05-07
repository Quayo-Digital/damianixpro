/**
 * Lightweight numeric forecasting utilities used by paymentInsightsService.
 * Holt's linear method (double exponential smoothing) handles level + trend
 * properly without an LLM. We pick smoothing constants conservatively and
 * floor predictions at 0 (rent revenue can't go negative).
 */

/**
 * Holt's linear forecast.
 *
 * @param {number[]} series  Observations in chronological order (oldest first).
 * @param {object} [opts]
 * @param {number} [opts.alpha=0.6] Level smoothing 0..1
 * @param {number} [opts.beta=0.3]  Trend smoothing 0..1
 * @param {number} [opts.h=1]       Periods ahead to forecast
 * @returns {{
 *   point: number,
 *   lower: number,
 *   upper: number,
 *   level: number,
 *   trend: number,
 *   residualStd: number,
 *   method: 'holt' | 'mean' | 'last' | 'zero'
 * }}
 */
export function holtLinearForecast(series, opts = {}) {
  const alpha = clamp01(opts.alpha ?? 0.6);
  const beta = clamp01(opts.beta ?? 0.3);
  const h = Math.max(1, Math.floor(opts.h ?? 1));

  if (!Array.isArray(series) || series.length === 0) {
    return { point: 0, lower: 0, upper: 0, level: 0, trend: 0, residualStd: 0, method: 'zero' };
  }

  const cleaned = series.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));

  if (cleaned.length === 1) {
    const v = cleaned[0];
    return { point: v, lower: v, upper: v, level: v, trend: 0, residualStd: 0, method: 'last' };
  }

  if (cleaned.length === 2) {
    const mean = (cleaned[0] + cleaned[1]) / 2;
    return {
      point: Math.max(0, Math.round(mean)),
      lower: Math.max(0, Math.round(mean * 0.85)),
      upper: Math.round(mean * 1.15),
      level: mean,
      trend: cleaned[1] - cleaned[0],
      residualStd: 0,
      method: 'mean',
    };
  }

  let level = cleaned[0];
  let trend = cleaned[1] - cleaned[0];
  const fitted = [level];
  for (let i = 1; i < cleaned.length; i += 1) {
    const prevLevel = level;
    level = alpha * cleaned[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level);
  }

  const residuals = cleaned.map((y, i) => y - fitted[i]);
  const variance =
    residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, residuals.length - 1);
  const residualStd = Math.sqrt(variance);

  const point = Math.max(0, Math.round(level + h * trend));
  const z = 1.96;
  const halfWidth = Math.round(z * residualStd * Math.sqrt(h));
  const lower = Math.max(0, point - halfWidth);
  const upper = Math.max(point, point + halfWidth);

  return { point, lower, upper, level, trend, residualStd, method: 'holt' };
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
