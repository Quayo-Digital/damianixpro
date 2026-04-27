import { useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SECURITY_CONFIG } from '@/utils/security';
import { logger } from '@/utils/logger';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;

/** Avoid resetting the inactivity timer on every mousemove (high frequency). */
const ACTIVITY_THROTTLE_MS = 1000;

/**
 * Hook to enforce session timeout on inactivity.
 * Calls onTimeout after `timeoutMinutes` of no user activity.
 * Only active when user is authenticated.
 */
export function useSessionTimeout(
  isAuthenticated: boolean,
  onTimeout: () => void,
  timeoutMinutes: number = DEFAULT_SECURITY_CONFIG.sessionTimeout
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const ms = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      logger.info('Session expired due to inactivity', { timeoutMinutes });
      onTimeout();
    }, ms);
  }, [onTimeout, timeoutMinutes]);

  useEffect(() => {
    if (!isAuthenticated) return;

    resetTimer();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
      lastThrottleRef.current = now;
      resetTimer();
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, resetTimer]);
}
