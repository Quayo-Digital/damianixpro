import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { DocumentsHeader } from '@/components/documents/DocumentsHeader';
import { DocumentsContent } from '@/components/documents/DocumentsContent';
import { DocumentUploadForm } from '@/components/documents/upload/DocumentUploadForm';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useProperties } from '@/hooks/useProperties';

export default function Documents() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

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

  // Debug: Show error if document loading fails
  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg rounded bg-red-50 px-6 py-10 text-center shadow">
            <h2 className="mb-2 text-xl font-bold text-red-600">Error Loading Documents</h2>
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
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
