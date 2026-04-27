import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicRoutes } from './routes/PublicRoutes';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { UserRole } from '@/contexts/auth/types';
import { PageLoader } from '@/components/ui/PageLoader';

/** Role lists aligned with `nav-config` visibility (+ `super_admin` where admins have access). */
const NAV_ANALYTICS_ROLES: UserRole[] = ['admin', 'super_admin', 'owner', 'agent', 'manager'];
const NAV_ANALYTICS_ADMIN_CHILD_ROLES: UserRole[] = ['admin', 'super_admin'];
const NAV_PROPERTY_MGMT_ROLES: UserRole[] = ['owner', 'agent', 'manager', 'admin', 'super_admin'];
const NAV_AGENT_PORTAL_ROLES: UserRole[] = ['agent', 'manager'];
const NAV_TENANT_MGMT_ROLES: UserRole[] = ['admin', 'super_admin', 'owner', 'agent', 'manager'];
const NAV_MAINTENANCE_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'owner',
  'agent',
  'manager',
  'tenant',
];
const NAV_TEMPLATES_REPORTS_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'owner',
  'agent',
  'manager',
];
const NAV_OWNER_FINANCE_ROLES: UserRole[] = ['owner', 'super_admin'];
const NAV_BLOG_EDITOR_ROLES: UserRole[] = ['admin', 'super_admin'];
const VERIFICATION_HUB_ROLES: UserRole[] = ['owner', 'tenant', 'agent', 'vendor', 'manager'];

