import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantOnboardingValidator } from '@/components/tenants/TenantOnboardingValidator';

export default function TenantValidatorPage() {
  return (
    <PageLayout>
      <PageContent
        title="Tenant Onboarding Validator"
        description="Validate tenant data for completeness, affordability, and compliance"
      >
        <TenantOnboardingValidator />
      </PageContent>
    </PageLayout>
  );
}
