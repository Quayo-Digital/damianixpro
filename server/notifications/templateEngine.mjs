/**
 * Minimal `{{variable}}` template engine for notification copy.
 * Nested keys: {{tenant.name}} → vars['tenant.name'] or vars.tenant?.name (flat only for v1).
 */

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

function lookup(vars, key) {
  if (!vars || !key) return '';
  if (Object.prototype.hasOwnProperty.call(vars, key)) {
    const v = vars[key];
    return v == null ? '' : String(v);
  }
  const parts = key.split('.');
  let cur = vars;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return '';
    cur = cur[p];
  }
  return cur == null ? '' : String(cur);
}

/**
 * @param {string | null | undefined} template
 * @param {Record<string, unknown>} vars
 */
export function renderTemplate(template, vars) {
  if (template == null) return '';
  return String(template).replace(PLACEHOLDER, (_, key) => lookup(vars, key));
}
