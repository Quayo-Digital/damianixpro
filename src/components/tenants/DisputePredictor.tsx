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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Wrench,
  Shield,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';

interface TenantData {
  tenantName: string;
  propertyName: string;
  leaseStartDate: string;
  leaseEndDate: string;
  annualRent: number;
  communicationFrequency: 'excellent' | 'good' | 'fair' | 'poor';
  responseTime: 'immediate' | 'same-day' | 'within-2-days' | 'slow' | 'no-response';
  paymentDelays: number;
  averageDaysLate: number;
  maintenanceRequests: number;
  unresolvedMaintenance: number;
  complaints: number;
  complaintTypes: string[];
  leaseViolations: number;
  previousDisputes: number;
}

interface DisputePrediction {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number; // 0-100
  predictedDisputes: {
    type: string;
    likelihood: 'Low' | 'Medium' | 'High';
    timeframe: string;
    reasoning: string;
  }[];
  riskFactors: {
    category: string;
    factor: string;
    severity: 'Low' | 'Medium' | 'High';
    impact: string;
  }[];
  preventiveActions: {
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    impact: string;
    timeframe: string;
  }[];
  summary: string;
}

export function DisputePredictor() {
  const [tenantData, setTenantData] = useState<TenantData>({
    tenantName: '',
    propertyName: '',
    leaseStartDate: '',
    leaseEndDate: '',
    annualRent: 0,
    communicationFrequency: 'good',
    responseTime: 'same-day',
    paymentDelays: 0,
    averageDaysLate: 0,
    maintenanceRequests: 0,
    unresolvedMaintenance: 0,
    complaints: 0,
    complaintTypes: [],
    leaseViolations: 0,
    previousDisputes: 0,
  });

  const [complaintTypeInput, setComplaintTypeInput] = useState('');
  const [prediction, setPrediction] = useState<DisputePrediction | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const predictDisputes = (data: TenantData): DisputePrediction => {
    let riskScore = 0;
    const predictedDisputes: DisputePrediction['predictedDisputes'] = [];
    const riskFactors: DisputePrediction['riskFactors'] = [];
    const preventiveActions: DisputePrediction['preventiveActions'] = [];

    // Calculate lease duration
    const leaseStart = new Date(data.leaseStartDate);
    const leaseEnd = new Date(data.leaseEndDate);
    const leaseDurationMonths =
      (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const monthsRemaining = Math.max(
      0,
      (leaseEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // PAYMENT-RELATED DISPUTE PREDICTIONS
    if (data.paymentDelays > 0) {
      if (data.averageDaysLate > 30) {
        riskScore += 30;
        predictedDisputes.push({
          type: 'Rent Payment Dispute',
          likelihood: 'High',
          timeframe: 'Within 1-2 months',
          reasoning: `Tenant has ${data.paymentDelays} payment delay(s) with an average of ${data.averageDaysLate} days late. This pattern suggests financial difficulties or intentional non-payment, which often leads to formal disputes and potential eviction proceedings.`,
        });
        riskFactors.push({
          category: 'Payment',
          factor: 'Severe payment delays (30+ days)',
          severity: 'High',
          impact: 'High risk of rent collection disputes, potential eviction, and legal action.',
        });
      } else if (data.averageDaysLate > 14) {
        riskScore += 20;
        predictedDisputes.push({
          type: 'Rent Payment Dispute',
          likelihood: 'Medium',
          timeframe: 'Within 2-3 months',
          reasoning: `Tenant consistently pays ${data.averageDaysLate} days late. While not critical yet, this pattern can escalate if not addressed, leading to disputes over late fees and payment terms.`,
        });
        riskFactors.push({
          category: 'Payment',
          factor: 'Moderate payment delays (14-30 days)',
          severity: 'Medium',
          impact: 'Risk of disputes over late fees and payment schedules.',
        });
      } else {
        riskScore += 10;
        riskFactors.push({
          category: 'Payment',
          factor: 'Minor payment delays',
          severity: 'Low',
          impact: 'Early warning sign - monitor closely to prevent escalation.',
        });
      }

      if (data.paymentDelays > 3) {
        riskScore += 15;
        preventiveActions.push({
          priority: 'High',
          action: 'Schedule payment discussion meeting',
          impact: 'Address payment pattern early to prevent escalation and clarify expectations.',
          timeframe: 'This week',
        });
      }
    }

    // MAINTENANCE-RELATED DISPUTE PREDICTIONS
    if (data.unresolvedMaintenance > 0) {
      const unresolvedRatio = data.unresolvedMaintenance / Math.max(1, data.maintenanceRequests);

      if (unresolvedRatio > 0.5) {
        riskScore += 25;
        predictedDisputes.push({
          type: 'Maintenance Dispute',
          likelihood: 'High',
          timeframe: 'Within 1 month',
          reasoning: `More than 50% of maintenance requests (${data.unresolvedMaintenance} out of ${data.maintenanceRequests}) remain unresolved. This is a major source of tenant dissatisfaction and often leads to disputes over habitability, rent reduction requests, or lease termination.`,
        });
        riskFactors.push({
          category: 'Maintenance',
          factor: `High unresolved maintenance (${data.unresolvedMaintenance} unresolved)`,
          severity: 'High',
          impact:
            'Tenants may claim breach of lease, request rent reduction, or terminate lease early.',
        });
        preventiveActions.push({
          priority: 'High',
          action: `Resolve ${data.unresolvedMaintenance} outstanding maintenance request(s) immediately`,
          impact: 'Prevents habitability disputes and shows commitment to property upkeep.',
          timeframe: 'Within 7 days',
        });
      } else if (unresolvedRatio > 0.3) {
        riskScore += 15;
        predictedDisputes.push({
          type: 'Maintenance Dispute',
          likelihood: 'Medium',
          timeframe: 'Within 2-3 months',
          reasoning: `Several maintenance requests (${data.unresolvedMaintenance}) remain unresolved. If not addressed, this can lead to complaints about property condition and potential disputes.`,
        });
        riskFactors.push({
          category: 'Maintenance',
          factor: `Moderate unresolved maintenance (${data.unresolvedMaintenance} unresolved)`,
          severity: 'Medium',
          impact: 'Risk of tenant complaints escalating to formal disputes.',
        });
      }

      if (data.maintenanceRequests > 10 && data.unresolvedMaintenance > 3) {
        riskScore += 10;
        preventiveActions.push({
          priority: 'Medium',
          action: 'Conduct property inspection and create maintenance schedule',
          impact: 'Proactive maintenance reduces future requests and prevents disputes.',
          timeframe: 'This month',
        });
      }
    }

    // COMMUNICATION-RELATED DISPUTE PREDICTIONS
    if (data.communicationFrequency === 'poor' || data.responseTime === 'no-response') {
      riskScore += 20;
      predictedDisputes.push({
        type: 'Communication Breakdown Dispute',
        likelihood: 'High',
        timeframe: 'Within 1-2 months',
        reasoning: `Poor communication (${data.communicationFrequency} frequency, ${data.responseTime} response time) creates misunderstandings and frustration. When tenants feel ignored, small issues escalate into major disputes.`,
      });
      riskFactors.push({
        category: 'Communication',
        factor: 'Poor communication and slow response times',
        severity: 'High',
        impact:
          'Misunderstandings lead to disputes, tenant frustration, and potential legal action.',
      });
      preventiveActions.push({
        priority: 'High',
        action: 'Establish clear communication protocol and response time expectations',
        impact: 'Improves tenant relations and prevents misunderstandings that lead to disputes.',
        timeframe: 'This week',
      });
    } else if (data.communicationFrequency === 'fair' || data.responseTime === 'slow') {
      riskScore += 10;
      riskFactors.push({
        category: 'Communication',
        factor: 'Inconsistent communication',
        severity: 'Medium',
        impact: 'May lead to misunderstandings if not improved.',
      });
    }

    // COMPLAINT-RELATED DISPUTE PREDICTIONS
    if (data.complaints > 0) {
      if (data.complaints > 5) {
        riskScore += 25;
        predictedDisputes.push({
          type: 'Multiple Complaint Dispute',
          likelihood: 'High',
          timeframe: 'Within 1 month',
          reasoning: `Tenant has filed ${data.complaints} complaint(s), indicating significant dissatisfaction. Multiple unresolved complaints often escalate to formal disputes, lease termination requests, or legal action.`,
        });
        riskFactors.push({
          category: 'Complaints',
          factor: `High number of complaints (${data.complaints})`,
          severity: 'High',
          impact: 'Indicates serious tenant dissatisfaction and high dispute risk.',
        });
        preventiveActions.push({
          priority: 'High',
          action: 'Schedule meeting to address all complaints and find solutions',
          impact: 'Prevents escalation and shows commitment to resolving issues.',
          timeframe: 'This week',
        });
      } else if (data.complaints > 2) {
        riskScore += 15;
        predictedDisputes.push({
          type: 'Complaint Escalation',
          likelihood: 'Medium',
          timeframe: 'Within 2-3 months',
          reasoning: `Tenant has ${data.complaints} complaint(s). If these aren't addressed satisfactorily, they may escalate to formal disputes.`,
        });
        riskFactors.push({
          category: 'Complaints',
          factor: `Multiple complaints (${data.complaints})`,
          severity: 'Medium',
          impact: 'Risk of complaints escalating to formal disputes if not resolved.',
        });
      }

      // Analyze complaint types
      const complaintTypes = data.complaintTypes || [];
      if (complaintTypes.includes('Noise') || complaintTypes.includes('Neighbors')) {
        riskScore += 10;
        riskFactors.push({
          category: 'Complaints',
          factor: 'Noise/neighbor complaints',
          severity: 'Medium',
          impact:
            'Can lead to disputes over lease violations and property management responsibilities.',
        });
      }
      if (complaintTypes.includes('Safety') || complaintTypes.includes('Security')) {
        riskScore += 15;
        riskFactors.push({
          category: 'Complaints',
          factor: 'Safety/security complaints',
          severity: 'High',
          impact: 'Serious issue that can lead to habitability disputes and legal liability.',
        });
      }
    }

    // LEASE VIOLATION PREDICTIONS
    if (data.leaseViolations > 0) {
      riskScore += 20;
      predictedDisputes.push({
        type: 'Lease Violation Dispute',
        likelihood: 'High',
        timeframe: 'Within 1-2 months',
        reasoning: `Tenant has ${data.leaseViolations} lease violation(s). Violations often lead to disputes over enforcement, penalties, or potential eviction proceedings.`,
      });
      riskFactors.push({
        category: 'Lease Compliance',
        factor: `Lease violations (${data.leaseViolations})`,
        severity: 'High',
        impact: 'Can lead to disputes over enforcement, penalties, and potential eviction.',
      });
      preventiveActions.push({
        priority: 'High',
        action: 'Document violations and provide written notice with clear expectations',
        impact: 'Establishes paper trail and gives tenant opportunity to correct behavior.',
        timeframe: 'This week',
      });
    }

    // PREVIOUS DISPUTE HISTORY
    if (data.previousDisputes > 0) {
      riskScore += 15;
      predictedDisputes.push({
        type: 'Recurring Dispute Pattern',
        likelihood: 'High',
        timeframe: 'Within 1-3 months',
        reasoning: `Tenant has ${data.previousDisputes} previous dispute(s). History of disputes indicates a pattern that is likely to continue, especially if underlying issues haven't been resolved.`,
      });
      riskFactors.push({
        category: 'History',
        factor: `Previous disputes (${data.previousDisputes})`,
        severity: 'High',
        impact: 'Tenants with dispute history are more likely to have future disputes.',
      });
      preventiveActions.push({
        priority: 'High',
        action: 'Review previous disputes and address root causes',
        impact: 'Prevents repeat of same issues and breaks dispute cycle.',
        timeframe: 'This month',
      });
    }

    // LEASE ENDING SOON
    if (monthsRemaining < 3 && monthsRemaining > 0) {
      if (data.complaints > 0 || data.unresolvedMaintenance > 0 || data.paymentDelays > 0) {
        riskScore += 10;
        predictedDisputes.push({
          type: 'Lease Renewal Dispute',
          likelihood: 'Medium',
          timeframe: 'At lease end',
          reasoning: `Lease ends in ${monthsRemaining.toFixed(1)} months and there are outstanding issues. This may lead to disputes over security deposit, property condition, or renewal terms.`,
        });
        preventiveActions.push({
          priority: 'Medium',
          action: 'Resolve all outstanding issues before lease end',
          impact: 'Prevents disputes over security deposit and property condition.',
          timeframe: 'Before lease end',
        });
      }
    }

    // Determine overall risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (riskScore >= 70) {
      riskLevel = 'Critical';
    } else if (riskScore >= 50) {
      riskLevel = 'High';
    } else if (riskScore >= 30) {
      riskLevel = 'Medium';
    }

    // Generate summary
    let summary = '';
    if (riskLevel === 'Critical') {
      summary = `This tenant has a critical dispute risk (${riskScore}/100). Multiple serious issues indicate high likelihood of disputes requiring immediate attention and intervention.`;
    } else if (riskLevel === 'High') {
      summary = `This tenant has a high dispute risk (${riskScore}/100). Several concerning patterns suggest disputes are likely if issues aren't addressed proactively.`;
    } else if (riskLevel === 'Medium') {
      summary = `This tenant has a moderate dispute risk (${riskScore}/100). Some warning signs exist that should be monitored and addressed to prevent escalation.`;
    } else {
      summary = `This tenant has a low dispute risk (${riskScore}/100). Current patterns suggest minimal dispute likelihood, but continue monitoring.`;
    }

    // Sort preventive actions by priority
    preventiveActions.sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      predictedDisputes,
      riskFactors,
      preventiveActions,
      summary,
    };
  };

  const handleAnalyze = () => {
    if (!tenantData.tenantName || !tenantData.propertyName) {
      return;
    }

    const result = predictDisputes(tenantData);
    setPrediction(result);
  };

  const updateField = <K extends keyof TenantData>(field: K, value: TenantData[K]) => {
    setTenantData((prev) => ({ ...prev, [field]: value }));
  };

  const addComplaintType = () => {
    if (complaintTypeInput.trim()) {
      updateField('complaintTypes', [...tenantData.complaintTypes, complaintTypeInput.trim()]);
      setComplaintTypeInput('');
    }
  };

  const removeComplaintType = (index: number) => {
    updateField(
      'complaintTypes',
      tenantData.complaintTypes.filter((_, i) => i !== index)
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-destructive/10 text-destructive border-destructive/40';
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

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/40';
      case 'Medium':
        return 'bg-accent text-accent-foreground border-border';
      case 'Low':
        return 'bg-secondary text-secondary-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Dispute Predictor
          </CardTitle>
          <CardDescription>
            Analyze tenant patterns to predict potential disputes and get preventive recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  value={tenantData.tenantName}
                  onChange={(e) => updateField('tenantName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="propertyName">Property Name *</Label>
                <Input
                  id="propertyName"
                  value={tenantData.propertyName}
                  onChange={(e) => updateField('propertyName', e.target.value)}
                  placeholder="Unit 5A, Building 2"
                />
              </div>
              <div>
                <Label htmlFor="leaseStartDate">Lease Start Date</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={tenantData.leaseStartDate}
                  onChange={(e) => updateField('leaseStartDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={tenantData.leaseEndDate}
                  onChange={(e) => updateField('leaseEndDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="annualRent">Annual Rent (₦)</Label>
                <Input
                  id="annualRent"
                  type="number"
                  value={tenantData.annualRent || ''}
                  onChange={(e) => updateField('annualRent', parseFloat(e.target.value) || 0)}
                  placeholder="6000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Communication Patterns */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Communication Patterns</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="communicationFrequency">Communication Frequency</Label>
                <Select
                  value={tenantData.communicationFrequency}
                  onValueChange={(value) => updateField('communicationFrequency', value as any)}
                >
                  <SelectTrigger id="communicationFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent - Regular, proactive</SelectItem>
                    <SelectItem value="good">Good - Regular communication</SelectItem>
                    <SelectItem value="fair">Fair - Occasional communication</SelectItem>
                    <SelectItem value="poor">Poor - Rarely communicates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responseTime">Response Time</Label>
                <Select
                  value={tenantData.responseTime}
                  onValueChange={(value) => updateField('responseTime', value as any)}
                >
                  <SelectTrigger id="responseTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="same-day">Same Day</SelectItem>
                    <SelectItem value="within-2-days">Within 2 Days</SelectItem>
                    <SelectItem value="slow">Slow (3+ days)</SelectItem>
                    <SelectItem value="no-response">No Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Patterns */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Patterns</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="paymentDelays">Number of Payment Delays</Label>
                <Input
                  id="paymentDelays"
                  type="number"
                  value={tenantData.paymentDelays || ''}
                  onChange={(e) => updateField('paymentDelays', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="averageDaysLate">Average Days Late</Label>
                <Input
                  id="averageDaysLate"
                  type="number"
                  value={tenantData.averageDaysLate || ''}
                  onChange={(e) => updateField('averageDaysLate', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Maintenance Patterns */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Maintenance Patterns</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="maintenanceRequests">Total Maintenance Requests</Label>
                <Input
                  id="maintenanceRequests"
                  type="number"
                  value={tenantData.maintenanceRequests || ''}
                  onChange={(e) =>
                    updateField('maintenanceRequests', parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="unresolvedMaintenance">Unresolved Maintenance</Label>
                <Input
                  id="unresolvedMaintenance"
                  type="number"
                  value={tenantData.unresolvedMaintenance || ''}
                  onChange={(e) =>
                    updateField('unresolvedMaintenance', parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Complaints and Violations */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Complaints & Violations</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="complaints">Number of Complaints</Label>
                <Input
                  id="complaints"
                  type="number"
                  value={tenantData.complaints || ''}
                  onChange={(e) => updateField('complaints', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="leaseViolations">Lease Violations</Label>
                <Input
                  id="leaseViolations"
                  type="number"
                  value={tenantData.leaseViolations || ''}
                  onChange={(e) => updateField('leaseViolations', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="previousDisputes">Previous Disputes</Label>
                <Input
                  id="previousDisputes"
                  type="number"
                  value={tenantData.previousDisputes || ''}
                  onChange={(e) => updateField('previousDisputes', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Complaint Types */}
            <div className="mt-4">
              <Label>Complaint Types</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={complaintTypeInput}
                  onChange={(e) => setComplaintTypeInput(e.target.value)}
                  placeholder="e.g., Noise, Maintenance, Safety"
                  onKeyPress={(e) => e.key === 'Enter' && addComplaintType()}
                />
                <Button type="button" onClick={addComplaintType} variant="outline">
                  Add
                </Button>
              </div>
              {tenantData.complaintTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tenantData.complaintTypes.map((type, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeComplaintType(index)}
                    >
                      {type} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <Shield className="mr-2 h-4 w-4" />
            Predict Disputes
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {prediction && (
        <>
          {/* Risk Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dispute Risk Assessment</CardTitle>
                <Badge className={getRiskColor(prediction.riskLevel)}>
                  {prediction.riskLevel} Risk
                </Badge>
              </div>
              <CardDescription>Risk Score: {prediction.riskScore}/100</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert
                className={
                  prediction.riskLevel === 'Critical'
                    ? 'border-destructive/40 bg-destructive/10'
                    : prediction.riskLevel === 'High'
                      ? 'border-destructive/40 bg-destructive/10'
                      : prediction.riskLevel === 'Medium'
                        ? 'border-border bg-accent/40'
                        : 'border-border bg-primary/10'
                }
              >
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <AlertTitle className="text-lg font-semibold">Risk Summary</AlertTitle>
                <AlertDescription className="mt-2">{prediction.summary}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Predicted Disputes */}
          {prediction.predictedDisputes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predicted Disputes
                </CardTitle>
                <CardDescription>Potential disputes based on current patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prediction.predictedDisputes.map((dispute, index) => (
                    <Alert
                      key={index}
                      className={
                        dispute.likelihood === 'High'
                          ? 'border-destructive/40 bg-destructive/10'
                          : dispute.likelihood === 'Medium'
                            ? 'border-border bg-accent/40'
                            : 'border-border bg-secondary/40'
                      }
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertTitle className="flex items-center gap-2">
                        {dispute.type}
                        <Badge className={getLikelihoodColor(dispute.likelihood)}>
                          {dispute.likelihood} Likelihood
                        </Badge>
                        <Badge variant="outline">{dispute.timeframe}</Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">{dispute.reasoning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {prediction.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Risk Factors
                </CardTitle>
                <CardDescription>Issues contributing to dispute risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prediction.riskFactors.map((factor, index) => (
                    <div key={index} className="rounded-lg border bg-muted/40 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{factor.category}</span>
                        <Badge
                          className={
                            factor.severity === 'High'
                              ? 'bg-destructive/10 text-destructive'
                              : factor.severity === 'Medium'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground'
                          }
                        >
                          {factor.severity}
                        </Badge>
                      </div>
                      <p className="mb-1 text-sm text-foreground">{factor.factor}</p>
                      <p className="text-xs text-muted-foreground">{factor.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preventive Actions */}
          {prediction.preventiveActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Preventive Actions
                </CardTitle>
                <CardDescription>Recommended actions to prevent disputes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prediction.preventiveActions.map((action, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        action.priority === 'High'
                          ? 'border-destructive/40 bg-destructive/10'
                          : action.priority === 'Medium'
                            ? 'border-border bg-accent/40'
                            : 'border-border bg-secondary/40'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{action.action}</span>
                        <Badge
                          className={
                            action.priority === 'High'
                              ? 'bg-destructive/10 text-destructive'
                              : action.priority === 'Medium'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground'
                          }
                        >
                          {action.priority} Priority
                        </Badge>
                      </div>
                      <p className="mb-1 text-sm text-foreground">{action.impact}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Timeframe:</strong> {action.timeframe}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
