import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantFriendlyMaintenanceUpdate } from '@/components/maintenance/TenantFriendlyMaintenanceUpdate';

export default function MaintenanceUpdatePage() {
  return (
    <PageLayout>
      <PageContent
        title="Tenant-Friendly Maintenance Update"
        description="Convert technical maintenance updates into clear, reassuring messages for tenants"
      >
        <TenantFriendlyMaintenanceUpdate />
      </PageContent>
    </PageLayout>
  );
}
