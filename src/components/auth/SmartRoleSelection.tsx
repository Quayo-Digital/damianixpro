/**
 * Smart Role Selection Component (WF-003)
 * Provides intelligent role suggestions and validation during registration
 */

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types/auth';
import {
  useAutomaticRoleAssignment,
  RoleAssignmentContext,
  RoleAssignmentResult,
} from '@/services/roleAssignment/automaticRoleAssignment';

interface SmartRoleSelectionProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  context: RoleAssignmentContext;
  className?: string;
}

const roleDescriptions: Record<UserRole, { title: string; description: string; icon: string }> = {
  tenant: {
    title: 'Tenant',
    description: 'Looking for properties to rent',
    icon: '🏠',
  },
  owner: {
    title: 'Property Owner',
    description: 'Own properties and manage rentals',
    icon: '🏢',
  },
  agent: {
    title: 'Real Estate Agent',
    description: 'Help clients buy, sell, or rent properties',
    icon: '🤝',
  },
  vendor: {
    title: 'Service Provider',
    description: 'Provide maintenance, cleaning, or other services',
    icon: '🔧',
  },
  admin: {
    title: 'Administrator',
    description: 'Platform administration (requires approval)',
    icon: '⚙️',
  },
  super_admin: {
    title: 'Super Administrator',
    description: 'System administration (not available)',
    icon: '🔐',
  },
};

export const SmartRoleSelection: React.FC<SmartRoleSelectionProps> = ({
  selectedRole,
  onRoleChange,
  context,
  className = '',
}) => {
  const { suggestRole, validateRole } = useAutomaticRoleAssignment();
  const [suggestion, setSuggestion] = useState<RoleAssignmentResult | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message?: string;
    suggestedAlternative?: UserRole;
  } | null>(null);

  // Get role suggestion when context changes
  useEffect(() => {
    if (context.email || context.company || context.fullName) {
      const result = suggestRole(context);
      setSuggestion(result);
    }
  }, [context, suggestRole]);

  // Validate selected role
  useEffect(() => {
    const result = validateRole(context, selectedRole);
    setValidation(result);
  }, [context, selectedRole, validateRole]);

  const handleRoleChange = (role: UserRole) => {
    onRoleChange(role);
  };

  const applySuggestion = () => {
    if (suggestion) {
      handleRoleChange(suggestion.suggestedRole);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-base font-medium">Select your role</Label>

        {/* Role Suggestion Card */}
        {suggestion && suggestion.confidence > 60 && suggestion.suggestedRole !== selectedRole && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                <Lightbulb className="h-4 w-4" />
                Smart Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-700">
                    Based on your information, we suggest:{' '}
                    <strong>{roleDescriptions[suggestion.suggestedRole].title}</strong>
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    {suggestion.reasons[0]} (Confidence: {suggestion.confidence}%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="ml-2 rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Selection */}
        <RadioGroup
          value={selectedRole}
          onValueChange={handleRoleChange}
          className="mt-4 grid grid-cols-1 gap-3"
        >
          {Object.entries(roleDescriptions).map(([role, info]) => {
            // Hide super_admin from selection
            if (role === 'super_admin') return null;

            const isRestricted = role === 'admin';
            const isSuggested = suggestion?.suggestedRole === role;

            return (
              <div key={role} className="relative">
                <label
                  htmlFor={role}
                  className={`
                    flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-all
                    ${
                      selectedRole === role
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isRestricted ? 'opacity-75' : ''}
                  `}
                >
                  <RadioGroupItem value={role} id={role} disabled={isRestricted} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium">{info.title}</span>
                      {isSuggested && (
                        <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-800">
                          Suggested
                        </Badge>
                      )}
                      {isRestricted && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-xs text-amber-700"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          Restricted
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{info.description}</p>
                  </div>
                  {selectedRole === role && <CheckCircle className="h-5 w-5 text-blue-500" />}
                </label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Validation Messages */}
        {validation && !validation.isValid && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {validation.message}
              {validation.suggestedAlternative && (
                <button
                  type="button"
                  onClick={() => handleRoleChange(validation.suggestedAlternative!)}
                  className="ml-2 underline hover:no-underline"
                >
                  Select {roleDescriptions[validation.suggestedAlternative].title} instead
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Role Requirements Preview */}
        {selectedRole && validation?.isValid && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Great choice! As a {roleDescriptions[selectedRole].title.toLowerCase()}, you'll
                    have access to:
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-green-700">
                    {selectedRole === 'tenant' && (
                      <>
                        <li>• Browse and search properties</li>
                        <li>• Submit rental applications</li>
                        <li>• Manage lease agreements</li>
                        <li>• Submit maintenance requests</li>
                      </>
                    )}
                    {selectedRole === 'owner' && (
                      <>
                        <li>• List and manage properties</li>
                        <li>• Screen and manage tenants</li>
                        <li>• Track rental income and expenses</li>
                        <li>• Coordinate maintenance and repairs</li>
                      </>
                    )}
                    {selectedRole === 'agent' && (
                      <>
                        <li>• Manage assigned properties</li>
                        <li>• Assist with tenant applications</li>
                        <li>• Coordinate property showings</li>
                        <li>• Generate performance reports</li>
                      </>
                    )}
                    {selectedRole === 'vendor' && (
                      <>
                        <li>• Receive maintenance requests</li>
                        <li>• Submit service quotes</li>
                        <li>• Track job completion</li>
                        <li>• Manage service schedules</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
