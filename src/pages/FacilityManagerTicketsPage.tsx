import StaffServiceTicketsPage from '@/pages/StaffServiceTicketsPage';

/** Facility manager / vendor queue — same list UI with assignment-scoped API results. */
export default function FacilityManagerTicketsPage() {
  return (
    <StaffServiceTicketsPage
      basePath="/facility-manager/tickets"
      listMode="assigned"
      title="My assigned tickets"
      description="Update status, resolve on site, and keep SLA compliance visible."
    />
  );
}
