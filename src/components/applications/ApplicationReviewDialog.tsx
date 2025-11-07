
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RentalApplication, ApplicationDocument } from '@/services/applications/types';
import { updateApplicationStatus, getApplicationDocuments } from '@/services/applications/applicationApi';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { FileText, Download, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  onStatusChange
}: ApplicationReviewDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    if (open && application) {
      setAdminNotes(application.admin_notes || "");
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
        toast.success(`Application ${status}`);
        
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
  
  const getStatusBadge = (status: RentalApplication['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'more_info':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            More Info Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rental Application</span>
            {getStatusBadge(application.status)}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {application.property_name && (
              <p>Property: {application.property_name}</p>
            )}
            <p>Submitted: {new Date(application.created_at || '').toLocaleDateString()}</p>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Applicant Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Admin Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
                <p className="font-medium">{application.first_name} {application.last_name}</p>
                <p className="text-sm">{application.email}</p>
                {application.phone && <p className="text-sm">{application.phone}</p>}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Employment</h3>
                <p className="font-medium">{application.occupation || 'Not specified'}</p>
                {application.monthly_income && (
                  <p className="text-sm">Income: ₦{application.monthly_income.toLocaleString()}/month</p>
                )}
                <p className="text-sm">Status: {application.employment_status || 'Not specified'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Rental Details</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm"><strong>Current Address:</strong></p>
                  <p className="text-sm">{application.current_address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm"><strong>Move-in Date:</strong></p>
                  <p className="text-sm">
                    {application.move_in_date 
                      ? new Date(application.move_in_date).toLocaleDateString() 
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm"><strong>Lease Period:</strong></p>
                  <p className="text-sm">
                    {application.tenancy_period 
                      ? `${application.tenancy_period} months` 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm"><strong>Occupants:</strong></p>
                  <p className="text-sm">
                    {application.num_occupants || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-sm"><strong>Pets:</strong></p>
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
                <div className="grid grid-cols-2 gap-4 mt-2">
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
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDocumentPreview(doc)}
                    >
                      <Download className="w-4 h-4" />
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
          <div className="flex flex-col sm:flex-row gap-2 w-full">
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
              <Button
                onClick={() => onOpenChange(false)}
                className="ml-auto"
              >
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
