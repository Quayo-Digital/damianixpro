import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cached;

export function getRbacMatrix() {
  if (!cached) {
    const matrixPath = path.join(__dirname, '..', '..', 'config', 'rbac-permission-matrix.json');
    cached = JSON.parse(readFileSync(matrixPath, 'utf8'));
  }
  return cached;
}

/** @param {string | null | undefined} role */
export function getPermissionSetForRole(role) {
  const matrix = getRbacMatrix();
  const all = new Set();
  for (const list of Object.values(matrix.roles)) {
    for (const p of list) {
      if (p !== '*') all.add(p);
    }
  }
  if (!role) return new Set();
  if (role === 'super_admin') return all;
  const row = matrix.roles[role];
  if (!row) return new Set();
  if (row.includes('*')) return all;
  return new Set(row);
}
