import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

interface DocumentsHeaderProps {
  onUpload?: () => void;
  title?: string;
  description?: string;
  showUploadButton?: boolean;
}

export function DocumentsHeader({
  onUpload,
  title = 'Documents',
  description = 'Manage and organize your property documents',
  showUploadButton = true,
}: DocumentsHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {showUploadButton && onUpload && (
        <Button onClick={onUpload}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      )}
    </div>
  );
}
