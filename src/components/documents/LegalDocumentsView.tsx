import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Receipt, IdCard, List } from 'lucide-react';
import { Document } from '@/services/documents';
import { DocumentCard } from './DocumentCard';
import { DocumentsHeader } from './DocumentsHeader';
import { filterDocumentsByType } from '@/services/documents/documentUtils';

interface LegalDocumentsViewProps {
  documents: Document[];
  isLoading: boolean;
  onDownload: (document: Document) => void;
  onDelete?: (id: string) => void;
  showUploadButton?: boolean;
  onUpload?: () => void;
  documentType?: 'lease' | 'receipt' | 'identity' | 'maintenance';
}

export function LegalDocumentsView({
  documents,
  isLoading,
  onDownload,
  onDelete,
  showUploadButton = true,
  onUpload,
  documentType,
}: LegalDocumentsViewProps) {
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);

  useEffect(() => {
    // Documents are already filtered at the parent component level now
    setFilteredDocs(documents);
  }, [documents, documentType]);

  // Get appropriate titles and descriptions based on document type
  const getHeaderContent = () => {
    switch (documentType) {
      case 'lease':
        return {
          title: 'Lease Agreements',
          description: 'Manage your lease agreements and contracts',
        };
      case 'receipt':
        return {
          title: 'Payment Receipts',
          description: 'View and manage payment receipts and financial records',
        };
      case 'identity':
        return {
          title: 'Identity Verification',
          description: 'Manage identity verification documents and tenant records',
        };
      case 'maintenance':
        return {
          title: 'Maintenance Logs',
          description: 'Track maintenance requests and repair documentation',
        };
      default:
        return {
          title: 'Legal Documents',
          description: 'Manage your legal documents and records',
        };
    }
  };

  // Content rendering based on loading state and documents availability
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg border bg-muted/50 p-6 shadow-sm"
            />
          ))}
        </div>
      );
    }

    if (filteredDocs.length === 0) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No {documentType || 'legal'} documents found</p>
            {showUploadButton && onUpload && (
              <button
                onClick={onUpload}
                className="mt-4 text-sm text-primary underline underline-offset-4"
              >
                Upload a {documentType || 'document'}
              </button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDownload={onDownload}
            onDelete={onDelete}
            showDeleteButton={!!onDelete}
            documentType={documentType}
          />
        ))}
      </div>
    );
  };

  const headerContent = getHeaderContent();

  return (
    <div className="space-y-6">
      <DocumentsHeader
        title={headerContent.title}
        description={headerContent.description}
        onUpload={onUpload}
        showUploadButton={showUploadButton}
      />

      {renderContent()}
    </div>
  );
}
