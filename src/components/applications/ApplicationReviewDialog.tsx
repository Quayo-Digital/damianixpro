import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RentalApplication, ApplicationDocument } from '@/services/applications/types';
import {
  updateApplicationStatus,
  getApplicationDocuments,
} from '@/services/applications/applicationApi';
import { toast } from 'sonner';
import { useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  fetchLeasingApplicationAssist,
  type LeasingAssistOptions,
} from '@/services/ai/leasingAssistApi';
import { collectApplicationDocumentsOcr } from '@/services/ai/collectApplicationDocumentsOcr';

interface ApplicationReviewDialogProps {
  application: RentalApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
}

export function ApplicationReviewDialog({
  application,
  open,
  onOpenChange,
  onStatusChange,
}: ApplicationReviewDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiAssistText, setAiAssistText] = useState('');
  const [aiAssistLoading, setAiAssistLoading] = useState(false);
  const [aiAssistError, setAiAssistError] = useState<string | null>(null);
  const [includeDocumentOcr, setIncludeDocumentOcr] = useState(false);
  const [aiAssistPhase, setAiAssistPhase] = useState<'ocr' | 'assist'>('assist');

  useEffect(() => {
    if (open && application) {
      setAdminNotes(application.admin_notes || '');
      setAiAssistText('');
      setAiAssistError(null);
      setIncludeDocumentOcr(false);
      setAiAssistPhase('assist');
      fetchDocuments();
    }
  }, [open, application]);

  const fetchDocuments = async () => {
    if (!application) return;

    setIsLoadingDocs(true);
    try {
      const docs = await getApplicationDocuments(application.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpdateStatus = async (status: RentalApplication['status']) => {
    if (!application) return;

    setIsUpdating(true);
    try {
      const success = await updateApplicationStatus(application.id, status, adminNotes);

      if (success) {
        const notifyDesc =
          status === 'pending'
            ? undefined
            : 'The applicant will see an in-app notification on their tenant dashboard.';
        toast.success(
          `Application ${status}`,
          notifyDesc ? { description: notifyDesc } : undefined
        );

        if (onStatusChange) {
          onStatusChange();
        }

        onOpenChange(false);
      } else {
        toast.error('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadDocument = async (document: ApplicationDocument) => {
    if (!document.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('application-documents')
        .download(document.file_path);

      if (error) {
        throw error;
      }

      // Create a download link using the global document object
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDocumentPreview = async (doc: ApplicationDocument) => {
    try {
      setIsDownloading(true);

      // Get document data
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', doc.document_id)
        .single();

      if (documentError || !documentData) {
        throw new Error('Could not find document');
      }

      // Get the file from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('application-documents')
        .download(documentData.file_path);

      if (fileError || !fileData) {
        throw new Error('Could not download file');
      }

      // Create blob URL for preview
      const blob = new Blob([fileData], { type: documentData.file_type });
      const url = URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      setIsDownloading(false);
    } catch (error) {
      console.error('Error previewing document:', error);
      setIsDownloading(false);
      toast.error('Failed to preview document');
    }
  };

  const handleGenerateAiAssist = async () => {
    if (!application) return;
    setAiAssistLoading(true);
    setAiAssistError(null);
    setAiAssistText('');
    try {
      let options: LeasingAssistOptions | undefined;

      if (includeDocumentOcr && documents.length > 0) {
        setAiAssistPhase('ocr');
        const { snippets } = await collectApplicationDocumentsOcr(documents);
        if (snippets.length) options = { documentOcrSnippets: snippets };
      }

      setAiAssistPhase('assist');
      const result = await fetchLeasingApplicationAssist(application, documents.length, options);
      if (result.ok) {
        setAiAssistText(result.text);
      } else {
        setAiAssistError(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI request failed.';
      setAiAssistError(msg);
    } finally {
      setAiAssistLoading(false);
      setAiAssistPhase('assist');
    }
  };

  const getStatusBadge = (status: RentalApplication['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'more_info':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            More Info Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (!application) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rental Application</span>
            {getStatusBadge(application.status)}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left text-sm text-muted-foreground">
              {application.property_name && (
                <span className="block">Property: {application.property_name}</span>
              )}
              {application.unit_id ? (
                <span className="block">Requested unit: {application.unit_id}</span>
              ) : null}
              <span className="block">
                Submitted: {new Date(application.created_at || '').toLocaleDateString()}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="details">Applicant</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="ai-assist">AI assist</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
                <p className="font-medium">
                  {application.first_name} {application.last_name}
                </p>
                <p className="text-sm">{application.email}</p>
                {application.phone && <p className="text-sm">{application.phone}</p>}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Employment</h3>
                <p className="font-medium">{application.occupation || 'Not specified'}</p>
                {application.monthly_income && (
                  <p className="text-sm">
                    Income: ₦{application.monthly_income.toLocaleString()}/month
                  </p>
                )}
                <p className="text-sm">
                  Status: {application.employment_status || 'Not specified'}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Rental Details</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    <strong>Current Address:</strong>
                  </p>
                  <p className="text-sm">{application.current_address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm">
                    <strong>Move-in Date:</strong>
                  </p>
                  <p className="text-sm">
                    {application.move_in_date
                      ? new Date(application.move_in_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    <strong>Lease Period:</strong>
                  </p>
                  <p className="text-sm">
                    {application.tenancy_period
                      ? `${application.tenancy_period} months`
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <strong>Occupants:</strong>
                  </p>
                  <p className="text-sm">{application.num_occupants || 'Not specified'}</p>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm">
                  <strong>Pets:</strong>
                </p>
                <p className="text-sm">
                  {application.has_pets
                    ? application.pets_details || 'Yes (no details provided)'
                    : 'No'}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Emergency Contact</h3>
              {application.emergency_contact_name ? (
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">{application.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm">{application.emergency_contact_phone || 'No phone'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">No emergency contact provided</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            {isLoadingDocs ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDocumentPreview(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No documents attached</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-assist" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              AI-generated screening notes for your review only — not legal advice and not a
              substitute for verifying identity, income, or documents yourself.
            </p>
            <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/30 p-3">
              <Checkbox
                id="include-doc-ocr"
                checked={includeDocumentOcr}
                onCheckedChange={(v) => setIncludeDocumentOcr(v === true)}
                disabled={isLoadingDocs || documents.length === 0 || aiAssistLoading}
                className="mt-0.5"
                aria-describedby="include-doc-ocr-hint"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="include-doc-ocr"
                  className="cursor-pointer text-sm font-medium leading-none"
                >
                  Include extracted text from attached documents (OCR)
                </Label>
                <p id="include-doc-ocr-hint" className="text-xs text-muted-foreground">
                  Downloads files you can access, runs OCR via your voice server (or browser
                  fallback), and sends excerpts to the model. May include sensitive personal data —
                  use only when appropriate. Up to six files; long text is truncated.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleGenerateAiAssist}
              disabled={aiAssistLoading}
            >
              {aiAssistLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {aiAssistPhase === 'ocr' ? 'Extracting document text…' : 'Generating notes…'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate screening notes
                </>
              )}
            </Button>
            {aiAssistError && (
              <p className="text-sm text-destructive" role="alert">
                {aiAssistError}
              </p>
            )}
            {aiAssistText ? (
              <ScrollArea className="h-[220px] rounded-md border p-3">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {aiAssistText}
                </pre>
              </ScrollArea>
            ) : !aiAssistLoading && !aiAssistError ? (
              <p className="text-sm text-muted-foreground">
                By default, uses application fields and document count only. Turn on the option
                above to add OCR excerpts from uploads.
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes about this application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {application.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('more_info')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Request More Info
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {application.status !== 'pending' && (
              <Button onClick={() => onOpenChange(false)} className="ml-auto">
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
