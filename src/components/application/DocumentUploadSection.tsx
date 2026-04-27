import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface DocumentUploadSectionProps {
  uploadedDocs: { id: string; name: string }[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeDocument: (docId: string) => void;
}

const DocumentUploadSection = ({
  uploadedDocs,
  handleFileUpload,
  removeDocument,
}: DocumentUploadSectionProps) => {
  return (
    <div>
      <h3 className="mb-4 text-lg font-medium">Required Documents</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Please upload the following documents to support your application:
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center rounded-md border p-3">
          <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
          <span>Proof of Income</span>
        </div>
        <div className="flex items-center rounded-md border p-3">
          <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
          <span>Proof of Address</span>
        </div>
        <div className="flex items-center rounded-md border p-3">
          <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
          <span>Employment Verification</span>
        </div>
      </div>

      <div className="relative cursor-pointer rounded-lg border-2 border-dashed bg-muted/50 p-6 text-center transition-colors hover:bg-muted/80">
        <input
          type="file"
          multiple
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={handleFileUpload}
        />
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 font-medium">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground">
          Upload all required documents (PDF, JPG, PNG)
        </p>
      </div>

      {uploadedDocs.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Uploaded Documents</p>
          {uploadedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">{doc.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadSection;
