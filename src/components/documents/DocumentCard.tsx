import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Document, formatFileSize } from '@/services/documents';
import { Download, Eye, FileText, Image, FileSpreadsheet, File, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DocumentCardProps {
  document: Document;
  onDownload: (document: Document) => void;
  onDelete: (id: string) => void;
  confirmDelete?: (id: string) => Promise<void>;
  showDeleteButton?: boolean;
  isTenantView?: boolean;
  documentType?: 'lease' | 'receipt' | 'identity' | 'maintenance' | string;
}

export function DocumentCard({
  document,
  onDownload,
  onDelete,
  confirmDelete,
  showDeleteButton = true,
  isTenantView = false,
  documentType,
}: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const renderIcon = () => {
    const iconSize = 'h-5 w-5 mr-2 text-brand-primary';

    if (document.file_type.includes('pdf')) {
      return <FileText className={iconSize} />;
    } else if (document.file_type.includes('image')) {
      return <Image className={iconSize} />;
    } else if (document.file_type.includes('sheet') || document.file_type.includes('excel')) {
      return <FileSpreadsheet className={iconSize} />;
    } else if (document.file_type.includes('document') || document.file_type.includes('word')) {
      return <FileText className={iconSize} />;
    }

    return <File className={iconSize} />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {renderIcon()}
            <div className="truncate">{document.name}</div>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>{document.category}</span>
            {document.property_name && (
              <Badge variant="outline" className="ml-2">
                {document.property_name}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {document.description && (
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {document.description}
            </p>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Upload Date:</span>
            <span>{document.upload_date}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Size:</span>
            <span>{formatFileSize(document.file_size)}</span>
          </div>
          {document.tags && document.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDownload(document)}
          >
            <Download className="mr-1 h-4 w-4" /> Download
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          {showDeleteButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="flex h-[85vh] flex-col sm:max-w-4xl">
          <div className="flex-1 overflow-hidden rounded-lg">
            {document.file_type.includes('pdf') ? (
              <iframe
                src={document.file_path}
                className="h-full w-full rounded-lg border-0"
                title={`Preview of ${document.name}`}
                onError={() => {
                  console.error('Failed to load PDF preview');
                }}
              />
            ) : document.file_type.includes('image') ? (
              <div className="flex h-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                <img
                  src={document.file_path}
                  alt={document.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load image preview');
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<p class="text-muted-foreground">Failed to load image preview</p>';
                    }
                  }}
                />
              </div>
            ) : document.file_type.includes('text') || document.file_type.includes('document') ? (
              <div className="h-full rounded-lg bg-muted p-4">
                <div className="mb-4 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-12 w-12" />
                  <p>Document preview not available</p>
                  <p className="text-sm">Click download to view the full document</p>
                </div>
                <Button
                  onClick={() => {
                    onDownload(document);
                    setShowPreview(false);
                  }}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {document.name}
                </Button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg bg-muted p-4">
                <File className="mb-4 h-16 w-16 text-muted-foreground" />
                <p className="mb-4 text-center text-muted-foreground">
                  Preview not available for {document.file_type.split('/')[1]} files
                </p>
                <Button
                  onClick={() => {
                    onDownload(document);
                    setShowPreview(false);
                  }}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
