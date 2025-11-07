
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DashboardActionItem } from "./DashboardActionItem";

export function SupportTicketsCard({ openTicketsByCategory }: { openTicketsByCategory?: { [key: string]: number } }) {
  const technicalTickets = openTicketsByCategory?.['maintenance'] || 0;
  const billingTickets = openTicketsByCategory?.['billing'] || 0;
  const featureRequests = openTicketsByCategory?.['feature_request'] || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>Customer support requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <DashboardActionItem
            title="Technical issues"
            description={`${technicalTickets} open tickets`}
            buttonText="View"
            linkTo="/admin/support"
          />
          <DashboardActionItem
            title="Billing inquiries"
            description={`${billingTickets} open tickets`}
            buttonText="View"
            linkTo="/admin/billing"
          />
          <DashboardActionItem
            title="Feature requests"
            description={`${featureRequests} open tickets`}
            buttonText="View"
            linkTo="/admin/features"
          />
        </div>
        <Button
          variant="outline"
          className="w-full mt-4"
          asChild
        >
          <Link to="/admin/support">View All Tickets</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
