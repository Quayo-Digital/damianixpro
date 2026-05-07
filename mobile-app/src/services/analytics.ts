type EventName =
  | 'payment_init_started'
  | 'payment_webview_opened'
  | 'payment_verify_success'
  | 'payment_verify_failed';

type EventProps = Record<string, string | number | boolean | null | undefined>;

/**
 * Sprint 1 lightweight analytics adapter.
 * Replace internals with Amplitude/Firebase/PostHog SDK later.
 */
export const trackEvent = (name: EventName, props: EventProps = {}) => {
  // Keep this deterministic and non-throwing.
  // eslint-disable-next-line no-console
  console.log(`[analytics] ${name}`, props);
};
