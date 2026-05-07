import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { OrganizationMigrationWizard } from '@/components/onboarding/migration/OrganizationMigrationWizard';

export default function OrganizationSetupPage() {
  return (
    <PageLayout>
      <PageContent
        title="Company setup & migration"
        description="Step-by-step onboarding and Excel-based imports for landlords and admins."
      >
        <OrganizationMigrationWizard />
      </PageContent>
    </PageLayout>
  );
}
