import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KYCVerificationDashboard } from '../KYCVerificationDashboard';
import { TestAppShell } from '@/tests/testProviders';

const { mockUseNigerianApis } = vi.hoisted(() => ({
  mockUseNigerianApis: vi.fn(),
}));

vi.mock('@/hooks/useNigerianApis', () => ({
  useNigerianApis: mockUseNigerianApis,
}));

vi.mock('../BVNVerificationForm', () => ({
  BVNVerificationForm: () => <div>BVN form</div>,
}));
vi.mock('../NINVerificationForm', () => ({
  NINVerificationForm: () => <div>NIN form</div>,
}));
vi.mock('../CACVerificationForm', () => ({
  CACVerificationForm: () => <div>CAC form</div>,
}));
vi.mock('../BankVerificationForm', () => ({
  BankVerificationForm: () => <div>Bank form</div>,
}));
vi.mock('../PhoneVerificationForm', () => ({
  PhoneVerificationForm: () => <div>Phone form</div>,
}));

const baseHookValue = {
  kycProfile: null,
  isLoadingKyc: false,
  canUseNigerianApis: true,
  getVerificationLevel: () => 'Basic',
  getVerificationProgress: () => 0,
  getRiskLevelColor: () => 'gray',
  isLoadingProviders: false,
  isRefreshingProviders: false,
  providerStatusCheckedAt: Date.now(),
  refetchProviderStatus: vi.fn().mockResolvedValue(undefined),
};

function renderKyc(ui: ReactElement) {
  return render(<TestAppShell>{ui}</TestAppShell>);
}

describe('KYCVerificationDashboard provider status contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows provider setup warning when at least one provider is not configured', () => {
    mockUseNigerianApis.mockReturnValue({
      ...baseHookValue,
      providerStatus: {
        youverify: false,
        appruve: true,
        paystack: false,
        flutterwave: true,
        nibss: false,
        custom: false,
      },
    });

    renderKyc(<KYCVerificationDashboard />);

    expect(screen.getByText(/provider setup required:/i)).toBeInTheDocument();
    expect(screen.getByText(/YouVerify \(YOUVERIFY_API_KEY\)/i)).toBeInTheDocument();
  });

  it('hides provider setup warning when all required providers are configured', () => {
    mockUseNigerianApis.mockReturnValue({
      ...baseHookValue,
      providerStatus: {
        youverify: true,
        appruve: true,
        paystack: false,
        flutterwave: true,
        nibss: false,
        custom: false,
      },
    });

    renderKyc(<KYCVerificationDashboard />);

    expect(screen.queryByText(/provider setup required:/i)).not.toBeInTheDocument();
  });

  it('invokes provider status refresh when refresh button is clicked', () => {
    const refetchProviderStatus = vi.fn().mockResolvedValue(undefined);
    mockUseNigerianApis.mockReturnValue({
      ...baseHookValue,
      providerStatus: {
        youverify: true,
        appruve: true,
        paystack: false,
        flutterwave: true,
        nibss: false,
        custom: false,
      },
      refetchProviderStatus,
    });

    renderKyc(<KYCVerificationDashboard compact />);
    fireEvent.click(screen.getByRole('button', { name: /refresh provider status/i }));

    expect(refetchProviderStatus).toHaveBeenCalledTimes(1);
  });
});
