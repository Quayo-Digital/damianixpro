import { useState, useMemo } from 'react';
import { PageContent } from '@/components/layout/PageContent';
import { LegalDocumentsView } from '@/components/documents/LegalDocumentsView';
import { DocumentUploadForm } from '@/components/documents/upload/DocumentUploadForm';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Receipt, IdCard, ClipboardList } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';

export default function DocumentManagement() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('lease');

  const { properties: ownerProperties } = useProperties();

  const {
    documents,
    filteredDocuments,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedProperty,
    setSelectedProperty,
    isLoading,
    error,
    loadDocuments,
    handleUpload,
    handleDelete,
    confirmDelete,
    handleDownload,
  } = useDocumentManagement();

  const properties = useMemo(() => {
    const map = new Map<string, string>();
    ownerProperties.forEach((p) => {
      map.set(p.id, p.name || p.address || 'Property');
    });
    documents.forEach((d) => {
      if (d.property_id && !map.has(d.property_id)) {
        map.set(d.property_id, d.property_name || `Property (${d.property_id.slice(0, 8)}…)`);
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [ownerProperties, documents]);

  const onDeleteClick = async (id: string) => {
    setDocumentToDelete(id);
  };

  const onDeleteConfirm = async () => {
    if (!documentToDelete) return;
    await confirmDelete(documentToDelete);
    setDocumentToDelete(null);
  };

  // Add wrapper function for upload that returns a Promise
  const handleFormUpload = async (formData: FormData): Promise<void> => {
    // Set the category based on the active tab
    const categoryMap = {
      lease: 'Lease Agreement',
      receipts: 'Payment Receipt',
      identity: 'Identity Verification',
      maintenance: 'Maintenance Log',
    };

    // Extract existing form data and create a new FormData with added category
    const category =
      categoryMap[activeTab as keyof typeof categoryMap] ||
      (formData.get('category') as string) ||
      'Document';

    // Create a new FormData object with all the original data plus the category
    const enhancedFormData = new FormData();
    for (const [key, value] of Array.from(formData.entries())) {
      enhancedFormData.append(key, value);
    }

    // Update or set the category
    enhancedFormData.set('category', category);

    // Call the actual upload handler and return the promise
    return handleUpload(enhancedFormData);
  };

  return (
    <PageContent
      title="Document & Legal Management"
      description="Manage legal documents, receipts, verifications, and maintenance logs."
    >
      <Tabs defaultValue="lease" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-4">
          <TabsTrigger value="lease" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Lease Agreements</span>
            <span className="sm:hidden">Leases</span>
          </TabsTrigger>

          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Payment Receipts</span>
            <span className="sm:hidden">Receipts</span>
          </TabsTrigger>

          <TabsTrigger value="identity" className="flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            <span className="hidden sm:inline">Identity Verification</span>
            <span className="sm:hidden">Identity</span>
          </TabsTrigger>

          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance Logs</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lease">
          <LegalDocumentsView
            documents={documents.filter(
              (doc) =>
                doc.category?.toLowerCase().includes('lease') ||
                doc.category?.toLowerCase().includes('contract')
            )}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={onDeleteClick}
            onUpload={() => setIsUploadDialogOpen(true)}
            documentType="lease"
          />
        </TabsContent>

        <TabsContent value="receipts">
          <LegalDocumentsView
            documents={documents.filter(
              (doc) =>
                doc.category?.toLowerCase().includes('receipt') ||
                doc.category?.toLowerCase().includes('payment')
            )}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={onDeleteClick}
            onUpload={() => setIsUploadDialogOpen(true)}
            documentType="receipt"
          />
        </TabsContent>

        <TabsContent value="identity">
          <LegalDocumentsView
            documents={documents.filter(
              (doc) =>
                doc.category?.toLowerCase().includes('identity') ||
                doc.category?.toLowerCase().includes('verification') ||
                doc.category?.toLowerCase().includes('id')
            )}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={onDeleteClick}
            onUpload={() => setIsUploadDialogOpen(true)}
            documentType="identity"
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <LegalDocumentsView
            documents={documents.filter(
              (doc) =>
                doc.category?.toLowerCase().includes('maintenance') ||
                doc.category?.toLowerCase().includes('inspection') ||
                doc.category?.toLowerCase().includes('repair') ||
                doc.category?.toLowerCase().includes('log')
            )}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={onDeleteClick}
            onUpload={() => setIsUploadDialogOpen(true)}
            documentType="maintenance"
          />
        </TabsContent>
      </Tabs>

      <DocumentUploadForm
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleFormUpload}
        properties={properties}
        defaultCategory={
          activeTab === 'lease'
            ? 'Lease Agreement'
            : activeTab === 'receipts'
              ? 'Payment Receipt'
              : activeTab === 'identity'
                ? 'Identity Verification'
                : activeTab === 'maintenance'
                  ? 'Maintenance Log'
                  : undefined
        }
      />

      <DeleteDocumentDialog
        isOpen={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentToDelete(null);
        }}
        onConfirm={onDeleteConfirm}
      />
    </PageContent>
  );
}
