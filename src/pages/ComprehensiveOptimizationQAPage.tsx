import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { ComprehensiveOptimizationQA } from '@/components/testing/ComprehensiveOptimizationQA';

export const ComprehensiveOptimizationQAPage: React.FC = () => {
  return (
    <PageLayout>
      <PageContent 
        title="Comprehensive Optimization QA" 
        description="Complete validation and testing of all optimization features"
      >
        <ComprehensiveOptimizationQA />
      </PageContent>
    </PageLayout>
  );
};

export default ComprehensiveOptimizationQAPage;
