import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProactiveSuggestion {
  action: string;
  description: string;
  route?: string;
}

const pageSuggestions: Record<string, ProactiveSuggestion> = {
  '/properties/copywriter': {
    action: 'Start generating descriptions',
    description:
      'Fill in property type, location, and target tenant to generate professional descriptions.',
  },
  '/properties/analyzer': {
    action: 'Enter property details',
    description: 'Add location, property type, and number of units to get rent range suggestions.',
  },
  '/tenants/validator': {
    action: 'Validate tenant data',
    description: 'Fill in tenant information and click "Validate Tenant Data" to check for risks.',
  },
  '/tenants/reminders': {
    action: 'Generate reminder',
    description:
      'Enter tenant details and payment history, then generate appropriate reminder messages.',
  },
  '/tenants/payment-status': {
    action: 'Check payment status',
    description: 'Enter your annual rent amount and payment records to see your current status.',
  },
  '/maintenance/classifier': {
    action: 'Classify maintenance request',
    description: 'Select issue type, describe the problem, and get priority classification.',
  },
  '/maintenance/update': {
    action: 'Convert maintenance update',
    description: 'Paste technical details and generate tenant-friendly messages.',
  },
  '/portfolio/analyzer': {
    action: 'Analyze portfolio',
    description: 'Enter portfolio data including properties, rent, and vacancies to get insights.',
  },
  '/portfolio/anomalies': {
    action: 'Scan for anomalies',
    description:
      'Enter property name, annual rent, and historical data to detect unusual patterns.',
  },
  '/tenants/dispute-predictor': {
    action: 'Predict disputes',
    description:
      'Enter tenant communication patterns, payment history, and complaints to predict risks.',
  },
  '/analytics/usage': {
    action: 'Analyze usage data',
    description: 'Enter user metrics and JSON usage data to identify UX issues and improvements.',
  },
  '/properties': {
    action: 'Add a property',
    description: 'Click "Add Property" to create a new listing and start managing it.',
  },
  '/tenants': {
    action: 'View tenant details',
    description: 'Click on a tenant to see their profile, payment history, and lease information.',
  },
  '/maintenance': {
    action: 'View maintenance request',
    description: 'Click "View Details" on any request to see full information and update status.',
  },
  '/bookings': {
    action: 'View booking details',
    description: 'Click on a booking to see details, update status, or process payments.',
  },
  '/shortlet/listings': {
    action: 'Create listing',
    description:
      'Click "Add Listing" to create a new short-let property and start accepting bookings.',
  },
  '/shortlet/search': {
    action: 'Search properties',
    description:
      'Enter check-in and check-out dates, select location, and browse available properties.',
  },
  '/onboarding': {
    action: 'Complete onboarding',
    description: 'Answer the questions to get personalized settings and feature recommendations.',
  },
};

const INACTIVITY_THRESHOLD = 30000; // 30 seconds
const STUCK_THRESHOLD = 60000; // 60 seconds on page without meaningful interaction

export function ProactiveHelper() {
  const location = useLocation();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ProactiveSuggestion | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pageLoadTimeRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);
  const dismissedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset when route changes
    pageLoadTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    interactionCountRef.current = 0;
    dismissedRef.current = false;
    setShowSuggestion(false);

    // Get suggestion for current page
    const currentPath = location.pathname;
    let pageSuggestion: ProactiveSuggestion | null = null;

    // Try exact match first
    if (pageSuggestions[currentPath]) {
      pageSuggestion = pageSuggestions[currentPath];
    } else {
      // Try parent route
      const pathParts = currentPath.split('/').filter(Boolean);
      for (let i = pathParts.length; i > 0; i--) {
        const testPath = '/' + pathParts.slice(0, i).join('/');
        if (pageSuggestions[testPath]) {
          pageSuggestion = pageSuggestions[testPath];
          break;
        }
      }
    }

    setSuggestion(pageSuggestion);

    // Track user activity
    const trackActivity = () => {
      lastActivityRef.current = Date.now();
      interactionCountRef.current++;
    };

    // Mouse movement
    const handleMouseMove = () => trackActivity();
    // Clicks
    const handleClick = () => trackActivity();
    // Keyboard input
    const handleKeyPress = () => trackActivity();
    // Scroll
    const handleScroll = () => trackActivity();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('scroll', handleScroll);

    // Check for inactivity
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const timeOnPage = now - pageLoadTimeRef.current;

      // Show suggestion if:
      // 1. User has been inactive for threshold time, OR
      // 2. User has been on page for stuck threshold with minimal interactions
      const isInactive = timeSinceLastActivity > INACTIVITY_THRESHOLD;
      const appearsStuck = timeOnPage > STUCK_THRESHOLD && interactionCountRef.current < 3;

      if ((isInactive || appearsStuck) && pageSuggestion && !dismissedRef.current) {
        setShowSuggestion(true);
      } else if (timeSinceLastActivity < INACTIVITY_THRESHOLD / 2) {
        // Hide if user becomes active again
        setShowSuggestion(false);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(checkInactivity);
    };
  }, [location.pathname]);

  const handleDismiss = () => {
    setShowSuggestion(false);
    dismissedRef.current = true;
    // Reset dismissal after 2 minutes
    setTimeout(() => {
      dismissedRef.current = false;
    }, 120000);
  };

  const handleAction = () => {
    setShowSuggestion(false);
    dismissedRef.current = true;
    // Track that user took action
    lastActivityRef.current = Date.now();
    interactionCountRef.current++;
  };

  if (!showSuggestion || !suggestion) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert className="border-blue-200 bg-blue-50 shadow-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex-1">
            <AlertTitle className="mb-1 text-sm font-semibold text-gray-800">
              Need help getting started?
            </AlertTitle>
            <AlertDescription className="mb-3 text-sm text-gray-700">
              <strong>{suggestion.action}:</strong> {suggestion.description}
            </AlertDescription>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAction} className="text-xs">
                <MousePointerClick className="mr-1 h-3 w-3" />
                Got it
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 flex-shrink-0 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
