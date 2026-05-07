import StaffServiceTicketsPage from '@/pages/StaffServiceTicketsPage';

export default function VendorMaintenanceTicketsPage() {
  return (
    <StaffServiceTicketsPage
      basePath="/vendor/maintenance-tickets"
      listMode="assigned"
      title="Assigned service tickets"
      description="Vendor view of tickets assigned to your account."
    />
  );
}
