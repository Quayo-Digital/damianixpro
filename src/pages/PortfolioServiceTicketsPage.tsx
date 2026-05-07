import StaffServiceTicketsPage from '@/pages/StaffServiceTicketsPage';

/** Owner / agent / manager portfolio view of enterprise tickets. */
export default function PortfolioServiceTicketsPage() {
  return (
    <StaffServiceTicketsPage
      basePath="/maintenance/service-tickets"
      listMode="portfolio"
      title="Service tickets"
      description="Open tickets on behalf of tenants (tenant_id) or review the portfolio queue with SLA visibility."
    />
  );
}
