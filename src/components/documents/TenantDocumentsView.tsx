
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center border rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-6 text-center border rounded-lg">
          <p>No documents found. Adjust your filters or try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
