import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AuthenticatorMfaSection } from '@/components/settings/AuthenticatorMfaSection';

const Settings = () => {
  return (
    <PageLayout>
      <PageContent title="Settings" description="Manage your account settings and preferences.">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <AuthenticatorMfaSection />
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default Settings;
