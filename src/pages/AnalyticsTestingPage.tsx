import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import AnalyticsSystemTest from '@/components/testing/AnalyticsSystemTest';

const AnalyticsTestingPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <AnalyticsSystemTest />
      </div>
    </PageLayout>
  );
};

export default AnalyticsTestingPage;
