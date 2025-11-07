
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface DocumentUploadSectionProps {
  uploadedDocs: { id: string; name: string }[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeDocument: (docId: string) => void;
}

const DocumentUploadSection = ({ uploadedDocs, handleFileUpload, removeDocument }: DocumentUploadSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Required Documents</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Please upload the following documents to support your application:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center p-3 border rounded-md">
          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
          <span>Valid ID (National ID/Passport)</span>
        </div>
        <div className="flex items-center p-3 border rounded-md">
          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
          <span>Proof of Income</span>
        </div>
        <div className="flex items-center p-3 border rounded-md">
          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
          <span>Proof of Address</span>
        </div>
        <div className="flex items-center p-3 border rounded-md">
          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
          <span>Employment Verification</span>
        </div>
      </div>
      
      <div className="border-dashed border-2 rounded-lg p-6 text-center bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer relative">
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileUpload}
        />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium mb-1">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground">
          Upload all required documents (PDF, JPG, PNG)
        </p>
      </div>
      
      {uploadedDocs.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="font-medium text-sm">Uploaded Documents</p>
          {uploadedDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{doc.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeDocument(doc.id)}
              >
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
