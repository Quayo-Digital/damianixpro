import { describe, expect, it } from 'vitest';
import {
  getPostLoginRedirect,
  isProtectedPropertyManagementPath,
  withSearchParam,
} from './authRedirect';
import type { Location } from 'react-router-dom';

describe('authRedirect — first-time tenant apply flow', () => {
  it('preserves public property URL with apply=1 for tenant role', () => {
    const from: Pick<Location, 'pathname' | 'search' | 'hash' | 'state'> = {
      pathname: '/public/properties/abc-123',
      search: '?apply=1',
      hash: '',
      state: null,
    };
    const target = getPostLoginRedirect(from, 'tenant');
    expect(target).not.toBe('/dashboard');
    if (target !== '/dashboard') {
      expect(target.pathname).toBe('/public/properties/abc-123');
      expect(target.search).toContain('apply=1');
    }
  });

  it('does not treat public property paths as owner/agent management URLs', () => {
    expect(isProtectedPropertyManagementPath('/public/properties/x')).toBe(false);
  });

  it('withSearchParam merges apply intent into current location', () => {
    const loc: Pick<Location, 'pathname' | 'search' | 'hash'> = {
      pathname: '/public/properties/p1',
      search: '',
      hash: '',
    };
    const merged = withSearchParam(loc as Location, 'apply', '1');
    expect(merged.pathname).toBe('/public/properties/p1');
    expect(merged.search).toBe('?apply=1');
  });
});
