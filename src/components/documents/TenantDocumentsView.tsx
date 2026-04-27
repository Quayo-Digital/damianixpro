import { useState } from 'react';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { DocumentsHeader } from '@/components/documents/DocumentsHeader';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { Skeleton } from '@/components/ui/skeleton';

export function TenantDocumentsView() {
  const {
    filteredDocuments,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    handleDownload,
    handleDelete,
    confirmDelete,
  } = useDocumentManagement();

  const onDelete = async (id: string) => {
    await handleDelete(id);
    // Returning void to satisfy the TS return type
    return;
  };

  const onConfirmDelete = async (id: string) => {
    await confirmDelete(id);
    // Returning void to satisfy the TS return type
    return;
  };

  return (
    <div className="space-y-6">
      <DocumentsHeader
        title="Tenant Documents"
        description="View and download documents related to your tenancy"
        showUploadButton={false}
      />

      <DocumentFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showPropertyFilter={false}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-4 h-6 w-3/4" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p>No documents found. Adjust your filters or try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onDownload={() => handleDownload(document)}
              onDelete={onDelete}
              confirmDelete={onConfirmDelete}
              showDeleteButton={false}
              isTenantView={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
