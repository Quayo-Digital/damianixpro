import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface TenantData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  occupation: string;
  employer: string;
  monthlyIncome: string;
  employmentStatus: string;

  // Lease Information
  propertyId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  depositAmount: string;

  // Guarantor Information
  guarantorName: string;
  guarantorPhone: string;
  guarantorEmail: string;
  guarantorRelationship: string;
  guarantorAddress: string;
  guarantorOccupation: string;
  guarantorMonthlyIncome: string;

  // Additional
  emergencyContactName: string;
  emergencyContactPhone: string;
  previousAddress: string;
  references: string;
}

interface ValidationResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  warnings: {
    category: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
  }[];
  nextSteps: string[];
  score: number; // 0-100, higher is better
}

export function TenantOnboardingValidator() {
  const [tenantData, setTenantData] = useState<TenantData>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    employer: '',
    monthlyIncome: '',
    employmentStatus: '',
    propertyId: '',
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    depositAmount: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorEmail: '',
    guarantorRelationship: '',
    guarantorAddress: '',
    guarantorOccupation: '',
    guarantorMonthlyIncome: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    previousAddress: '',
    references: '',
  });

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateData = (): ValidationResult => {
    const warnings: ValidationResult['warnings'] = [];
    let riskScore = 100;

    // 1. Missing or Inconsistent Information
    const requiredFields: Array<{ key: keyof TenantData; label: string }> = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'monthlyIncome', label: 'Monthly Income' },
      { key: 'leaseStartDate', label: 'Lease Start Date' },
      { key: 'leaseEndDate', label: 'Lease End Date' },
      { key: 'monthlyRent', label: 'Annual Rent' },
    ];

    requiredFields.forEach(({ key, label }) => {
      if (!tenantData[key] || tenantData[key].trim() === '') {
        warnings.push({
          category: 'Missing Information',
          severity: 'error',
          message: `${label} is required`,
          field: key,
        });
        riskScore -= 5;
      }
    });

    // Email validation
    if (tenantData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantData.email)) {
      warnings.push({
        category: 'Data Quality',
        severity: 'error',
        message: 'Invalid email format',
        field: 'email',
      });
      riskScore -= 3;
    }

    // Phone validation (Nigerian format)
    if (tenantData.phone && !/^(\+234|0)?[789]\d{9}$/.test(tenantData.phone.replace(/\s/g, ''))) {
      warnings.push({
        category: 'Data Quality',
        severity: 'warning',
        message: 'Phone number may not be in valid Nigerian format',
        field: 'phone',
      });
      riskScore -= 2;
    }

    // Date of birth validation
    if (tenantData.dateOfBirth) {
      const dob = new Date(tenantData.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) {
        warnings.push({
          category: 'Legal Compliance',
          severity: 'error',
          message: 'Tenant must be at least 18 years old',
          field: 'dateOfBirth',
        });
        riskScore -= 10;
      } else if (age < 21) {
        warnings.push({
          category: 'Risk Assessment',
          severity: 'warning',
          message: 'Tenant is under 21 - may require guarantor',
          field: 'dateOfBirth',
        });
        riskScore -= 3;
      }
    } else {
      warnings.push({
        category: 'Missing Information',
        severity: 'warning',
        message: 'Date of birth not provided - cannot verify age',
        field: 'dateOfBirth',
      });
      riskScore -= 2;
    }

    // 2. Rent Affordability Risk (annual rent / 12 = monthly equivalent for ratio vs monthly income)
    if (tenantData.monthlyIncome && tenantData.monthlyRent) {
      const income = parseFloat(tenantData.monthlyIncome.replace(/,/g, ''));
      const annualRent = parseFloat(tenantData.monthlyRent.replace(/,/g, ''));
      const monthlyRentEquivalent = annualRent / 12;

      if (!isNaN(income) && !isNaN(annualRent) && income > 0 && annualRent > 0) {
        const rentToIncomeRatio = (monthlyRentEquivalent / income) * 100;

        if (rentToIncomeRatio > 40) {
          warnings.push({
            category: 'Affordability Risk',
            severity: 'error',
            message: `Annual rent (monthly equivalent) is ${rentToIncomeRatio.toFixed(1)}% of income - High risk (recommended: <30%)`,
            field: 'monthlyRent',
          });
          riskScore -= 15;
        } else if (rentToIncomeRatio > 30) {
          warnings.push({
            category: 'Affordability Risk',
            severity: 'warning',
            message: `Annual rent (monthly equivalent) is ${rentToIncomeRatio.toFixed(1)}% of income - Medium risk (recommended: <30%)`,
            field: 'monthlyRent',
          });
          riskScore -= 8;
        } else if (rentToIncomeRatio < 10) {
          warnings.push({
            category: 'Data Quality',
            severity: 'info',
            message: `Annual rent (monthly equivalent) is only ${rentToIncomeRatio.toFixed(1)}% of income - Verify amounts are correct`,
            field: 'monthlyIncome',
          });
          riskScore -= 2;
        }
      }
    }

    // Employment status check
    if (tenantData.employmentStatus) {
      if (
        ['unemployed', 'student', 'retired'].includes(tenantData.employmentStatus.toLowerCase())
      ) {
        warnings.push({
          category: 'Affordability Risk',
          severity: 'warning',
          message: `Employment status: ${tenantData.employmentStatus} - May require guarantor or proof of income`,
          field: 'employmentStatus',
        });
        riskScore -= 5;
      }
    }

    // 3. Lease Start/End Anomalies
    if (tenantData.leaseStartDate && tenantData.leaseEndDate) {
      const startDate = new Date(tenantData.leaseStartDate);
      const endDate = new Date(tenantData.leaseEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // End date before start date
      if (endDate < startDate) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'error',
          message: 'Lease end date is before start date',
          field: 'leaseEndDate',
        });
        riskScore -= 10;
      }

      // Start date in the past (more than 30 days)
      const daysUntilStart = Math.floor(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilStart < -30) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'error',
          message: `Lease start date is ${Math.abs(daysUntilStart)} days in the past`,
          field: 'leaseStartDate',
        });
        riskScore -= 8;
      } else if (daysUntilStart < 0) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'warning',
          message: 'Lease start date is in the past - Verify if this is a backdated lease',
          field: 'leaseStartDate',
        });
        riskScore -= 3;
      }

      // Lease duration
      const leaseDurationMonths =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (leaseDurationMonths < 6) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'warning',
          message: `Lease duration is only ${Math.round(leaseDurationMonths)} months - Very short term`,
          field: 'leaseEndDate',
        });
        riskScore -= 3;
      } else if (leaseDurationMonths > 60) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'info',
          message: `Lease duration is ${Math.round(leaseDurationMonths)} months - Long term lease`,
          field: 'leaseEndDate',
        });
      }

      // Start date too far in future
      if (daysUntilStart > 90) {
        warnings.push({
          category: 'Lease Anomaly',
          severity: 'info',
          message: `Lease starts in ${daysUntilStart} days - Consider if tenant will wait`,
          field: 'leaseStartDate',
        });
        riskScore -= 1;
      }
    }

    // 4. Incomplete Guarantor Details
    const guarantorFields: Array<{ key: keyof TenantData; label: string }> = [
      { key: 'guarantorName', label: 'Guarantor Name' },
      { key: 'guarantorPhone', label: 'Guarantor Phone' },
      { key: 'guarantorEmail', label: 'Guarantor Email' },
      { key: 'guarantorRelationship', label: 'Relationship' },
      { key: 'guarantorAddress', label: 'Guarantor Address' },
      { key: 'guarantorOccupation', label: 'Guarantor Occupation' },
      { key: 'guarantorMonthlyIncome', label: 'Guarantor Income' },
    ];

    const missingGuarantorFields = guarantorFields.filter(
      ({ key }) => !tenantData[key] || tenantData[key].trim() === ''
    );

    if (missingGuarantorFields.length > 0) {
      if (missingGuarantorFields.length === guarantorFields.length) {
        warnings.push({
          category: 'Guarantor Information',
          severity: 'warning',
          message: 'No guarantor information provided - May be required for high-risk tenants',
        });
        riskScore -= 5;
      } else {
        warnings.push({
          category: 'Guarantor Information',
          severity: 'warning',
          message: `Incomplete guarantor details: Missing ${missingGuarantorFields.map((f) => f.label).join(', ')}`,
        });
        riskScore -= 3;
      }
    }

    // Guarantor income validation
    if (tenantData.guarantorMonthlyIncome && tenantData.monthlyRent) {
      const guarantorIncome = parseFloat(tenantData.guarantorMonthlyIncome.replace(/,/g, ''));
      const monthlyRentEquivalent = parseFloat(tenantData.monthlyRent.replace(/,/g, '')) / 12;

      if (
        !isNaN(guarantorIncome) &&
        !isNaN(monthlyRentEquivalent) &&
        guarantorIncome > 0 &&
        monthlyRentEquivalent > 0
      ) {
        if (guarantorIncome < monthlyRentEquivalent * 3) {
          warnings.push({
            category: 'Guarantor Information',
            severity: 'warning',
            message:
              'Guarantor income is less than 3x monthly rent equivalent - May not provide adequate security',
            field: 'guarantorMonthlyIncome',
          });
          riskScore -= 5;
        }
      }
    }

    // Emergency contact validation
    if (!tenantData.emergencyContactName || !tenantData.emergencyContactPhone) {
      warnings.push({
        category: 'Missing Information',
        severity: 'warning',
        message: 'Emergency contact information is incomplete',
      });
      riskScore -= 2;
    }

    // Previous address check
    if (!tenantData.previousAddress) {
      warnings.push({
        category: 'Missing Information',
        severity: 'info',
        message: 'Previous address not provided - Cannot verify rental history',
        field: 'previousAddress',
      });
      riskScore -= 1;
    }

    // References check
    if (!tenantData.references) {
      warnings.push({
        category: 'Missing Information',
        severity: 'info',
        message: 'References not provided - Consider requesting character references',
        field: 'references',
      });
      riskScore -= 1;
    }

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (riskScore < 60) {
      riskLevel = 'High';
    } else if (riskScore < 80) {
      riskLevel = 'Medium';
    }

    // Generate next steps
    const nextSteps: string[] = [];

    const errorWarnings = warnings.filter((w) => w.severity === 'error');
    const warningWarnings = warnings.filter((w) => w.severity === 'warning');

    if (errorWarnings.length > 0) {
      nextSteps.push('URGENT: Fix all errors before proceeding with onboarding');
      nextSteps.push('Review and complete all required fields marked with errors');
    }

    if (warningWarnings.length > 0) {
      nextSteps.push('Address warning items to reduce risk level');
    }

    if (riskLevel === 'High') {
      nextSteps.push('Require comprehensive guarantor documentation');
      nextSteps.push('Consider requesting additional security deposit');
      nextSteps.push('Conduct thorough background check');
      nextSteps.push('Request proof of income (payslips, bank statements)');
    } else if (riskLevel === 'Medium') {
      nextSteps.push('Verify employment and income documentation');
      nextSteps.push('Complete guarantor information if not already provided');
      nextSteps.push('Request at least 2 character references');
    } else {
      nextSteps.push('Complete remaining optional fields for better tenant profile');
      nextSteps.push('Verify all provided information');
    }

    if (
      missingGuarantorFields.length > 0 &&
      missingGuarantorFields.length < guarantorFields.length
    ) {
      nextSteps.push('Complete guarantor information for full validation');
    }

    if (!tenantData.previousAddress) {
      nextSteps.push('Request previous rental address for history verification');
    }

    if (!tenantData.references) {
      nextSteps.push('Request at least 2 professional or personal references');
    }

    return {
      riskLevel,
      warnings,
      nextSteps,
      score: Math.max(0, Math.min(100, riskScore)),
    };
  };

  const handleValidate = () => {
    const result = validateData();
    setValidationResult(result);
  };

  const updateField = (field: keyof TenantData, value: string) => {
    setTenantData((prev) => ({ ...prev, [field]: value }));
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/40';
      case 'Medium':
        return 'bg-accent text-accent-foreground border-border';
      case 'Low':
        return 'bg-primary/15 text-primary border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Tenant Onboarding Validator
          </CardTitle>
          <CardDescription>
            Validate tenant data for completeness, affordability, and compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={tenantData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={tenantData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={tenantData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+234 803 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={tenantData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  value={tenantData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  value={tenantData.employer}
                  onChange={(e) => updateField('employer', e.target.value)}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  value={tenantData.employmentStatus}
                  onValueChange={(value) => updateField('employmentStatus', value)}
                >
                  <SelectTrigger id="employmentStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (₦) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={tenantData.monthlyIncome}
                  onChange={(e) => updateField('monthlyIncome', e.target.value)}
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Lease Information */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5" />
              Lease Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="leaseStartDate">Lease Start Date *</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={tenantData.leaseStartDate}
                  onChange={(e) => updateField('leaseStartDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leaseEndDate">Lease End Date *</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={tenantData.leaseEndDate}
                  onChange={(e) => updateField('leaseEndDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthlyRent">Annual Rent (₦) *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={tenantData.monthlyRent}
                  onChange={(e) => updateField('monthlyRent', e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">Security Deposit (₦)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={tenantData.depositAmount}
                  onChange={(e) => updateField('depositAmount', e.target.value)}
                  placeholder="6000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Guarantor Information */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5" />
              Guarantor Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="guarantorName">Guarantor Name</Label>
                <Input
                  id="guarantorName"
                  value={tenantData.guarantorName}
                  onChange={(e) => updateField('guarantorName', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="guarantorPhone">Guarantor Phone</Label>
                <Input
                  id="guarantorPhone"
                  value={tenantData.guarantorPhone}
                  onChange={(e) => updateField('guarantorPhone', e.target.value)}
                  placeholder="+234 803 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="guarantorEmail">Guarantor Email</Label>
                <Input
                  id="guarantorEmail"
                  type="email"
                  value={tenantData.guarantorEmail}
                  onChange={(e) => updateField('guarantorEmail', e.target.value)}
                  placeholder="guarantor@example.com"
                />
              </div>
              <div>
                <Label htmlFor="guarantorRelationship">Relationship</Label>
                <Select
                  value={tenantData.guarantorRelationship}
                  onValueChange={(value) => updateField('guarantorRelationship', value)}
                >
                  <SelectTrigger id="guarantorRelationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="guarantorAddress">Guarantor Address</Label>
                <Input
                  id="guarantorAddress"
                  value={tenantData.guarantorAddress}
                  onChange={(e) => updateField('guarantorAddress', e.target.value)}
                  placeholder="Full address"
                />
              </div>
              <div>
                <Label htmlFor="guarantorOccupation">Guarantor Occupation</Label>
                <Input
                  id="guarantorOccupation"
                  value={tenantData.guarantorOccupation}
                  onChange={(e) => updateField('guarantorOccupation', e.target.value)}
                  placeholder="Occupation"
                />
              </div>
              <div>
                <Label htmlFor="guarantorMonthlyIncome">Guarantor Monthly Income (₦)</Label>
                <Input
                  id="guarantorMonthlyIncome"
                  type="number"
                  value={tenantData.guarantorMonthlyIncome}
                  onChange={(e) => updateField('guarantorMonthlyIncome', e.target.value)}
                  placeholder="2000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={tenantData.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  placeholder="Emergency contact"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={tenantData.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  placeholder="+234 803 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="previousAddress">Previous Address</Label>
                <Input
                  id="previousAddress"
                  value={tenantData.previousAddress}
                  onChange={(e) => updateField('previousAddress', e.target.value)}
                  placeholder="Previous rental address"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="references">References</Label>
                <Input
                  id="references"
                  value={tenantData.references}
                  onChange={(e) => updateField('references', e.target.value)}
                  placeholder="Names and contact info of references"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleValidate} className="w-full" size="lg">
            <Shield className="mr-2 h-4 w-4" />
            Validate Tenant Data
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Results</CardTitle>
              <Badge className={getRiskBadgeColor(validationResult.riskLevel)}>
                {validationResult.riskLevel} Risk
              </Badge>
            </div>
            <CardDescription>Validation Score: {validationResult.score}/100</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Summary */}
            <Alert
              variant={
                validationResult.riskLevel === 'High'
                  ? 'destructive'
                  : validationResult.riskLevel === 'Medium'
                    ? 'default'
                    : 'default'
              }
              className={
                validationResult.riskLevel === 'Low'
                  ? 'border-border bg-primary/10'
                  : validationResult.riskLevel === 'Medium'
                    ? 'border-border bg-accent/40'
                    : ''
              }
            >
              <div className="flex items-start gap-3">
                {validationResult.riskLevel === 'High' ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                ) : validationResult.riskLevel === 'Medium' ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-accent-foreground" />
                ) : (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                )}
                <div className="flex-1">
                  <AlertTitle className="text-lg font-semibold">
                    Risk Assessment: {validationResult.riskLevel}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {validationResult.riskLevel === 'High' && (
                      <span>
                        This tenant application has significant issues that need to be addressed
                        before approval. Review all errors and warnings carefully.
                      </span>
                    )}
                    {validationResult.riskLevel === 'Medium' && (
                      <span>
                        This tenant application has some concerns. Address the warnings to reduce
                        risk.
                      </span>
                    )}
                    {validationResult.riskLevel === 'Low' && (
                      <span>
                        This tenant application looks good. Complete optional fields for a more
                        comprehensive profile.
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Warnings by Category */}
            {validationResult.warnings.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Issues Found</h3>
                <div className="space-y-3">
                  {[
                    'Missing Information',
                    'Affordability Risk',
                    'Lease Anomaly',
                    'Guarantor Information',
                    'Data Quality',
                    'Legal Compliance',
                    'Risk Assessment',
                  ].map((category) => {
                    const categoryWarnings = validationResult.warnings.filter(
                      (w) => w.category === category
                    );
                    if (categoryWarnings.length === 0) return null;

                    return (
                      <div key={category} className="rounded-lg border p-4">
                        <h4 className="mb-2 font-medium">{category}</h4>
                        <ul className="space-y-2">
                          {categoryWarnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              {getSeverityIcon(warning.severity)}
                              <span className="flex-1">{warning.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {validationResult.warnings.length === 0 && (
              <Alert className="border-border bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle>All Clear!</AlertTitle>
                <AlertDescription>
                  No issues found. This tenant application meets all validation criteria.
                </AlertDescription>
              </Alert>
            )}

            {/* Next Steps */}
            {validationResult.nextSteps.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-5 w-5" />
                  Recommended Next Steps
                </h3>
                <ol className="space-y-2">
                  {validationResult.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="font-semibold text-primary">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
