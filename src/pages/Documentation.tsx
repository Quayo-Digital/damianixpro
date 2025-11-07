
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { DocGenerator } from '@/components/documentation/DocGenerator';

const Documentation = () => {
  return (
    <PageLayout>
      <PageContent 
        title="System Documentation" 
        description="Comprehensive guides for all user roles"
      >
        <DocGenerator />
      </PageContent>
    </PageLayout>
  );
};

export default Documentation;
