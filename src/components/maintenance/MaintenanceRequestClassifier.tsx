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
  Wrench,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  Zap,
  CheckCircle,
  Info,
  Building,
} from 'lucide-react';

interface MaintenanceClassification {
  priority: 'Emergency' | 'High Priority' | 'Normal' | 'Cosmetic';
  expectedResolutionTime: string;
  responsibleRole: string;
  costImplication: {
    level: 'None' | 'Low' | 'Medium' | 'High';
    estimatedRange?: string;
    description: string;
  };
  reasoning: string;
  recommendedActions: string[];
}

interface MaintenanceRequest {
  issueType: string;
  description: string;
  location: string;
  reportedBy: string;
  urgency: string;
  affectedAreas: string[];
  safetyConcern: boolean;
  propertyDamage: boolean;
  tenantImpact: 'none' | 'low' | 'medium' | 'high';
}

export function MaintenanceRequestClassifier() {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [urgency, setUrgency] = useState('');
  const [safetyConcern, setSafetyConcern] = useState(false);
  const [propertyDamage, setPropertyDamage] = useState(false);
  const [tenantImpact, setTenantImpact] = useState<string>('low');
  const [classification, setClassification] = useState<MaintenanceClassification | null>(null);

  const issueTypes = [
    'Plumbing - Water Leak',
    'Plumbing - No Water',
    'Plumbing - Blocked Drain',
    'Plumbing - Burst Pipe',
    'Electrical - Power Outage',
    'Electrical - Faulty Wiring',
    'Electrical - Broken Switch/Outlet',
    'HVAC - No Air Conditioning',
    'HVAC - Heating Issue',
    'HVAC - Poor Ventilation',
    'Structural - Cracks in Wall',
    'Structural - Roof Leak',
    'Structural - Door/Window Issue',
    'Security - Broken Lock',
    'Security - CCTV Issue',
    'Security - Gate/Fence Damage',
    'Appliance - Refrigerator',
    'Appliance - Washing Machine',
    'Appliance - Generator',
    'Pest Control',
    'Cleaning - Deep Clean',
    'Cleaning - Regular Maintenance',
    'Painting - Touch Up',
    'Painting - Full Repaint',
    'Landscaping',
    'Other',
  ];

  const classifyRequest = (request: MaintenanceRequest): MaintenanceClassification => {
    const issue = request.issueType.toLowerCase();
    const desc = request.description.toLowerCase();
    const urgencyLevel = request.urgency.toLowerCase();
    let priority: MaintenanceClassification['priority'] = 'Normal';
    let expectedTime = '';
    let responsibleRole = '';
    let costLevel: 'None' | 'Low' | 'Medium' | 'High' = 'Low';
    let costRange = '';
    let costDescription = '';
    let reasoning = '';
    const recommendedActions: string[] = [];

    // Emergency Classification
    if (
      request.safetyConcern ||
      issue.includes('burst pipe') ||
      issue.includes('power outage') ||
      issue.includes('gas leak') ||
      issue.includes('fire') ||
      issue.includes('flooding') ||
      desc.includes('electrical hazard') ||
      desc.includes('structural collapse') ||
      desc.includes('security breach') ||
      urgencyLevel === 'immediate' ||
      request.tenantImpact === 'high'
    ) {
      priority = 'Emergency';
      expectedTime = '2-4 hours';
      responsibleRole = 'Emergency Maintenance Team / Licensed Contractor';
      costLevel = 'High';
      costRange = '₦50,000 - ₦500,000+';
      costDescription =
        'Emergency repairs typically require immediate contractor response and may involve after-hours service charges.';
      reasoning =
        'This is classified as an emergency due to safety concerns, potential property damage, or critical system failure requiring immediate attention.';
      recommendedActions.push('Dispatch emergency maintenance team immediately');
      recommendedActions.push('Assess safety risks and evacuate if necessary');
      recommendedActions.push('Contact licensed contractor if specialized skills required');
      recommendedActions.push('Document incident and take photos');
      recommendedActions.push('Notify property owner/manager immediately');
    }
    // High Priority Classification
    else if (
      issue.includes('no water') ||
      issue.includes('no air conditioning') ||
      issue.includes('blocked drain') ||
      issue.includes('roof leak') ||
      issue.includes('broken lock') ||
      issue.includes('faulty wiring') ||
      request.propertyDamage ||
      request.tenantImpact === 'high' ||
      urgencyLevel === 'urgent' ||
      (issue.includes('plumbing') && desc.includes('flooding')) ||
      (issue.includes('electrical') && desc.includes('sparking'))
    ) {
      priority = 'High Priority';
      expectedTime = '24-48 hours';
      responsibleRole = 'Maintenance Technician / Specialist Contractor';
      costLevel = 'Medium';
      costRange = '₦20,000 - ₦150,000';
      costDescription =
        'High priority issues may require specialized contractors or parts, increasing costs.';
      reasoning =
        'This issue significantly impacts tenant comfort, property integrity, or security and should be addressed within 24-48 hours.';
      recommendedActions.push('Schedule maintenance within 24 hours');
      recommendedActions.push('Assess if specialized contractor is needed');
      recommendedActions.push('Order necessary parts/materials');
      recommendedActions.push('Communicate timeline to tenant');
      recommendedActions.push('Follow up after completion');
    }
    // Cosmetic Classification
    else if (
      issue.includes('painting') ||
      issue.includes('touch up') ||
      issue.includes('landscaping') ||
      issue.includes('cosmetic') ||
      desc.includes('aesthetic') ||
      desc.includes('appearance') ||
      (issue.includes('cleaning') && !desc.includes('urgent')) ||
      urgencyLevel === 'low' ||
      request.tenantImpact === 'none'
    ) {
      priority = 'Cosmetic';
      expectedTime = '1-2 weeks';
      responsibleRole = 'General Maintenance / Cleaning Staff';
      costLevel = 'Low';
      costRange = '₦5,000 - ₦50,000';
      costDescription =
        'Cosmetic repairs are typically low-cost and can be scheduled during regular maintenance windows.';
      reasoning =
        'This is a cosmetic issue that does not affect functionality, safety, or tenant comfort and can be scheduled for routine maintenance.';
      recommendedActions.push('Schedule during next maintenance window');
      recommendedActions.push('Group with other cosmetic repairs if possible');
      recommendedActions.push('Obtain quotes if cost exceeds budget threshold');
      recommendedActions.push('Inform tenant of expected timeline');
    }
    // Normal Priority (default)
    else {
      priority = 'Normal';
      expectedTime = '3-7 days';
      responsibleRole = 'Maintenance Technician';
      costLevel = 'Low';
      costRange = '₦10,000 - ₦80,000';
      costDescription = 'Standard maintenance issues with routine parts and labor costs.';
      reasoning =
        'This is a standard maintenance request that should be addressed within a week during normal business hours.';
      recommendedActions.push('Schedule within 3-7 business days');
      recommendedActions.push('Assess parts/materials needed');
      recommendedActions.push('Update tenant on expected completion date');
      recommendedActions.push('Complete work order documentation');
    }

    // Adjust based on specific issue types
    if (issue.includes('generator')) {
      responsibleRole = 'Generator Specialist / Licensed Electrician';
      costLevel = costLevel === 'Low' ? 'Medium' : costLevel;
      costRange = costRange === '₦10,000 - ₦80,000' ? '₦30,000 - ₦200,000' : costRange;
    }

    if (issue.includes('hvac') || issue.includes('air conditioning')) {
      if (priority !== 'Emergency') {
        responsibleRole = 'HVAC Technician';
        costLevel = costLevel === 'Low' ? 'Medium' : costLevel;
      }
    }

    if (issue.includes('structural') || issue.includes('roof')) {
      responsibleRole = 'Structural Engineer / Licensed Contractor';
      costLevel = costLevel === 'Low' ? 'Medium' : costLevel === 'Medium' ? 'High' : costLevel;
      if (costRange === '₦10,000 - ₦80,000') {
        costRange = '₦50,000 - ₦300,000';
      }
    }

    if (issue.includes('electrical') && !issue.includes('outlet') && !issue.includes('switch')) {
      responsibleRole = 'Licensed Electrician';
      costLevel = costLevel === 'Low' ? 'Medium' : costLevel;
    }

    if (issue.includes('plumbing') && (issue.includes('leak') || issue.includes('pipe'))) {
      responsibleRole = 'Licensed Plumber';
      if (costLevel === 'Low') {
        costLevel = 'Medium';
        costRange = '₦15,000 - ₦100,000';
      }
    }

    return {
      priority,
      expectedResolutionTime: expectedTime,
      responsibleRole,
      costImplication: {
        level: costLevel,
        estimatedRange: costRange,
        description: costDescription,
      },
      reasoning,
      recommendedActions,
    };
  };

  const handleClassify = () => {
    if (!issueType || !description || !location) {
      return;
    }

    const request: MaintenanceRequest = {
      issueType,
      description,
      location,
      reportedBy: reportedBy || 'Tenant',
      urgency: urgency || 'normal',
      affectedAreas: [],
      safetyConcern: safetyConcern,
      propertyDamage: propertyDamage,
      tenantImpact: tenantImpact as any,
    };

    const classification = classifyRequest(request);
    setClassification(classification);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High Priority':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cosmetic':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'High Priority':
        return <Zap className="h-5 w-5 text-orange-500" />;
      case 'Normal':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'Cosmetic':
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCostColor = (level: string) => {
    switch (level) {
      case 'None':
        return 'text-green-600';
      case 'Low':
        return 'text-blue-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'High':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-500" />
            Maintenance Request Classifier
          </CardTitle>
          <CardDescription>
            Classify maintenance requests and get recommendations for resolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Request Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="issueType">Issue Type *</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger id="issueType">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Unit 5A, Common Area, Building 2"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="reportedBy">Reported By</Label>
                <Input
                  id="reportedBy"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="Tenant name or staff"
                />
              </div>
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tenantImpact">Tenant Impact</Label>
                <Select value={tenantImpact} onValueChange={setTenantImpact}>
                  <SelectTrigger id="tenantImpact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Factors */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Additional Factors</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="safetyConcern"
                  checked={safetyConcern}
                  onChange={(e) => setSafetyConcern(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="safetyConcern" className="cursor-pointer font-normal">
                  Safety Concern / Hazard Present
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="propertyDamage"
                  checked={propertyDamage}
                  onChange={(e) => setPropertyDamage(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="propertyDamage" className="cursor-pointer font-normal">
                  Property Damage / Risk of Further Damage
                </Label>
              </div>
            </div>
          </div>

          <Button onClick={handleClassify} className="w-full" size="lg">
            <Wrench className="mr-2 h-4 w-4" />
            Classify Request
          </Button>
        </CardContent>
      </Card>

      {/* Classification Results */}
      {classification && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Classification Results</CardTitle>
              <Badge className={getPriorityColor(classification.priority)}>
                {classification.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Priority Alert */}
            <Alert
              className={
                classification.priority === 'Emergency'
                  ? 'border-red-200 bg-red-50'
                  : classification.priority === 'High Priority'
                    ? 'border-orange-200 bg-orange-50'
                    : classification.priority === 'Normal'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
              }
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(classification.priority)}
                <div className="flex-1">
                  <AlertTitle className="text-lg font-semibold">
                    Priority: {classification.priority}
                  </AlertTitle>
                  <AlertDescription className="mt-2">{classification.reasoning}</AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Resolution Time</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {classification.expectedResolutionTime}
                </p>
                <p className="mt-1 text-sm text-gray-600">Expected time to resolve</p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Responsible Role</h3>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  {classification.responsibleRole}
                </p>
                <p className="mt-1 text-sm text-gray-600">Assigned to handle this request</p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Cost Implication</h3>
                </div>
                <p
                  className={`text-2xl font-bold ${getCostColor(classification.costImplication.level)}`}
                >
                  {classification.costImplication.level}
                </p>
                {classification.costImplication.estimatedRange && (
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {classification.costImplication.estimatedRange}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-600">
                  {classification.costImplication.description}
                </p>
              </div>
            </div>

            <Separator />

            {/* Recommended Actions */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Building className="h-5 w-5" />
                Recommended Actions
              </h3>
              <ol className="space-y-2">
                {classification.recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 font-semibold text-blue-600">{index + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cost Details */}
            {classification.costImplication.estimatedRange && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Cost Estimate
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>Estimated Range:</strong> {classification.costImplication.estimatedRange}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {classification.costImplication.description}
                </p>
                <p className="mt-2 text-xs italic text-gray-500">
                  Note: Actual costs may vary based on contractor rates, material prices, and scope
                  of work required.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
