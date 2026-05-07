import React from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/contexts/auth';

interface PageGuide {
  explanation: string;
  nextAction: string;
  warning: string;
}

const pageGuides: Record<string, PageGuide> = {
  '/properties/copywriter': {
    explanation:
      'Generate professional property descriptions for listings, marketing, and WhatsApp sharing.',
    nextAction:
      'Fill in property type, location, and target tenant, then click "Generate Descriptions".',
    warning:
      'Make sure to select amenities that actually exist in the property to avoid misleading tenants.',
  },
  '/properties/analyzer': {
    explanation:
      'Analyze multi-unit properties to get suggested rent ranges, deposit recommendations, and maintenance cost expectations.',
    nextAction:
      'Enter property details including location, property type, number of units, and amenities.',
    warning:
      'Provide accurate property age and condition data for more reliable rent range suggestions.',
  },
  '/tenants/validator': {
    explanation:
      'Validate tenant onboarding data for completeness, affordability risks, and compliance issues.',
    nextAction:
      'Fill in all required tenant information including income, lease dates, and guarantor details.',
    warning:
      'Double-check rent-to-income ratio - if it exceeds 40%, the tenant may struggle to pay consistently.',
  },
  '/tenants/reminders': {
    explanation:
      'Generate professional rent reminder messages based on payment history and tenant behavior patterns.',
    nextAction:
      'Enter tenant details, payment history, and days overdue, then review the recommended reminder type.',
    warning:
      "Don't skip the payment history - it helps determine the appropriate tone (polite, firm, or final notice).",
  },
  '/tenants/reminder-messages': {
    explanation:
      'Generate rent reminder messages for SMS, WhatsApp, and Email with Flutterwave payment links. Messages are polite before due date and firm after.',
    nextAction:
      'Enter tenant details, payment status, and Flutterwave payment link, then generate and copy messages for each channel.',
    warning:
      'Always include the Flutterwave payment link - without it, tenants cannot make payments easily.',
  },
  '/tenants/payment-activity': {
    explanation:
      'Generate a timeline narrative of tenant payment activity including rent billings, payments made, wallet usage, penalties, and current balance.',
    nextAction:
      'Enter tenant information and JSON data for rent billings, payments, wallet transactions, and penalties, then generate the summary.',
    warning:
      'Ensure all dates are accurate and in chronological order - the timeline is sorted by date automatically.',
  },
  '/tenants/payment-status': {
    explanation:
      'Understand your payment status in simple language with a timeline of payments and clear next steps.',
    nextAction:
      'Enter your annual rent amount and add payment records to see your current status and what you need to do next.',
    warning:
      'Remember that in Nigeria, rent is paid annually, not monthly. Make sure to enter the full annual amount.',
  },
  '/tenants/dispute-predictor': {
    explanation:
      'Analyze tenant communication, payment delays, and maintenance patterns to predict potential disputes before they happen.',
    nextAction:
      'Enter tenant data including communication patterns, payment history, maintenance requests, and complaints.',
    warning:
      'Be thorough with your data - incomplete information leads to inaccurate predictions and missed warning signs.',
  },
  '/analytics/usage': {
    explanation:
      'Analyze platform usage data to identify features users struggle with, drop-off points, and underused features.',
    nextAction:
      'Enter total users, active users, and JSON data with feature usage, drop-off points, and user journey metrics.',
    warning:
      'Ensure your usage data is accurate and recent - outdated data leads to incorrect insights and poor recommendations.',
  },
  '/billing/assistant': {
    explanation:
      'Get clear, simple explanations about billing, payments, and financial matters. Understand your payment status, calculate amounts, and learn about payment methods.',
    nextAction:
      'Select your role (Tenant, Landlord, or Agent), choose a query type, and ask your billing question in plain language.',
    warning:
      'This assistant provides explanations and calculations - always verify exact amounts with your property manager or payment records.',
  },
  '/billing/validator': {
    explanation:
      'Validate payment attempts before processing. Check if amounts are correct, detect overpayments or underpayments, and get detailed breakdowns.',
    nextAction:
      'Enter tenant details, rent amount, outstanding balance, wallet balance, and payment amount, then click "Validate Payment".',
    warning:
      'Always verify the breakdown before processing payment - incorrect amounts can cause accounting issues and tenant confusion.',
  },
  '/billing/webhook-interpreter': {
    explanation:
      'Interpret Flutterwave webhook data to determine payment success or failure, identify failure reasons, and get required system actions.',
    nextAction:
      'Enter webhook data (status, amount, reference, channel, timestamp) or paste raw JSON, then click "Interpret Webhook".',
    warning:
      'Ensure webhook data is accurate - incorrect interpretation can lead to wrong system actions and customer confusion.',
  },
  '/billing/ledger-posting': {
    explanation:
      'Post confirmed payments to the billing ledger with proper invoice settlement, commission splits, and double-entry journal entries.',
    nextAction:
      'Enter payment details, commission rates, and invoices (or use default), then click "Post to Ledger" to generate journal entries.',
    warning:
      'Always verify that debits equal credits - unbalanced entries indicate calculation errors that must be corrected before posting.',
  },
  '/billing/failed-transaction': {
    explanation:
      'Analyze failed Flutterwave transactions to identify likely causes, suggest alternative payment methods, and generate calm retry messages.',
    nextAction:
      'Enter transaction reference, amount, gateway response, and optional details, then click "Analyze Failure" to get recommendations.',
    warning:
      'Always send calm, reassuring messages to customers - payment failures are stressful and a supportive tone helps maintain trust.',
  },
  '/billing/penalty-discount': {
    explanation:
      'Explain penalties and discounts applied to bills with clear calculations, factual justifications, and applicable dates.',
    nextAction:
      'Enter bill details, penalty rules, and optional discount rules, then click "Generate Explanation" to get a detailed breakdown.',
    warning:
      "Keep explanations factual and neutral - avoid judgmental language. Focus on the rules and calculations, not the customer's actions.",
  },
  '/billing/agent-commission': {
    explanation:
      'Calculate agent commission for payments with support for partial payments, delayed payments, commission caps, and timing rules.',
    nextAction:
      'Enter payment details, commission rate, timing rules, and optional caps/penalties, then click "Calculate Commission" to see the breakdown.',
    warning:
      'Ensure commission timing rules are clear - "on payment" means commission is earned when payment is received, "on invoice" means it\'s earned when invoice is issued.',
  },
  '/billing/audit-summary': {
    explanation:
      'Generate a comprehensive billing audit summary with all charges, payments, rule applications, and timestamps. Designed to resolve disputes quickly with complete transparency.',
    nextAction:
      'Enter tenant/property information and JSON data for charges, payments, and rule applications, then click "Generate Audit Summary" to create the complete audit trail.',
    warning:
      'Ensure all timestamps are accurate - the timeline is sorted chronologically and any discrepancies will be visible in the audit trail.',
  },
  '/billing/health-scan': {
    explanation:
      'Scan system-wide billing data to identify high failure rates, tenants with chronic delays, properties with unusual arrears, and payment channel performance issues.',
    nextAction:
      'Enter JSON data for tenants, properties, and payment channels, then click "Scan Billing Health" to get a comprehensive analysis with corrective actions.',
    warning:
      'Focus on "Critical" and "High" priority issues first - these represent the most significant risks to revenue and require immediate attention.',
  },
  '/maintenance/classifier': {
    explanation:
      'Classify maintenance requests by priority and get recommendations for resolution time, responsible role, and cost estimates.',
    nextAction:
      'Select the issue type, describe the problem, and indicate if there are safety concerns or property damage.',
    warning:
      'Always check the "Safety Concern" box for electrical issues, gas leaks, or structural problems - these are emergencies.',
  },
  '/maintenance/update': {
    explanation:
      'Convert technical maintenance updates into clear, tenant-friendly messages that are reassuring and professional.',
    nextAction:
      'Paste your technical maintenance description and select the status, then copy the generated tenant-friendly message.',
    warning:
      'Review the generated message before sending - make sure it accurately reflects the work being done and timeline.',
  },
  '/portfolio/analyzer': {
    explanation:
      'Analyze your property portfolio to identify key wins, risks, missed opportunities, and suggested actions.',
    nextAction:
      'Enter your portfolio data including properties, rent collected, vacancies, and maintenance requests.',
    warning:
      'Be honest with your data - inaccurate numbers will lead to poor recommendations and missed opportunities.',
  },
  '/portfolio/anomalies': {
    explanation:
      'Scan property financial and operational data to detect unusual patterns like rent delays, maintenance spikes, and vacancy anomalies.',
    nextAction:
      'Enter property name and annual rent, then optionally add JSON data for payment, maintenance, and vacancy history.',
    warning:
      'Don\'t ignore "Critical" severity anomalies - they indicate serious issues that need immediate attention.',
  },
  '/portfolio/rent-collection': {
    explanation:
      'Analyze rent collection performance across all properties. Compare expected vs collected rent, identify top performers, and get actionable insights in plain language.',
    nextAction:
      'Enter JSON data with property rent information (expected rent, collected rent, tenant count), then click "Analyze Rent Collection" to see the report.',
    warning:
      'Focus on properties with collection rates below 80% - these need immediate attention to recover outstanding rent.',
  },
  '/onboarding': {
    explanation:
      'Complete the AI onboarding assistant to get personalized settings, workflows, and feature recommendations for your role.',
    nextAction:
      'Answer the 6 friendly questions about your role, properties, and preferences to get customized recommendations.',
    warning:
      'Take your time answering - accurate responses help the system configure the best settings for your needs.',
  },
  '/properties': {
    explanation:
      'View and manage all your properties. Add new properties, edit existing ones, and track their status.',
    nextAction:
      'Click "Add Property" to create a new listing, or click on an existing property to view or edit details.',
    warning:
      'Make sure to upload high-quality photos - properties with good images get more tenant interest and higher rent.',
  },
  '/public/properties': {
    explanation:
      'Browse available properties for rent. Filter by location, price, and amenities to find your perfect home.',
    nextAction:
      'Use the filters to narrow down your search, then click on a property to view details and apply.',
    warning: 'Make sure to read all property details and terms before applying.',
  },
  '/public/properties/:id': {
    explanation:
      'View detailed information about this property including amenities, location, and rental terms.',
    nextAction:
      'Review all property details, check availability, and click "Apply Now" if you\'re interested.',
    warning:
      'Ensure you meet all requirements before applying. Contact the property manager if you have questions.',
  },
  '/tenants': {
    explanation:
      'Manage your tenants, view their information, track payments, and handle lease agreements.',
    nextAction:
      'Click on a tenant to view their profile, payment history, and lease details, or add a new tenant.',
    warning:
      'Keep tenant contact information updated - outdated phone numbers or emails delay communication and rent collection.',
  },
  '/maintenance': {
    explanation:
      'Track maintenance requests, view their status, assign to technicians, and monitor completion.',
    nextAction:
      'Click "View Details" on any request to see full information, or create a new maintenance request.',
    warning:
      "Don't mark requests as complete without verifying the work - incomplete repairs lead to repeat issues and tenant complaints.",
  },
  '/bookings': {
    explanation:
      'Manage short-let bookings, view reservations, track payments, and handle check-ins/check-outs.',
    nextAction:
      'Click on a booking to view details, update status, or process payments. Create new bookings from the calendar.',
    warning:
      'Double-check dates before confirming bookings - overlapping reservations cause major problems and refund requests.',
  },
  '/shortlet/listings': {
    explanation:
      'Manage your short-let listings, set availability, pricing, and property details for short-term rentals. In Nigeria, shortlets are charged daily (per night), unlike long-term rentals which are paid annually.',
    nextAction:
      'Click "Add Listing" to create a new short-let property, or edit existing listings to update daily rates and availability.',
    warning:
      'Keep your calendar updated - marking unavailable dates prevents double bookings and maintains your reputation.',
  },
  '/shortlet/search': {
    explanation: 'Search for available short-let properties by location, dates, and preferences.',
    nextAction:
      'Enter your check-in and check-out dates, select location, and browse available properties.',
    warning:
      'Book early for popular dates - short-lets fill up quickly during holidays and peak seasons.',
  },
};

