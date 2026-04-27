import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { Document } from '@/services/documents';
import { DocumentCard } from './DocumentCard';

interface DocumentsContentProps {
  isLoading: boolean;
  error: string | null;
  documents: Document[];
  filteredDocuments: Document[];
  onRetry: () => void;
  onUpload: () => void;
  onDownload: (document: Document) => void;
  onDelete: (id: string) => void;
}

export function DocumentsContent({
  isLoading,
  error,
  documents,
  filteredDocuments,
  onRetry,
  onUpload,
  onDownload,
  onDelete,
}: DocumentsContentProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg border bg-muted/50 p-6 shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        {error}
        <Button variant="outline" size="sm" className="ml-2" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (filteredDocuments.length > 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background py-12 text-center">
      <h3 className="text-lg font-medium">No documents found</h3>
      {documents.length > 0 ? (
        <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
      ) : (
        <div className="mt-4">
          <p className="mb-4 text-muted-foreground">Upload a document to get started</p>
          <Button onClick={onUpload}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      )}
    </div>
  );
}
