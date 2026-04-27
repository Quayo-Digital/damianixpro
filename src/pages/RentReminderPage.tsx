import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { RentReminderGenerator } from '@/components/tenants/RentReminderGenerator';

export default function RentReminderPage() {
  return (
    <PageLayout>
      <PageContent
        title="Rent Reminder Generator"
        description="Generate professional annual rent reminders based on payment history and tenant behavior"
      >
        <RentReminderGenerator />
      </PageContent>
    </PageLayout>
  );
}
