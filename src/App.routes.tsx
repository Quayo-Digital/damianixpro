
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicRoutes } from './routes/PublicRoutes';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoader } from '@/components/ui/PageLoader';
import Finance from '@/pages/Finance'; // Eagerly import Finance

// Lazy load pages that are also used in PublicRoutes to avoid code-splitting conflicts
const NotFound = lazy(() => import('./pages/NotFound'));
const Home = lazy(() => import('./pages/Home'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const NewBlogPost = lazy(() => import('./pages/NewBlogPost'));
const EditBlogPost = lazy(() => import('./pages/EditBlogPost'));

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const OwnerDashboardPage = lazy(() => import('@/pages/OwnerDashboardPage'));
const TenantDashboardPage = lazy(() => import('@/pages/TenantDashboardPage'));
const TenantPortal = lazy(() => import('@/pages/TenantPortal'));
const Properties = lazy(() => import('@/pages/Properties'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const Notifications = lazy(() => import('@/pages/Notifications'));
// const Finance = lazy(() => import('@/pages/Finance')); // Removed lazy import
const Tenants = lazy(() => import('@/pages/Tenants'));
const History = lazy(() => import('@/pages/History'));
const TenantManagement = lazy(() => import('@/pages/TenantManagement'));
const TenantOnboarding = lazy(() => import('@/pages/TenantOnboarding'));
const Documents = lazy(() => import('@/pages/Documents'));
const Documentation = lazy(() => import('@/pages/Documentation'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const MaintenanceRequests = lazy(() => import('@/pages/MaintenanceRequests'));
const MaintenanceVendors = lazy(() => import('@/pages/MaintenanceVendors'));
const Settings = lazy(() => import('@/pages/Settings'));
const Inspections = lazy(() => import('@/pages/Inspections'));
const Templates = lazy(() => import('@/pages/Templates'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const RedeemSuperAdmin = lazy(() => import('@/pages/RedeemSuperAdmin'));
const PaymentAccountingPage = lazy(() => import('@/pages/PaymentAccounting'));
const OwnerPaymentsPage = lazy(() => import('@/pages/OwnerPayments'));
const Messages = lazy(() => import('@/pages/Messages'));
const VendorDashboardPage = lazy(() => import('@/pages/VendorDashboardPage'));
const VendorMaintenancePage = lazy(() => import('@/pages/VendorMaintenancePage'));
const EnhancedAgentDashboardPage = lazy(() => import('@/pages/EnhancedAgentDashboardPage'));
const EnhancedOwnerDashboardPage = lazy(() => import('@/pages/EnhancedOwnerDashboardPage'));
const EnhancedTenantDashboardPage = lazy(() => import('@/pages/EnhancedTenantDashboardPage'));
const Reports = lazy(() => import('@/pages/Reports'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage'));
const AdminSupportPage = lazy(() => import('@/pages/admin/AdminSupportPage'));
const AdminBillingPage = lazy(() => import('@/pages/admin/AdminBillingPage'));
const AdminFeaturesPage = lazy(() => import('@/pages/admin/AdminFeaturesPage'));
const TestingPage = lazy(() => import('@/pages/TestingPage'));
const PaymentTestingPage = lazy(() => import('@/pages/PaymentTestingPage'));
const PlatformOptimizationPage = lazy(() => import('@/pages/PlatformOptimizationPage'));
const MobileDemo = lazy(() => import('@/pages/MobileDemo'));
const MobileDemoSimple = lazy(() => import('@/pages/MobileDemoSimple'));
const TestingPageMinimal = lazy(() => import('@/pages/TestingPageMinimal'));
const SecurityPerformancePage = lazy(() => import('@/pages/SecurityPerformancePage'));
const ComprehensiveOptimizationQAPage = lazy(() => import('@/pages/ComprehensiveOptimizationQAPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const AnalyticsTestingPage = lazy(() => import('@/pages/AnalyticsTestingPage'));
const ProductionTestingPage = lazy(() => import('@/pages/ProductionTestingPage'));
const LiveDataDemoPage = lazy(() => import('@/pages/LiveDataDemoPage'));
const MobileCameraDemoPage = lazy(() => import('@/pages/MobileCameraDemoPage'));
const ShortletSearchPage = lazy(() => import('@/pages/ShortletSearchPage'));
const ShortletListingPage = lazy(() => import('@/pages/ShortletListingPage'));
const ShortletListingsPage = lazy(() => import('@/pages/ShortletListingsPage'));
const BookingsPage = lazy(() => import('@/pages/BookingsPage'));
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root route shows the landing page or redirects to dashboard */}
      <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
      
      {/* Auth Routes */}
      <Route path="/auth/*" element={<PublicRoutes />} />
      
      {/* Public Routes */}
      <Route path="/public/*" element={<PublicRoutes />} />
      
      {/* Blog Routes */}
      <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
      <Route path="/blog/new" element={<Suspense fallback={<PageLoader />}><NewBlogPost /></Suspense>} />
      <Route path="/blog/edit/:slug" element={<Suspense fallback={<PageLoader />}><EditBlogPost /></Suspense>} />
      <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPost /></Suspense>} />
      
      {/* Application Routes */}
      <Route path="/apply/*" element={<PublicRoutes />} />
      <Route path="/application-success" element={<PublicRoutes />} />
      
      {/* Short-Let Routes (Public) */}
      <Route path="/shortlets" element={<Suspense fallback={<PageLoader />}><ShortletListingsPage mode="public" /></Suspense>} />
      <Route path="/shortlets/search" element={<Suspense fallback={<PageLoader />}><ShortletSearchPage /></Suspense>} />
      <Route path="/shortlets/:listingId" element={<Suspense fallback={<PageLoader />}><ShortletListingPage /></Suspense>} />
      
      {/* Booking Routes */}
      <Route path="/bookings" element={<Suspense fallback={<PageLoader />}><BookingsPage /></Suspense>} />
      <Route path="/bookings/:bookingId" element={<Suspense fallback={<PageLoader />}><BookingDetailPage /></Suspense>} />
      
      {/* Protected Routes */}
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><Onboarding /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/testing" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><TestingPage /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/testing-minimal" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><TestingPageMinimal /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment-testing" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><PaymentTestingPage /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/platform-optimization" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><PlatformOptimizationPage /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/comprehensive-qa" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><ComprehensiveOptimizationQAPage /></Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'owner', 'agent']}>
            <Suspense fallback={<div>Loading...</div>}>
              <AnalyticsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics-testing" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<div>Loading...</div>}>
              <AnalyticsTestingPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/production-testing" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<div>Loading...</div>}>
              <ProductionTestingPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/live-data-demo" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'owner', 'agent']}>
            <Suspense fallback={<div>Loading...</div>}>
              <LiveDataDemoPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route path="/super-admin-redeem" element={<Suspense fallback={<PageLoader />}><RedeemSuperAdmin /></Suspense>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminRolesPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminSupportPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminBillingPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/features" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><AdminFeaturesPage /></Suspense></ProtectedRoute>} />

        <Route path="/owner/dashboard" element={<ProtectedRoute requiredRole="owner"><Suspense fallback={<PageLoader />}><EnhancedOwnerDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/owner/legacy-dashboard" element={<ProtectedRoute requiredRole="owner"><Suspense fallback={<PageLoader />}><OwnerDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/owner/payments" element={<ProtectedRoute requiredRole="owner"><Suspense fallback={<PageLoader />}><OwnerPaymentsPage /></Suspense></ProtectedRoute>} />
        <Route path="/owner/shortlets" element={<ProtectedRoute requiredRole="owner"><Suspense fallback={<PageLoader />}><ShortletListingsPage mode="owner" /></Suspense></ProtectedRoute>} />
        <Route path="/owner/shortlets/:listingId" element={<ProtectedRoute requiredRole="owner"><Suspense fallback={<PageLoader />}><ShortletListingPage /></Suspense></ProtectedRoute>} />
        <Route path="/tenant/dashboard" element={<ProtectedRoute requiredRole="tenant"><Suspense fallback={<PageLoader />}><EnhancedTenantDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/tenant/legacy-dashboard" element={<ProtectedRoute requiredRole="tenant"><Suspense fallback={<PageLoader />}><TenantDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/tenant-portal" element={<ProtectedRoute requiredRole="tenant"><Suspense fallback={<PageLoader />}><TenantPortal /></Suspense></ProtectedRoute>} />
        
        <Route path="/properties" element={<Suspense fallback={<PageLoader />}><Properties /></Suspense>} />
        <Route path="/properties/:id" element={<Suspense fallback={<PageLoader />}><PropertyDetail /></Suspense>} />
        
        <Route path="/documents" element={<Suspense fallback={<PageLoader />}><Documents /></Suspense>} />
        
        <Route path="/documentation" element={<Suspense fallback={<PageLoader />}><Documentation /></Suspense>} />

        <Route path="/admin/finance" element={<ProtectedRoute requiredRole="admin"><Finance /></ProtectedRoute>} />
        <Route path="/admin/accounting" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<PageLoader />}><PaymentAccountingPage /></Suspense></ProtectedRoute>} />

        <Route path="/vendor/dashboard" element={<ProtectedRoute requiredRole="vendor"><Suspense fallback={<PageLoader />}><VendorDashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/vendor/maintenance" element={<ProtectedRoute requiredRole="vendor"><Suspense fallback={<PageLoader />}><VendorMaintenancePage /></Suspense></ProtectedRoute>} />
        <Route path="/agent/dashboard" element={<ProtectedRoute requiredRole="agent"><Suspense fallback={<PageLoader />}><EnhancedAgentDashboardPage /></Suspense></ProtectedRoute>} />

        {/* <Route path="/leases" element={<Suspense fallback={<PageLoader />}><LeaseManagement /></Suspense>} /> */}
        <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><Notifications /></Suspense>} />
        <Route path="/messages" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/tenants" element={<Suspense fallback={<PageLoader />}><Tenants /></Suspense>} />
        <Route path="/history" element={<Suspense fallback={<PageLoader />}><History /></Suspense>} />
        <Route path="/tenant-management" element={<Suspense fallback={<PageLoader />}><TenantManagement /></Suspense>} />
        <Route path="/tenant-onboarding" element={<Suspense fallback={<PageLoader />}><TenantOnboarding /></Suspense>} />
        <Route path="/maintenance" element={<Suspense fallback={<PageLoader />}><Maintenance /></Suspense>} />
        <Route path="/maintenance/requests" element={<Suspense fallback={<PageLoader />}><MaintenanceRequests /></Suspense>} />
        <Route path="/maintenance/vendors" element={<Suspense fallback={<PageLoader />}><MaintenanceVendors /></Suspense>} />
        <Route path="/inspections" element={<Suspense fallback={<PageLoader />}><Inspections /></Suspense>} />
        <Route path="/templates" element={<Suspense fallback={<PageLoader />}><Templates /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="/testing" element={<Suspense fallback={<PageLoader />}><TestingPage /></Suspense>} />
        <Route path="/payment-testing" element={<Suspense fallback={<PageLoader />}><PaymentTestingPage /></Suspense>} />
        <Route path="/platform-optimization" element={<Suspense fallback={<PageLoader />}><PlatformOptimizationPage /></Suspense>} />
        <Route path="/security-performance" element={<Suspense fallback={<PageLoader />}><SecurityPerformancePage /></Suspense>} />
        <Route path="/mobile-demo" element={<Suspense fallback={<PageLoader />}><MobileDemo /></Suspense>} />
        <Route path="/mobile-demo-simple" element={<Suspense fallback={<PageLoader />}><MobileDemoSimple /></Suspense>} />
        <Route path="/mobile-camera-demo" element={<Suspense fallback={<PageLoader />}><MobileCameraDemoPage /></Suspense>} />
        <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="/analytics-testing" element={<Suspense fallback={<PageLoader />}><AnalyticsTestingPage /></Suspense>} />
      </Route>
      
      {/* Catch-all */}
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </Routes>
  );
};

export default AppRoutes;
