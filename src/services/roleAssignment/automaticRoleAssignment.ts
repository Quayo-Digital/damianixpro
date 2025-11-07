/**
 * Automatic Role Assignment Service (WF-003)
 * Provides intelligent role assignment based on user data and business logic
 */

import { UserRole } from '@/types/auth';

export interface RoleAssignmentContext {
  email: string;
  fullName?: string;
  company?: string;
  phone?: string;
  selectedRole?: UserRole;
}

export interface RoleAssignmentResult {
  suggestedRole: UserRole;
  confidence: number; // 0-100
  reasons: string[];
  allowedRoles: UserRole[];
  requiresApproval: boolean;
}

/**
 * Analyzes user context and suggests the most appropriate role
 */
export class AutomaticRoleAssignmentService {
  
  /**
   * Get intelligent role suggestion based on user context
   */
  static suggestRole(context: RoleAssignmentContext): RoleAssignmentResult {
    const { email, fullName, company, selectedRole } = context;
    
    // Initialize result
    let suggestedRole: UserRole = 'tenant';
    let confidence = 50;
    const reasons: string[] = [];
    let requiresApproval = false;
    
    // Email domain analysis
    const emailDomain = email.toLowerCase().split('@')[1];
    const corporateDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const isPersonalEmail = corporateDomains.includes(emailDomain);
    
    // Business email analysis
    if (!isPersonalEmail && company) {
      suggestedRole = 'owner';
      confidence = 75;
      reasons.push('Business email domain with company name suggests property owner');
    }
    
    // Company name analysis
    if (company) {
      const companyLower = company.toLowerCase();
      
      // Real estate companies
      if (companyLower.includes('real estate') || 
          companyLower.includes('property') || 
          companyLower.includes('realty') ||
          companyLower.includes('estate')) {
        suggestedRole = 'agent';
        confidence = 85;
        reasons.push('Company name indicates real estate business');
      }
      
      // Construction/maintenance companies
      if (companyLower.includes('construction') || 
          companyLower.includes('maintenance') || 
          companyLower.includes('plumbing') ||
          companyLower.includes('electrical') ||
          companyLower.includes('cleaning')) {
        suggestedRole = 'vendor';
        confidence = 80;
        reasons.push('Company name indicates service provider business');
      }
      
      // Property management companies
      if (companyLower.includes('management') || 
          companyLower.includes('investment') ||
          companyLower.includes('holdings')) {
        suggestedRole = 'owner';
        confidence = 80;
        reasons.push('Company name suggests property management/investment');
      }
    }
    
    // Name analysis for professional titles
    if (fullName) {
      const nameLower = fullName.toLowerCase();
      if (nameLower.includes('dr.') || nameLower.includes('prof.') || 
          nameLower.includes('eng.') || nameLower.includes('arch.')) {
        // Professionals are more likely to be property owners
        if (suggestedRole === 'tenant') {
          suggestedRole = 'owner';
          confidence = 65;
          reasons.push('Professional title suggests higher likelihood of property ownership');
        }
      }
    }
    
    // Respect user's selection if it makes sense
    if (selectedRole && selectedRole !== 'admin') {
      // If user selected a role and our confidence isn't very high, respect their choice
      if (confidence < 80) {
        suggestedRole = selectedRole;
        confidence = Math.max(confidence, 70);
        reasons.push('User-selected role respected');
      }
    }
    
    // Security: Admin role requires approval
    if (selectedRole === 'admin') {
      suggestedRole = 'tenant'; // Default to tenant for security
      requiresApproval = true;
      confidence = 100;
      reasons.push('Admin role requires manual approval for security');
    }
    
    // Determine allowed roles based on context
    const allowedRoles = this.getAllowedRoles(context, suggestedRole);
    
    return {
      suggestedRole,
      confidence,
      reasons,
      allowedRoles,
      requiresApproval
    };
  }
  
  /**
   * Get list of roles user is allowed to select
   */
  private static getAllowedRoles(context: RoleAssignmentContext, suggestedRole: UserRole): UserRole[] {
    // Base roles everyone can select
    const baseRoles: UserRole[] = ['tenant', 'owner', 'agent', 'vendor'];
    
    // Admin role is restricted - only existing admins can create new admins
    // This would be handled by the UI/backend validation
    
    return baseRoles;
  }
  
  /**
   * Validate if a role assignment is appropriate
   */
  static validateRoleAssignment(context: RoleAssignmentContext, requestedRole: UserRole): {
    isValid: boolean;
    message?: string;
    suggestedAlternative?: UserRole;
  } {
    // Security validation
    if (requestedRole === 'admin') {
      return {
        isValid: false,
        message: 'Admin role requires manual approval. Please contact support.',
        suggestedAlternative: 'tenant'
      };
    }
    
    // Super admin role is completely restricted
    if (requestedRole === 'super_admin') {
      return {
        isValid: false,
        message: 'Super admin role is not available for registration.',
        suggestedAlternative: 'tenant'
      };
    }
    
    // All other roles are valid
    return { isValid: true };
  }
  
  /**
   * Get role-specific onboarding requirements
   */
  static getRoleOnboardingRequirements(role: UserRole): {
    requiredFields: string[];
    optionalFields: string[];
    additionalSteps: string[];
  } {
    switch (role) {
      case 'agent':
        return {
          requiredFields: ['license_number', 'years_of_experience', 'working_areas'],
          optionalFields: ['specializations', 'bio', 'preferred_contact_method'],
          additionalSteps: ['License verification', 'Background check']
        };
        
      case 'owner':
        return {
          requiredFields: ['company', 'phone'],
          optionalFields: ['bio'],
          additionalSteps: ['Identity verification', 'Property ownership verification']
        };
        
      case 'vendor':
        return {
          requiredFields: ['company', 'service_types', 'working_areas'],
          optionalFields: ['certifications', 'insurance_info'],
          additionalSteps: ['Business registration verification', 'Insurance verification']
        };
        
      case 'tenant':
      default:
        return {
          requiredFields: ['phone'],
          optionalFields: ['preferences'],
          additionalSteps: ['Identity verification']
        };
    }
  }
}

/**
 * Hook for using automatic role assignment in React components
 */
export const useAutomaticRoleAssignment = () => {
  const suggestRole = (context: RoleAssignmentContext) => {
    return AutomaticRoleAssignmentService.suggestRole(context);
  };
  
  const validateRole = (context: RoleAssignmentContext, role: UserRole) => {
    return AutomaticRoleAssignmentService.validateRoleAssignment(context, role);
  };
  
  const getOnboardingRequirements = (role: UserRole) => {
    return AutomaticRoleAssignmentService.getRoleOnboardingRequirements(role);
  };
  
  return {
    suggestRole,
    validateRole,
    getOnboardingRequirements
  };
};
