/**
 * Tenant Document Camera Component
 * Specialized camera interface for tenant application document scanning
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CreditCard, 
  User, 
  Building, 
  Camera,
  CheckCircle,
  AlertCircle,
  Info,
  Download
} from 'lucide-react';
import CameraButton from '@/components/camera/CameraButton';
import PhotoGallery from '@/components/camera/PhotoGallery';
import { CapturedPhoto } from '@/services/camera/CameraService';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  maxPhotos: number;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'national_id',
    name: 'National ID Card',
    description: 'Nigerian National Identity Card (front and back)',
    icon: CreditCard,
    required: true,
    maxPhotos: 2
  },
  {
    id: 'passport',
    name: 'International Passport',
    description: 'Nigerian International Passport (photo page)',
    icon: User,
    required: false,
    maxPhotos: 1
  },
  {
    id: 'drivers_license',
    name: "Driver's License",
    description: "Nigerian Driver's License (front and back)",
    icon: CreditCard,
    required: false,
    maxPhotos: 2
  },
  {
    id: 'employment_letter',
    name: 'Employment Letter',
    description: 'Official employment verification letter',
    icon: FileText,
    required: true,
    maxPhotos: 3
  },
  {
    id: 'salary_slip',
    name: 'Salary Slip',
    description: 'Recent salary slip or pay stub',
    icon: FileText,
    required: true,
    maxPhotos: 2
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Recent bank statement (last 3 months)',
    icon: Building,
    required: true,
    maxPhotos: 5
  },
  {
    id: 'guarantor_id',
    name: 'Guarantor ID',
    description: "Guarantor's identification document",
    icon: User,
    required: true,
    maxPhotos: 2
  }
];

interface TenantDocumentCameraProps {
  onDocumentsUpdate: (documents: Record<string, CapturedPhoto[]>) => void;
  initialDocuments?: Record<string, CapturedPhoto[]>;
}

export function TenantDocumentCamera({ 
  onDocumentsUpdate, 
  initialDocuments = {} 
}: TenantDocumentCameraProps) {
  const [documents, setDocuments] = useState<Record<string, CapturedPhoto[]>>(initialDocuments);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);

  const handleDocumentPhoto = (documentTypeId: string) => (photo: CapturedPhoto) => {
    const updatedDocuments = {
      ...documents,
      [documentTypeId]: [...(documents[documentTypeId] || []), photo]
    };
    setDocuments(updatedDocuments);
    onDocumentsUpdate(updatedDocuments);
  };

  const handleDocumentPhotos = (documentTypeId: string) => (photos: CapturedPhoto[]) => {
    const updatedDocuments = {
      ...documents,
      [documentTypeId]: [...(documents[documentTypeId] || []), ...photos]
    };
    setDocuments(updatedDocuments);
    onDocumentsUpdate(updatedDocuments);
  };

  const removeDocumentPhoto = (documentTypeId: string) => (photoId: string) => {
    const updatedDocuments = {
      ...documents,
      [documentTypeId]: (documents[documentTypeId] || []).filter(photo => photo.id !== photoId)
    };
    setDocuments(updatedDocuments);
    onDocumentsUpdate(updatedDocuments);
  };

  const getDocumentStatus = (documentType: DocumentType) => {
    const photos = documents[documentType.id] || [];
    const photoCount = photos.length;
    
    if (documentType.required && photoCount === 0) {
      return { status: 'missing', color: 'destructive', text: 'Required' };
    } else if (photoCount === 0) {
      return { status: 'optional', color: 'secondary', text: 'Optional' };
    } else if (photoCount >= documentType.maxPhotos) {
      return { status: 'complete', color: 'default', text: 'Complete' };
    } else {
      return { status: 'partial', color: 'secondary', text: `${photoCount}/${documentType.maxPhotos}` };
    }
  };

  const getTotalProgress = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
    const completedRequired = requiredDocs.filter(doc => (documents[doc.id] || []).length > 0);
    return {
      completed: completedRequired.length,
      total: requiredDocs.length,
      percentage: Math.round((completedRequired.length / requiredDocs.length) * 100)
    };
  };

  const progress = getTotalProgress();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              📱 Document Verification
            </div>
            <Badge variant={progress.percentage === 100 ? 'default' : 'secondary'}>
              {progress.completed}/{progress.total} Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              📱 <strong>Mobile Document Scanning:</strong> Use your camera to scan official documents. 
              Ensure documents are well-lit and all text is clearly visible. Optimized for Nigerian networks.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Application Progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((documentType) => {
          const IconComponent = documentType.icon;
          const status = getDocumentStatus(documentType);
          const photos = documents[documentType.id] || [];
          const canAddMore = photos.length < documentType.maxPhotos;

          return (
            <Card key={documentType.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {documentType.name}
                  </div>
                  <Badge variant={status.color as any}>
                    {status.text}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {documentType.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Camera Buttons */}
                <div className="flex gap-2">
                  <CameraButton
                    variant="document"
                    size="sm"
                    onPhotoCapture={handleDocumentPhoto(documentType.id)}
                    disabled={!canAddMore}
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Scan
                  </CameraButton>
                  
                  {documentType.maxPhotos > 1 && canAddMore && (
                    <CameraButton
                      variant="document"
                      mode="multiple"
                      size="sm"
                      maxPhotos={documentType.maxPhotos - photos.length}
                      onPhotosCapture={handleDocumentPhotos(documentType.id)}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Multiple
                    </CameraButton>
                  )}
                </div>

                {/* Document Photos */}
                {photos.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">
                      Scanned Documents ({photos.length}/{documentType.maxPhotos})
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.dataUrl}
                            alt={`${documentType.name} scan`}
                            className="w-full aspect-[3/2] object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDocumentPhoto(documentType.id)(photo.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                          >
                            ×
                          </Button>
                          <div className="absolute bottom-1 left-1 right-1">
                            <Badge variant="secondary" className="text-xs">
                              {(photo.size / 1024).toFixed(1)}KB
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Tips */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Tips:</strong> Ensure good lighting, avoid shadows, capture all corners, 
                    and keep text clearly readable for faster verification.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Status */}
      {progress.percentage === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">
                  🎉 All Required Documents Scanned!
                </h4>
                <p className="text-sm text-green-700">
                  Your tenant application documents are ready for review. 
                  You can now proceed with your application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nigerian Verification Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          🇳🇬 <strong>Nigerian Document Verification:</strong> All scanned documents will be verified 
          according to Nigerian standards. Ensure your National ID, employment documents, and bank statements 
          are current and clearly legible for faster processing.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default TenantDocumentCamera;
