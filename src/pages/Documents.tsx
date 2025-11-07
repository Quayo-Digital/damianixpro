import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { DocumentsHeader } from '@/components/documents/DocumentsHeader';
import { DocumentsContent } from '@/components/documents/DocumentsContent';
import { DocumentUploadForm } from '@/components/documents/upload/DocumentUploadForm';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';

export default function Documents() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Mock properties for the demo
  const properties = [
    { id: '123', name: '123 Main St' },
    { id: '456', name: '456 Oak Avenue' },
    { id: '789', name: '789 Pine Road' },
  ];

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
    handleDownload
  } = useDocumentManagement();

  const onDeleteClick = async (id: string) => {
    setDocumentToDelete(id);
  };

  const onDeleteConfirm = async () => {
    if (!documentToDelete) return;
    await confirmDelete(documentToDelete);
    setDocumentToDelete(null);
  };

  // Debug: Show error if document loading fails
  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-red-50 px-6 py-10 rounded shadow max-w-lg w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Documents</h2>
            <p className="mb-4 text-red-500">{error}</p>
            <Button onClick={loadDocuments}>Try Again</Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="mt-4 text-lg">Loading documents...</h2>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <DocumentsHeader onUpload={() => setIsUploadDialogOpen(true)} />
          
          <DocumentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedProperty={selectedProperty}
            setSelectedProperty={setSelectedProperty}
            properties={properties}
          />

          <DocumentsContent
            isLoading={isLoading}
            error={error}
            documents={documents}
            filteredDocuments={filteredDocuments}
            onRetry={loadDocuments}
            onUpload={() => setIsUploadDialogOpen(true)}
            onDownload={handleDownload}
            onDelete={onDeleteClick}
          />
        </div>
      </div>

      <DocumentUploadForm
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
        properties={properties}
      />

      <DeleteDocumentDialog
        isOpen={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentToDelete(null);
        }}
        onConfirm={onDeleteConfirm}
      />
    </PageLayout>
  );
}