export function ContextualGuide({ className }: { className?: string }) {
  const location = useLocation();
  const { userRole } = useAuthSession();
  const currentPath = location.pathname;

  // Find matching guide (exact match or closest parent route)
  let guide: PageGuide | null = null;

  // Try exact match first
  if (pageGuides[currentPath]) {
    guide = pageGuides[currentPath];
  } else {
    // Try to find parent route
    const pathParts = currentPath.split('/').filter(Boolean);
    for (let i = pathParts.length; i > 0; i--) {
      const testPath = '/' + pathParts.slice(0, i).join('/');
      if (pageGuides[testPath]) {
        guide = pageGuides[testPath];
        break;
      }
    }
  }

  // Role-based filtering: Don't show owner/agent-specific guides to tenants
  if (guide && userRole === 'tenant') {
    // Hide owner/agent-specific property management guides
    // Tenants should only see public property pages, not management pages
    if (currentPath.startsWith('/properties/') && !currentPath.startsWith('/public/properties/')) {
      // This is a protected property management route - tenants shouldn't be here
      return null;
    }
    // Hide owner-specific guides
    if (
      currentPath.startsWith('/portfolio') ||
      currentPath.startsWith('/tenants/validator') ||
      currentPath.startsWith('/tenants/reminders') ||
      currentPath.startsWith('/tenants/reminder-messages') ||
      currentPath.startsWith('/properties/copywriter') ||
      currentPath.startsWith('/properties/analyzer')
    ) {
      return null;
    }
  }

  // Hide tenant-specific guides from owners/agents
  if (guide && (userRole === 'owner' || userRole === 'agent' || userRole === 'admin')) {
    if (
      currentPath.startsWith('/tenants/payment-status') ||
      currentPath.startsWith('/tenants/payment-activity')
    ) {
      // These are tenant-specific, but owners/agents might need them for viewing tenant data
      // So we'll keep them visible
    }
  }

  if (!guide) {
    return null; // No guide for this page
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Alert className="border-border bg-accent/40">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          <strong>What you can do:</strong> {guide.explanation}
        </AlertDescription>
      </Alert>

      <Alert className="border-border bg-accent/40">
        <Lightbulb className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          <strong>Next step:</strong> {guide.nextAction}
        </AlertDescription>
      </Alert>

      <Alert className="border-destructive/40 bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-sm text-foreground">
          <strong>Watch out:</strong> {guide.warning}
        </AlertDescription>
      </Alert>
    </div>
  );
}
