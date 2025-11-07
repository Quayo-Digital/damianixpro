// Document Upload Component with Drag & Drop

import React, { useState, useCallback, useRef } from 'react';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Image,
  FileIcon
} from 'lucide-react';
import { DocumentType } from '@/types/documentProcessing';

interface DocumentUploadProps {
  propertyId?: string;
  onUploadComplete?: (documentIds: string[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  documentType?: DocumentType;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export function DocumentUpload({
  propertyId,
  onUploadComplete,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  maxFiles = 10,
  maxFileSize = 10
}: DocumentUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadDocument } = useDocumentProcessing({
    userId: user?.id,
    propertyId
  });

  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported`;
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: FileWithPreview[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }

      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: generateFileId(),
        preview: await createFilePreview(file),
        uploadStatus: 'pending' as const,
        uploadProgress: 0
      });

      validFiles.push(fileWithPreview);
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [files.length, maxFiles, maxFileSize, acceptedTypes]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const updateFileType = useCallback((fileId: string, documentType: DocumentType) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, documentType } : f
    ));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);

  const uploadFiles = useCallback(async () => {
    if (!user?.id || files.length === 0) return;

    setIsUploading(true);
    const uploadedIds: string[] = [];

    try {
      for (const file of files) {
        if (file.uploadStatus === 'completed') continue;

        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
            : f
        ));

        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setFiles(prev => prev.map(f => 
              f.id === file.id && f.uploadProgress !== undefined
                ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 90) }
                : f
            ));
          }, 200);

          await uploadDocument({
            file,
            userId: user.id,
            propertyId,
            documentType: file.documentType
          });

          clearInterval(progressInterval);

          // Mark as completed
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, uploadStatus: 'completed', uploadProgress: 100 }
              : f
          ));

          uploadedIds.push(file.id);
        } catch (error) {
          // Mark as error
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  uploadStatus: 'error', 
                  errorMessage: error instanceof Error ? error.message : 'Upload failed'
                }
              : f
          ));
        }
      }

      onUploadComplete?.(uploadedIds);
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, files, propertyId, uploadDocument, onUploadComplete]);

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop files or click to select. Supported formats: {acceptedTypes.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 mb-4">
              Maximum {maxFiles} files, up to {maxFileSize}MB each
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{file.name}</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(file.size / 1024)} KB
                    </p>

                    {/* Document Type Selection */}
                    <div className="mt-2">
                      <Select
                        value={file.documentType || ''}
                        onValueChange={(value) => updateFileType(file.id, value as DocumentType)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                          <SelectItem value="tenant_application">Tenant Application</SelectItem>
                          <SelectItem value="id_card">ID Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="bank_statement">Bank Statement</SelectItem>
                          <SelectItem value="pay_slip">Pay Slip</SelectItem>
                          <SelectItem value="utility_bill">Utility Bill</SelectItem>
                          <SelectItem value="property_deed">Property Deed</SelectItem>
                          <SelectItem value="insurance_document">Insurance Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Upload Progress */}
                    {file.uploadStatus === 'uploading' && file.uploadProgress !== undefined && (
                      <div className="mt-2">
                        <Progress value={file.uploadProgress} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">
                          Uploading... {file.uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.uploadStatus === 'error' && file.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">{file.errorMessage}</p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.uploadStatus || 'pending')}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(file.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {files.filter(f => f.uploadStatus === 'completed').length} of {files.length} files uploaded
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || files.length === 0 || files.every(f => f.uploadStatus === 'completed')}
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
