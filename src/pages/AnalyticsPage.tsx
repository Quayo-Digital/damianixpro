import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <AnalyticsDashboard />
      </div>
    </PageLayout>
  );
};

export default AnalyticsPage;
