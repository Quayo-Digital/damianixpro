import type { CSSProperties } from 'react';

export type WhiteLabelTemplateType =
  | 'welcome'
  | 'invoice'
  | 'payment_failed'
  | 'subscription_ended';

export function hexToHslTriplet(hex: string): string | null {
  const cleaned = hex.trim().replace('#', '');
  if (![3, 6].includes(cleaned.length)) return null;
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : cleaned;

  const intVal = Number.parseInt(normalized, 16);
  if (Number.isNaN(intVal)) return null;

  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function replaceTemplateVariables(
  source: string,
  vars: Record<string, string | number>,
  brandName: string
): string {
  const merged: Record<string, string | number> = { brand_name: brandName, ...vars };
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = merged[key];
    return value == null ? '' : String(value);
  });
}

export function buildThemeCssVars(primaryHex: string, secondaryHex: string): CSSProperties {
  const primaryHsl = hexToHslTriplet(primaryHex);
  const secondaryHsl = hexToHslTriplet(secondaryHex);
  const style: Record<string, string> = {};
  if (primaryHsl) {
    style['--primary'] = primaryHsl;
    style['--ring'] = primaryHsl;
    style['--sidebar-primary'] = primaryHsl;
  }
  if (secondaryHsl) {
    style['--accent'] = secondaryHsl;
    style['--sidebar-accent'] = secondaryHsl;
  }
  return style as CSSProperties;
}
