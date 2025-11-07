
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface DocumentsHeaderProps {
  onUpload?: () => void;
  title?: string;
  description?: string;
  showUploadButton?: boolean;
}

export function DocumentsHeader({ onUpload, title = "Documents", description = "Manage and organize your property documents", showUploadButton = true }: DocumentsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {description}
        </p>
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