// Lazy load pages that are also used in PublicRoutes to avoid code-splitting conflicts
const NotFound = lazy(() => import('./pages/NotFound'));
const Home = lazy(() => import('./pages/Home'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const NewBlogPost = lazy(() => import('./pages/NewBlogPost'));
const EditBlogPost = lazy(() => import('./pages/EditBlogPost'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const OwnerDashboardPage = lazy(() => import('@/pages/OwnerDashboardPage'));
const TenantDashboardPage = lazy(() => import('@/pages/TenantDashboardPage'));
const TenantPortalRedirect = lazy(() => import('@/pages/TenantPortalRedirect'));
const TenantAnnouncementsPage = lazy(() => import('@/pages/tenant/TenantAnnouncementsPage'));
const TenantCommunityPage = lazy(() => import('@/pages/tenant/TenantCommunityPage'));
const TenantInspectionsPage = lazy(() => import('@/pages/tenant/TenantInspectionsPage'));
const TenantFinancialPage = lazy(() => import('@/pages/tenant/TenantFinancialPage'));
const TenantTemplatesPage = lazy(() => import('@/pages/tenant/TenantTemplatesPage'));
const Properties = lazy(() => import('@/pages/Properties'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const PropertyCopywriter = lazy(() => import('@/pages/PropertyCopywriter'));
const PropertyAnalyzer = lazy(() => import('@/pages/PropertyAnalyzer'));
const TenantValidator = lazy(() => import('@/pages/TenantValidator'));
const RentReminder = lazy(() => import('@/pages/RentReminderPage'));
const RentReminderMessage = lazy(() => import('@/pages/RentReminderMessagePage'));
const PaymentActivitySummary = lazy(() => import('@/pages/PaymentActivitySummaryPage'));
const PaymentStatus = lazy(() => import('@/pages/PaymentStatusPage'));
const MaintenanceClassifier = lazy(() => import('@/pages/MaintenanceClassifierPage'));
const MaintenanceUpdate = lazy(() => import('@/pages/MaintenanceUpdatePage'));
const PortfolioAnalyzer = lazy(() => import('@/pages/PortfolioAnalyzerPage'));
const PropertyAnomaly = lazy(() => import('@/pages/PropertyAnomalyPage'));
const RentCollectionAnalyzer = lazy(() => import('@/pages/RentCollectionAnalyzerPage'));
const DisputePredictor = lazy(() => import('@/pages/DisputePredictorPage'));
const UsageAnalytics = lazy(() => import('@/pages/UsageAnalyticsPage'));
const BillingAssistant = lazy(() => import('@/pages/BillingAssistantPage'));
const PaymentValidator = lazy(() => import('@/pages/PaymentValidatorPage'));
const PaymentWebhookInterpreterPage = lazy(() => import('@/pages/PaystackWebhookPage'));
const LedgerPosting = lazy(() => import('@/pages/LedgerPostingPage'));
const FailedTransactionAnalyzer = lazy(() => import('@/pages/FailedTransactionAnalyzerPage'));
const PenaltyDiscountExplainer = lazy(() => import('@/pages/PenaltyDiscountExplainerPage'));
const AgentCommissionCalculator = lazy(() => import('@/pages/AgentCommissionCalculatorPage'));
const BillingAuditSummary = lazy(() => import('@/pages/BillingAuditSummaryPage'));
const BillingHealthScanner = lazy(() => import('@/pages/BillingHealthScannerPage'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Finance = lazy(() => import('@/pages/Finance'));
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
const VerificationHubPage = lazy(() => import('@/pages/VerificationHubPage'));
const Inspections = lazy(() => import('@/pages/Inspections'));
const Templates = lazy(() => import('@/pages/Templates'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const RedeemSuperAdmin = lazy(() => import('@/pages/RedeemSuperAdmin'));
const PaymentAccountingPage = lazy(() => import('@/pages/PaymentAccounting'));
const OwnerPaymentsPage = lazy(() => import('@/pages/OwnerPayments'));
const PaymentsRedirectPage = lazy(() => import('@/pages/PaymentsRedirectPage'));
const OwnerSubscriptionPage = lazy(() => import('@/pages/OwnerSubscriptionPage'));
const TransactionDetailPage = lazy(() => import('@/pages/TransactionDetailPage'));
const Messages = lazy(() => import('@/pages/Messages'));
const VendorDashboardPage = lazy(() => import('@/pages/VendorDashboardPage'));
const VendorMaintenancePage = lazy(() => import('@/pages/VendorMaintenancePage'));
const EnhancedAgentDashboardPage = lazy(() => import('@/pages/EnhancedAgentDashboardPage'));
const EnhancedOwnerDashboardPage = lazy(() => import('@/pages/EnhancedOwnerDashboardPage'));
const EnhancedTenantDashboardPage = lazy(() => import('@/pages/EnhancedTenantDashboardPage'));
const ResidentCenterPage = lazy(() => import('@/pages/ResidentCenterPage'));
const Reports = lazy(() => import('@/pages/Reports'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage'));
const AdminSupportPage = lazy(() => import('@/pages/admin/AdminSupportPage'));
const AdminBillingPage = lazy(() => import('@/pages/admin/AdminBillingPage'));
const AdminFeaturesPage = lazy(() => import('@/pages/admin/AdminFeaturesPage'));
const AdminTourRequestsPage = lazy(() => import('@/pages/admin/AdminTourRequestsPage'));
const AdminWhiteLabelPreviewPage = lazy(() => import('@/pages/admin/AdminWhiteLabelPreviewPage'));
const TestingPage = lazy(() => import('@/pages/TestingPage'));
const PaymentTestingPage = lazy(() => import('@/pages/PaymentTestingPage'));
const PlatformOptimizationPage = lazy(() => import('@/pages/PlatformOptimizationPage'));
const MobileDemo = lazy(() => import('@/pages/MobileDemo'));
const MobileDemoSimple = lazy(() => import('@/pages/MobileDemoSimple'));
const TestingPageMinimal = lazy(() => import('@/pages/TestingPageMinimal'));
const SecurityPerformancePage = lazy(() => import('@/pages/SecurityPerformancePage'));
const ComprehensiveOptimizationQAPage = lazy(
  () => import('@/pages/ComprehensiveOptimizationQAPage')
);
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
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AgentPricingPage = lazy(() => import('@/pages/AgentPricingPage'));
const SubscriptionSuccessPage = lazy(() => import('@/pages/SubscriptionSuccessPage'));
const PaymentCallbackPage = lazy(() => import('@/pages/PaymentCallbackPage'));
const SolutionAudiencePage = lazy(() => import('@/pages/SolutionAudiencePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const CareersPage = lazy(() => import('@/pages/CareersPage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const Sales = lazy(() => import('@/pages/Sales'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root route shows the landing page or redirects to dashboard */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        }
      />

      {/* Auth Routes */}
      <Route path="/auth/*" element={<PublicRoutes />} />
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<PageLoader />}>
            <AuthCallback />
          </Suspense>
        }
      />

      {/* Public Routes */}
      <Route path="/public/*" element={<PublicRoutes />} />

      {/* Blog Routes */}
      <Route
        path="/blog"
        element={
          <Suspense fallback={<PageLoader />}>
            <Blog />
          </Suspense>
        }
      />
      <Route
        path="/blog/new"
        element={
          <ProtectedRoute allowedRoles={NAV_BLOG_EDITOR_ROLES}>
            <Suspense fallback={<PageLoader />}>
              <NewBlogPost />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/edit/:slug"
        element={
          <ProtectedRoute allowedRoles={NAV_BLOG_EDITOR_ROLES}>
            <Suspense fallback={<PageLoader />}>
              <EditBlogPost />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <BlogPost />
          </Suspense>
        }
      />

      {/* Contact Route */}
      <Route
        path="/contact"
        element={
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        }
      />
      <Route
        path="/pricing/agents"
        element={
          <Suspense fallback={<PageLoader />}>
            <AgentPricingPage />
          </Suspense>
        }
      />
      <Route
        path="/subscription/success"
        element={
          <Suspense fallback={<PageLoader />}>
            <SubscriptionSuccessPage />
          </Suspense>
        }
      />
      <Route
        path="/payment/callback"
        element={
          <Suspense fallback={<PageLoader />}>
            <PaymentCallbackPage />
          </Suspense>
        }
      />
      <Route
        path="/solutions/:audience"
        element={
          <Suspense fallback={<PageLoader />}>
            <SolutionAudiencePage />
          </Suspense>
        }
      />
      <Route
        path="/about"
        element={
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        }
      />
      <Route
        path="/careers"
        element={
          <Suspense fallback={<PageLoader />}>
            <CareersPage />
          </Suspense>
        }
      />
      <Route
        path="/help"
        element={
          <Suspense fallback={<PageLoader />}>
            <HelpCenterPage />
          </Suspense>
        }
      />
      <Route
        path="/privacy"
        element={
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicyPage />
          </Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <Suspense fallback={<PageLoader />}>
            <TermsOfServicePage />
          </Suspense>
        }
      />
      <Route
        path="/sales"
        element={
          <Suspense fallback={<PageLoader />}>
            <Sales />
          </Suspense>
        }
      />

      {/* Application Routes */}
      <Route path="/apply/*" element={<PublicRoutes />} />
      <Route path="/application-success/*" element={<PublicRoutes />} />

      {/* Short-Let Routes (Public - for browsing) */}
      <Route
        path="/shortlets"
        element={
          <Suspense fallback={<PageLoader />}>
            <ShortletListingsPage mode="public" />
          </Suspense>
        }
      />
      <Route
        path="/shortlets/search"
        element={
          <Suspense fallback={<PageLoader />}>
            <ShortletSearchPage />
          </Suspense>
        }
      />
      <Route
        path="/shortlets/:listingId"
        element={
          <Suspense fallback={<PageLoader />}>
            <ShortletListingPage />
          </Suspense>
        }
      />

      {/* Booking Routes (Protected - requires authentication) */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <BookingsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:bookingId"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <BookingDetailPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Onboarding />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testing"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <TestingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testing-minimal"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <TestingPageMinimal />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-testing"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PaymentTestingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/platform-optimization"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PlatformOptimizationPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/comprehensive-qa"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ComprehensiveOptimizationQAPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={NAV_ANALYTICS_ROLES}>
            <Suspense fallback={<div>Loading...</div>}>
              <AnalyticsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics-testing"
        element={
          <ProtectedRoute allowedRoles={NAV_ANALYTICS_ADMIN_CHILD_ROLES}>
            <Suspense fallback={<div>Loading...</div>}>
              <AnalyticsTestingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production-testing"
        element={
          <ProtectedRoute allowedRoles={NAV_ANALYTICS_ADMIN_CHILD_ROLES}>
            <Suspense fallback={<div>Loading...</div>}>
              <ProductionTestingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-data-demo"
        element={
          <ProtectedRoute allowedRoles={NAV_ANALYTICS_ROLES}>
            <Suspense fallback={<div>Loading...</div>}>
              <LiveDataDemoPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin-redeem"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <RedeemSuperAdmin />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminUsersPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminRolesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminSupportPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminBillingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/features"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminFeaturesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tour-requests"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminTourRequestsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/white-label-preview"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <AdminWhiteLabelPreviewPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <EnhancedOwnerDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/legacy-dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <OwnerDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/payments"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <OwnerPaymentsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/subscription"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <OwnerSubscriptionPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PaymentsRedirectPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <TransactionDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/shortlets"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <ShortletListingsPage mode="owner" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/shortlets/:listingId"
          element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}>
                <ShortletListingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/dashboard"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <EnhancedTenantDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resident-center"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <ResidentCenterPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/legacy-dashboard"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant-portal"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantPortalRedirect />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/announcements"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantAnnouncementsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/community"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantCommunityPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/inspections"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantInspectionsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/financial"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantFinancialPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/templates"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Suspense fallback={<PageLoader />}>
                <TenantTemplatesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/properties"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Properties />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PropertyDetail />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/copywriter"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PropertyCopywriter />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/analyzer"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PropertyAnalyzer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/validator"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <TenantValidator />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/reminders"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <RentReminder />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/reminder-messages"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <RentReminderMessage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/payment-activity"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PaymentActivitySummary />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/payment-status"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PaymentStatus />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/classifier"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <MaintenanceClassifier />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/update"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <MaintenanceUpdate />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/analyzer"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PortfolioAnalyzer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/anomalies"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PropertyAnomaly />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/rent-collection"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <RentCollectionAnalyzer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/dispute-predictor"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <DisputePredictor />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/usage"
          element={
            <ProtectedRoute allowedRoles={NAV_ANALYTICS_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <UsageAnalytics />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/assistant"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <BillingAssistant />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/validator"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PaymentValidator />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/webhook-interpreter"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PaymentWebhookInterpreterPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/ledger-posting"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <LedgerPosting />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/failed-transaction"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <FailedTransactionAnalyzer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/penalty-discount"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <PenaltyDiscountExplainer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/agent-commission"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <AgentCommissionCalculator />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/audit-summary"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <BillingAuditSummary />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/health-scan"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <BillingHealthScanner />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <Suspense fallback={<PageLoader />}>
              <Documents />
            </Suspense>
          }
        />

        <Route
          path="/documentation"
          element={
            <Suspense fallback={<PageLoader />}>
              <Documentation />
            </Suspense>
          }
        />

        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <Finance />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounting"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<PageLoader />}>
                <PaymentAccountingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute requiredRole="vendor">
              <Suspense fallback={<PageLoader />}>
                <VendorDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/maintenance"
          element={
            <ProtectedRoute requiredRole="vendor">
              <Suspense fallback={<PageLoader />}>
                <VendorMaintenancePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/dashboard"
          element={
            <ProtectedRoute allowedRoles={NAV_AGENT_PORTAL_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <EnhancedAgentDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* <Route path="/leases" element={<Suspense fallback={<PageLoader />}><LeaseManagement /></Suspense>} /> */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Notifications />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <Suspense fallback={<PageLoader />}>
              <Messages />
            </Suspense>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={NAV_OWNER_FINANCE_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Finance />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Tenants />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <Suspense fallback={<PageLoader />}>
              <History />
            </Suspense>
          }
        />
        <Route
          path="/tenant-management"
          element={
            <ProtectedRoute allowedRoles={NAV_TENANT_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <TenantManagement />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant-onboarding"
          element={
            <Suspense fallback={<PageLoader />}>
              <TenantOnboarding />
            </Suspense>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute allowedRoles={NAV_MAINTENANCE_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Maintenance />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/requests"
          element={
            <ProtectedRoute allowedRoles={NAV_MAINTENANCE_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <MaintenanceRequests />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/vendors"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <MaintenanceVendors />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections"
          element={
            <ProtectedRoute allowedRoles={NAV_PROPERTY_MGMT_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Inspections />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute allowedRoles={NAV_TEMPLATES_REPORTS_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Templates />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_HUB_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <VerificationHubPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={NAV_TEMPLATES_REPORTS_ROLES}>
              <Suspense fallback={<PageLoader />}>
                <Reports />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/security-performance"
          element={
            <Suspense fallback={<PageLoader />}>
              <SecurityPerformancePage />
            </Suspense>
          }
        />
        <Route
          path="/mobile-demo"
          element={
            <Suspense fallback={<PageLoader />}>
              <MobileDemo />
            </Suspense>
          }
        />
        <Route
          path="/mobile-demo-simple"
          element={
            <Suspense fallback={<PageLoader />}>
              <MobileDemoSimple />
            </Suspense>
          }
        />
        <Route
          path="/mobile-camera-demo"
          element={
            <Suspense fallback={<PageLoader />}>
              <MobileCameraDemoPage />
            </Suspense>
          }
        />
      </Route>

      {/* Unauthorized Route */}
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<PageLoader />}>
            <Unauthorized />
          </Suspense>
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
