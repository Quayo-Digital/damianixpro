
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { VendorMaintenanceManagement } from '@/components/vendor/VendorMaintenanceManagement';

const VendorMaintenancePage = () => {
  return (
    <PageLayout>
      <PageContent title="My Maintenance Jobs" description="View and manage your assigned maintenance tasks.">
        <VendorMaintenanceManagement />
      </PageContent>
    </PageLayout>
  );
};

export default VendorMaintenancePage;
