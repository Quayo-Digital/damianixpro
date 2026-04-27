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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceUpdate {
  technicalDescription: string;
  issueType: string;
  status: string;
  estimatedDuration: string;
  affectedAreas: string;
  workRequired: string;
}

export function TenantFriendlyMaintenanceUpdate() {
  const [technicalDescription, setTechnicalDescription] = useState('');
  const [issueType, setIssueType] = useState('');
  const [status, setStatus] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [affectedAreas, setAffectedAreas] = useState('');
  const [workRequired, setWorkRequired] = useState('');
  const [tenantFriendlyMessage, setTenantFriendlyMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const issueTypes = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Structural',
    'Security',
    'Appliance',
    'Cleaning',
    'Painting',
    'Landscaping',
    'General Maintenance',
  ];

  const statusOptions = [
    'Scheduled',
    'In Progress',
    'Completed',
    'Delayed',
    'Rescheduled',
    'Cancelled',
  ];

  const convertToTenantFriendly = (update: MaintenanceUpdate): string => {
    let message = '';

    // Opening - Reassuring and professional
    message += `Dear Valued Tenant,\n\n`;

    // Issue Type Translation
    const issueTranslations: Record<string, string> = {
      Plumbing: 'plumbing issue',
      Electrical: 'electrical maintenance',
      HVAC: 'air conditioning or heating',
      Structural: 'building maintenance',
      Security: 'security system',
      Appliance: 'appliance repair',
      Cleaning: 'cleaning service',
      Painting: 'painting work',
      Landscaping: 'landscaping maintenance',
      'General Maintenance': 'maintenance work',
    };

    const friendlyIssueType = issueTranslations[update.issueType] || 'maintenance work';

    // Status-based messaging
    if (update.status === 'Scheduled') {
      message += `We wanted to inform you about upcoming ${friendlyIssueType} in your building. `;
      message += `This is part of our regular maintenance schedule to ensure everything continues to work smoothly.\n\n`;
    } else if (update.status === 'In Progress') {
      message += `We're currently working on ${friendlyIssueType} in your building. `;
      message += `Our maintenance team is on-site and handling this for you.\n\n`;
    } else if (update.status === 'Completed') {
      message += `We're pleased to inform you that the ${friendlyIssueType} has been completed successfully. `;
      message += `Everything should now be working as expected.\n\n`;
    } else if (update.status === 'Delayed' || update.status === 'Rescheduled') {
      message += `We wanted to update you about the ${friendlyIssueType} that was planned. `;
      message += `Due to circumstances beyond our control, we need to reschedule this work.\n\n`;
    } else {
      message += `We wanted to update you about ${friendlyIssueType} in your building.\n\n`;
    }

    // Technical Description Translation
    const technicalTerms: Record<string, string> = {
      replacement: 'fixing',
      repair: 'fixing',
      installation: 'installing',
      maintenance: 'checking and maintaining',
      inspection: 'checking',
      upgrade: 'improving',
      servicing: 'servicing',
      calibration: 'adjusting',
      troubleshooting: 'fixing',
      diagnostics: 'checking',
      refurbishment: 'refreshing',
      renovation: 'updating',
    };

    let friendlyDescription = update.technicalDescription.toLowerCase();
    Object.entries(technicalTerms).forEach(([tech, friendly]) => {
      friendlyDescription = friendlyDescription.replace(new RegExp(tech, 'gi'), friendly);
    });

    // Remove technical jargon
    const jargonRemovals = [
      /valve/i,
      /circuit breaker/i,
      /compressor/i,
      /condenser/i,
      /thermostat/i,
      /breaker panel/i,
      /junction box/i,
      /pvc/i,
      /gasket/i,
      /sealant/i,
    ];

    jargonRemovals.forEach((pattern) => {
      friendlyDescription = friendlyDescription.replace(pattern, 'equipment');
    });

    // Simplify the description
    if (update.technicalDescription) {
      message += `What we're doing: `;
      message += friendlyDescription.charAt(0).toUpperCase() + friendlyDescription.slice(1);
      if (!friendlyDescription.endsWith('.') && !friendlyDescription.endsWith('!')) {
        message += '.';
      }
      message += `\n\n`;
    }

    // Affected Areas
    if (update.affectedAreas) {
      message += `Affected areas: ${update.affectedAreas}\n\n`;
    }

    // Duration
    if (update.estimatedDuration) {
      const duration = update.estimatedDuration.toLowerCase();
      let friendlyDuration = duration;

      if (duration.includes('hour')) {
        friendlyDuration = duration.replace(/hour(s)?/gi, 'hour$1');
        message += `Expected duration: ${friendlyDuration}\n\n`;
      } else if (duration.includes('day')) {
        friendlyDuration = duration.replace(/day(s)?/gi, 'day$1');
        message += `Expected duration: ${friendlyDuration}\n\n`;
      } else {
        message += `Expected duration: ${friendlyDuration}\n\n`;
      }
    }

    // Work Required - Simplified
    if (update.workRequired) {
      let friendlyWork = update.workRequired.toLowerCase();

      // Replace technical terms
      friendlyWork = friendlyWork.replace(/replace/gi, 'fix');
      friendlyWork = friendlyWork.replace(/repair/gi, 'fix');
      friendlyWork = friendlyWork.replace(/install/gi, 'set up');
      friendlyWork = friendlyWork.replace(/maintain/gi, 'check');
      friendlyWork = friendlyWork.replace(/inspect/gi, 'check');
      friendlyWork = friendlyWork.replace(/upgrade/gi, 'improve');
      friendlyWork = friendlyWork.replace(/calibrate/gi, 'adjust');
      friendlyWork = friendlyWork.replace(/troubleshoot/gi, 'fix');
      friendlyWork = friendlyWork.replace(/diagnose/gi, 'check');

      message += `What this means for you: `;
      message += friendlyWork.charAt(0).toUpperCase() + friendlyWork.slice(1);
      if (!friendlyWork.endsWith('.') && !friendlyWork.endsWith('!')) {
        message += '.';
      }
      message += `\n\n`;
    }

    // Reassuring closing based on status
    if (update.status === 'Scheduled') {
      message += `We'll do our best to minimize any inconvenience. `;
      message += `If you have any questions or concerns, please don't hesitate to reach out to us.\n\n`;
    } else if (update.status === 'In Progress') {
      message += `We appreciate your patience while we complete this work. `;
      message += `If you notice any issues or have concerns, please let us know immediately.\n\n`;
    } else if (update.status === 'Completed') {
      message += `Thank you for your patience during this maintenance. `;
      message += `If you notice anything that needs attention, please don't hesitate to contact us.\n\n`;
    } else if (update.status === 'Delayed' || update.status === 'Rescheduled') {
      message += `We apologize for any inconvenience this may cause. `;
      message += `We'll keep you updated on the new schedule and will notify you as soon as we have a confirmed date.\n\n`;
    } else {
      message += `If you have any questions or concerns, please don't hesitate to reach out to us.\n\n`;
    }

    // Professional closing
    message += `Thank you for your understanding.\n\n`;
    message += `Best regards,\n`;
    message += `Property Management Team`;

    return message;
  };

  const handleGenerate = () => {
    if (!technicalDescription && !issueType) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least a technical description or select an issue type',
        variant: 'destructive',
      });
      return;
    }

    const update: MaintenanceUpdate = {
      technicalDescription: technicalDescription || `Maintenance work for ${issueType}`,
      issueType: issueType || 'General Maintenance',
      status: status || 'Scheduled',
      estimatedDuration: estimatedDuration || '',
      affectedAreas: affectedAreas || '',
      workRequired: workRequired || '',
    };

    const friendlyMessage = convertToTenantFriendly(update);
    setTenantFriendlyMessage(friendlyMessage);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tenantFriendlyMessage);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Tenant-friendly message copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Tenant-Friendly Maintenance Update
          </CardTitle>
          <CardDescription>
            Convert technical maintenance updates into clear, reassuring messages for tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Technical Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Technical Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="issueType">Issue Type</Label>
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="technicalDescription">Technical Description *</Label>
                <Textarea
                  id="technicalDescription"
                  value={technicalDescription}
                  onChange={(e) => setTechnicalDescription(e.target.value)}
                  placeholder="e.g., Replacing faulty circuit breaker in main electrical panel, performing diagnostics on HVAC compressor unit..."
                  className="min-h-[100px]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the technical description as written by maintenance team
                </p>
              </div>
              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                <Input
                  id="estimatedDuration"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g., 2-3 hours, 1 day"
                />
              </div>
              <div>
                <Label htmlFor="affectedAreas">Affected Areas</Label>
                <Input
                  id="affectedAreas"
                  value={affectedAreas}
                  onChange={(e) => setAffectedAreas(e.target.value)}
                  placeholder="e.g., Building A, Units 1-5, Common areas"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="workRequired">Work Required</Label>
                <Textarea
                  id="workRequired"
                  value={workRequired}
                  onChange={(e) => setWorkRequired(e.target.value)}
                  placeholder="e.g., Replacement of faulty components, system calibration, routine maintenance inspection..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Tenant-Friendly Message
          </Button>
        </CardContent>
      </Card>

      {/* Generated Message */}
      {tenantFriendlyMessage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tenant-Friendly Message</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Ready to send to tenants - clear, professional, and reassuring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Message Preview</h3>
                </div>
                <Textarea
                  value={tenantFriendlyMessage}
                  readOnly
                  className="min-h-[300px] border border-border bg-background font-medium text-foreground dark:bg-card"
                />
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Message Features
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ Written in simple, easy-to-understand language</li>
                  <li>✓ Reassuring and professional tone</li>
                  <li>✓ Technical jargon removed or explained</li>
                  <li>✓ Clear about what's happening and when</li>
                  <li>✓ Includes contact information for questions</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1" variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button
                  onClick={() => {
                    setTenantFriendlyMessage('');
                    setTechnicalDescription('');
                    setIssueType('');
                    setStatus('');
                    setEstimatedDuration('');
                    setAffectedAreas('');
                    setWorkRequired('');
                  }}
                  variant="outline"
                >
                  Clear & Start Over
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
