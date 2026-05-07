/**
 * Render tests for ExecutiveAnalyticsDashboard.
 *
 * The recharts subtree is mocked because ResponsiveContainer cannot measure
 * itself in jsdom. We assert the surrounding shell instead: KPI cards,
 * top-properties table, error retry, and the scoped-empty empty state.
 */

import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  ExecutiveAnalyticsPayload,
  ExecutiveTopProperty,
} from '@/services/analytics/executiveAnalyticsApi';

const RENDER_TEST_TIMEOUT_MS = 20_000;

const { mockFetchExecutiveAnalytics } = vi.hoisted(() => ({
  mockFetchExecutiveAnalytics: vi.fn(),
}));

vi.mock('@/services/analytics/executiveAnalyticsApi', () => ({
  fetchExecutiveAnalytics: mockFetchExecutiveAnalytics,
}));

vi.mock('recharts', () => {
  // Returning null for the chart containers prevents the dashboard's
  // <defs>/<linearGradient> SVG primitives from being mounted into a non-svg
  // tree, which is both noisy and slow under jsdom.
  const Stub = () => null;
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: Stub,
    BarChart: Stub,
    Bar: Stub,
    CartesianGrid: Stub,
    Legend: Stub,
    Tooltip: Stub,
    XAxis: Stub,
    YAxis: Stub,
  };
});

import { ExecutiveAnalyticsDashboard } from '../ExecutiveAnalyticsDashboard';

function topProp(over: Partial<ExecutiveTopProperty> = {}): ExecutiveTopProperty {
  return {
    property_id: over.property_id ?? 'prop-1',
    name: over.name ?? 'Lekki Garden Estate',
    revenue_ngn: over.revenue_ngn ?? 1_250_000,
  };
}

function payload(over: Partial<ExecutiveAnalyticsPayload> = {}): ExecutiveAnalyticsPayload {
  return {
    range: { from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
    kpis: {
      total_revenue_ngn: 1_500_000,
      rent_collected_ngn: 1_500_000,
      rent_outstanding_ngn: 0,
      arrears_ngn: 75_000,
      occupancy_rate: 0.85,
      maintenance_costs_ngn: 250_000,
    },
    occupancy: { rate: 0.85, occupied_properties: 17, total_properties: 20 },
    series: {
      monthly: [
        { month: '2026-01', collected: 500_000, maintenance_ngn: 50_000 },
        { month: '2026-02', collected: 1_000_000, maintenance_ngn: 200_000 },
      ],
    },
    top_properties: [topProp()],
    filter_options: { properties: [{ id: 'prop-1', name: 'Lekki Garden Estate' }] },
    meta: { payment_rows_used: 12 },
    ...over,
  };
}

function wrapper(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('ExecutiveAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    'renders KPI values and the top-properties row from the payload',
    async () => {
      mockFetchExecutiveAnalytics.mockResolvedValue(payload());
      render(wrapper(<ExecutiveAnalyticsDashboard />));

      expect(
        await screen.findByText('Lekki Garden Estate', undefined, {
          timeout: RENDER_TEST_TIMEOUT_MS,
        })
      ).toBeInTheDocument();
      expect(screen.getAllByText('Revenue').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('85%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/17 \/ 20 properties/)).toBeInTheDocument();
      expect(screen.getByText(/17 occupied · 20 total in scope/)).toBeInTheDocument();
      expect(screen.getByText('Top performing properties')).toBeInTheDocument();
    },
    RENDER_TEST_TIMEOUT_MS
  );

  it(
    'shows the error card with a retry that re-invokes the fetcher',
    async () => {
      mockFetchExecutiveAnalytics
        .mockRejectedValueOnce(new Error('INVALID_DATE_RANGE'))
        .mockResolvedValueOnce(payload());

      render(wrapper(<ExecutiveAnalyticsDashboard />));

      expect(
        await screen.findByText('Unable to load analytics', undefined, {
          timeout: RENDER_TEST_TIMEOUT_MS,
        })
      ).toBeInTheDocument();
      expect(screen.getByText('INVALID_DATE_RANGE')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(
        await screen.findByText('Lekki Garden Estate', undefined, {
          timeout: RENDER_TEST_TIMEOUT_MS,
        })
      ).toBeInTheDocument();
      expect(mockFetchExecutiveAnalytics).toHaveBeenCalledTimes(2);
    },
    RENDER_TEST_TIMEOUT_MS
  );

  it(
    'renders the scoped_empty hint when the user has no properties in scope',
    async () => {
      mockFetchExecutiveAnalytics.mockResolvedValue(
        payload({
          kpis: {
            total_revenue_ngn: 0,
            rent_collected_ngn: 0,
            rent_outstanding_ngn: 0,
            arrears_ngn: null,
            occupancy_rate: 0,
            maintenance_costs_ngn: 0,
          },
          occupancy: { rate: 0, occupied_properties: 0, total_properties: 0 },
          series: { monthly: [] },
          top_properties: [],
          meta: { scoped_empty: true, arrears_available: false },
        })
      );

      render(wrapper(<ExecutiveAnalyticsDashboard />));

      expect(
        await screen.findByText(
          /No properties are linked to your account for this view/i,
          undefined,
          {
            timeout: RENDER_TEST_TIMEOUT_MS,
          }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.getByText(/No property revenue in this window/i)).toBeInTheDocument();
    },
    RENDER_TEST_TIMEOUT_MS
  );

  it(
    'passes selected date range and "all properties" sentinel to the fetcher',
    async () => {
      mockFetchExecutiveAnalytics.mockResolvedValue(payload());
      render(wrapper(<ExecutiveAnalyticsDashboard />));

      await waitFor(() => expect(mockFetchExecutiveAnalytics).toHaveBeenCalled(), {
        timeout: RENDER_TEST_TIMEOUT_MS,
      });

      const args = mockFetchExecutiveAnalytics.mock.calls[0][0] as {
        dateFrom: string;
        dateTo: string;
        propertyId?: string;
      };

      expect(args.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(args.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(args.propertyId).toBeUndefined();
    },
    RENDER_TEST_TIMEOUT_MS
  );
});
