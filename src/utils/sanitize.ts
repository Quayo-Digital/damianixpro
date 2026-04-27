/**
 * Input and HTML sanitization utilities for XSS protection.
 * Use for any user-provided content before rendering with dangerouslySetInnerHTML.
 */

/** Patterns that must be removed (scripts, event handlers, javascript: URIs). */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /\bon\w+\s*=\s*["'][^"']*["']/gi, // onclick, onerror, etc.
  /\bon\w+\s*=\s*[^\s>]+/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /expression\s*\(/gi, // IE legacy
];

/**
 * Sanitize HTML string for safe display. Removes scripts, iframes, event handlers,
 * and restricts to a safe subset of tags.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let out = html;

  // Remove dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    out = out.replace(pattern, '');
  }

  // Strip disallowed tags (keep only safe inline/block elements)
  out = out.replace(/<[^>]+>/g, (tag) => {
    const lower = tag.toLowerCase();
    const tagName = lower.match(/<\/?(\w+)/)?.[1] || '';
    const allowed = [
      'a',
      'b',
      'strong',
      'em',
      'i',
      'u',
      'br',
      'p',
      'div',
      'span',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'hr',
    ];
    if (allowed.includes(tagName)) {
      return tag.replace(/\s*on\w+=["'][^"']*["']/gi, '').replace(/\s*on\w+=\S+/gi, '');
    }
    return '';
  });

  // Sanitize href to prevent javascript: and data: URLs
  out = out.replace(
    /<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*)>/gi,
    (_, before, href, after) => {
      const h = href.trim().toLowerCase();
      if (h.startsWith('javascript:') || h.startsWith('data:') || h.startsWith('vbscript:')) {
        return '<a ' + before + 'href="#"' + after + '>';
      }
      return '<a ' + before + 'href="' + href + '"' + after + '>';
    }
  );

  return out;
}

/**
 * Escape HTML entities for plain text display (no HTML rendering).
 * Use when displaying user input as text only.
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return text.replace(/[&<>"'`=/]/g, (c) => map[c] ?? c);
}

/**
 * Sanitize plain text input (trim and limit length). Use for form inputs.
 */
export function sanitizeInput(
  value: string,
  options: { maxLength?: number; trim?: boolean } = {}
): string {
  const { maxLength = 10_000, trim = true } = options;
  let out = typeof value === 'string' ? value : String(value ?? '');
  if (trim) out = out.trim();
  return out.slice(0, maxLength);
}
