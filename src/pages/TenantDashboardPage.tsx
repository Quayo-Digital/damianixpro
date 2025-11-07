
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantDashboard } from '@/components/communication/TenantDashboard';
import { useAuth } from '@/contexts/auth';
import { Navigate, useNavigate } from 'react-router-dom';

const TenantDashboardPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is a tenant
  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  const handleMakePayment = () => {
    // Navigate to tenant portal payments tab
    navigate('/tenant-portal#payments');
  };
  
  return (
    <PageLayout>
      <PageContent 
        title="Tenant Dashboard" 
        description="Manage your rent payments, maintenance requests, and documents"
      >
        <TenantDashboard onMakePayment={handleMakePayment} />
      </PageContent>
    </PageLayout>
  );
};

export default TenantDashboardPage;
