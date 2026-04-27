import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const appRoutesPath = path.resolve(process.cwd(), 'src/App.routes.tsx');

function extractRoutePaths(source: string): string[] {
  const matches = source.matchAll(/path="([^"]+)"/g);
  return [...matches].map((match) => match[1]);
}

describe('App route definitions', () => {
  it('has unique route paths', () => {
    const source = fs.readFileSync(appRoutesPath, 'utf8');
    const paths = extractRoutePaths(source);
    const duplicates = paths.filter((routePath, idx) => paths.indexOf(routePath) !== idx);

    expect(duplicates).toEqual([]);
  });

  it('contains critical routes expected by core flows', () => {
    const source = fs.readFileSync(appRoutesPath, 'utf8');
    const paths = extractRoutePaths(source);
    const requiredPaths = [
      '/',
      '/dashboard',
      '/analytics',
      '/finance',
      '/admin/finance',
      '/unauthorized',
      '*',
    ];

    for (const requiredPath of requiredPaths) {
      expect(paths).toContain(requiredPath);
    }
  });
});
