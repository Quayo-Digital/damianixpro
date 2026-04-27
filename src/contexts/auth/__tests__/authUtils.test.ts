/**
 * Unit tests for auth utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getUserDisplayName,
  getUserInitials,
  formatPhoneNumber,
  isValidUserRole,
  checkIsAdmin,
  checkIsOwner,
  getRoleDisplay,
} from '../authUtils';

vi.mock('@/integrations/supabase/client', () => ({}));

describe('authUtils', () => {
  describe('getUserDisplayName', () => {
    it('returns full name from user_metadata', () => {
      expect(
        getUserDisplayName({ user_metadata: { full_name: 'John Doe' }, email: 'john@test.com' })
      ).toBe('John Doe');
    });

    it('returns email prefix when no full_name', () => {
      expect(getUserDisplayName({ email: 'john@example.com' })).toBe('john');
    });

    it('returns Guest for null/undefined', () => {
      expect(getUserDisplayName(null)).toBe('Guest');
      expect(getUserDisplayName(undefined)).toBe('Guest');
    });
  });

  describe('getUserInitials', () => {
    it('returns initials from full name', () => {
      expect(
        getUserInitials({ user_metadata: { full_name: 'John Doe' }, email: 'john@test.com' })
      ).toBe('JD');
    });

    it('returns first letter of email when no full name', () => {
      expect(getUserInitials({ email: 'john@example.com' })).toBe('J');
    });

    it('returns G for null', () => {
      expect(getUserInitials(null)).toBe('G');
    });
  });

  describe('formatPhoneNumber', () => {
    it('adds 234 for numbers starting with 0', () => {
      expect(formatPhoneNumber('08012345678')).toBe('2348012345678');
    });

    it('preserves 234 prefix', () => {
      expect(formatPhoneNumber('2348012345678')).toBe('2348012345678');
    });

    it('strips non-numeric characters', () => {
      expect(formatPhoneNumber('080-1234-5678')).toBe('2348012345678');
    });
  });

  describe('isValidUserRole', () => {
    it('accepts valid roles', () => {
      expect(isValidUserRole('admin')).toBe(true);
      expect(isValidUserRole('owner')).toBe(true);
      expect(isValidUserRole('tenant')).toBe(true);
    });

    it('rejects invalid roles', () => {
      expect(isValidUserRole('invalid')).toBe(false);
      expect(isValidUserRole('')).toBe(false);
    });
  });

  describe('checkIsAdmin', () => {
    it('returns true for admin and super_admin', () => {
      expect(checkIsAdmin('admin')).toBe(true);
      expect(checkIsAdmin('super_admin')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(checkIsAdmin('owner')).toBe(false);
      expect(checkIsAdmin(null)).toBe(false);
    });
  });

  describe('getRoleDisplay', () => {
    it('returns display names for roles', () => {
      expect(getRoleDisplay('admin')).toBe('Administrator');
      expect(getRoleDisplay('owner')).toBe('Property Owner');
      expect(getRoleDisplay('tenant')).toBe('Tenant');
      expect(getRoleDisplay(null)).toBe('Guest');
    });
  });
});
