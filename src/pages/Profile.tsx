import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card } from '@/components/ui/card';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { AccountInfo } from '@/components/profile/AccountInfo';

const Profile = () => {
  return (
    <PageLayout>
      <PageContent title="My Profile" description="View and update your profile information.">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <PersonalInfoForm />
          </Card>

          <Card>
            <AccountInfo />
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default Profile;
