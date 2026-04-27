/**
 * Mobile Camera Demo Page
 * Comprehensive demonstration of camera features for Nigerian real estate platform
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  Home,
  FileText,
  Image as ImageIcon,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import CameraButton from '@/components/camera/CameraButton';
import PhotoGallery from '@/components/camera/PhotoGallery';
import { CapturedPhoto } from '@/services/camera/CameraService';
import { useCamera } from '@/hooks/useCamera';

export function MobileCameraDemoPage() {
  const [propertyPhotos, setPropertyPhotos] = useState<CapturedPhoto[]>([]);
  const [documentPhotos, setDocumentPhotos] = useState<CapturedPhoto[]>([]);
  const [generalPhotos, setGeneralPhotos] = useState<CapturedPhoto[]>([]);

  const { isSupported, capabilities } = useCamera(false);

  const handlePropertyPhoto = (photo: CapturedPhoto) => {
    setPropertyPhotos((prev) => [...prev, photo]);
  };

  const handlePropertyPhotos = (photos: CapturedPhoto[]) => {
    setPropertyPhotos((prev) => [...prev, ...photos]);
  };

  const handleDocumentPhoto = (photo: CapturedPhoto) => {
    setDocumentPhotos((prev) => [...prev, photo]);
  };

  const handleGeneralPhoto = (photo: CapturedPhoto) => {
    setGeneralPhotos((prev) => [...prev, photo]);
  };

  const deletePhoto =
    (photos: CapturedPhoto[], setPhotos: React.Dispatch<React.SetStateAction<CapturedPhoto[]>>) =>
    (photoId: string) => {
      setPhotos(photos.filter((photo) => photo.id !== photoId));
    };

  const clearAllPhotos = () => {
    setPropertyPhotos([]);
    setDocumentPhotos([]);
    setGeneralPhotos([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-full bg-blue-600 p-3">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📱 Mobile Camera Features</h1>
              <p className="text-gray-600">
                Comprehensive camera functionality for Nigerian real estate
              </p>
            </div>
          </div>

          {/* Device Status */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span>Mobile Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4 text-green-600" />
              <span>Network Optimized</span>
            </div>
            <div className="flex items-center gap-1">
              <Signal className="h-4 w-4 text-orange-600" />
              <span>2G/3G/4G Support</span>
            </div>
          </div>
        </div>

        {/* Camera Support Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Camera Support Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className={`mb-2 text-2xl ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                  {isSupported ? '✅' : '❌'}
                </div>
                <p className="font-medium">Camera Access</p>
                <p className="text-sm text-muted-foreground">
                  {isSupported ? 'Available' : 'Not Available'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div
                  className={`mb-2 text-2xl ${capabilities?.hasMultipleCameras ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {capabilities?.hasMultipleCameras ? '📷' : '📱'}
                </div>
                <p className="font-medium">Multiple Cameras</p>
                <p className="text-sm text-muted-foreground">
                  {capabilities?.hasMultipleCameras ? 'Front & Back' : 'Single Camera'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div
                  className={`mb-2 text-2xl ${capabilities?.supportsFlash ? 'text-yellow-600' : 'text-gray-400'}`}
                >
                  {capabilities?.supportsFlash ? '⚡' : '🔦'}
                </div>
                <p className="font-medium">Flash Support</p>
                <p className="text-sm text-muted-foreground">
                  {capabilities?.supportsFlash ? 'Available' : 'Not Available'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="mb-2 text-2xl text-blue-600">🇳🇬</div>
                <p className="font-medium">Nigerian Optimized</p>
                <p className="text-sm text-muted-foreground">Network & Device Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Features Demo */}
        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="property" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Property
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* Property Photos Tab */}
          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Property Photography
                  </div>
                  <Badge variant="secondary">{propertyPhotos.length} photos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    Capture high-quality property photos optimized for Nigerian networks. Perfect
                    for listings, inspections, and documentation.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <CameraButton
                    variant="property"
                    mode="single"
                    size="lg"
                    onPhotoCapture={handlePropertyPhoto}
                  />

                  <CameraButton
                    variant="property"
                    mode="multiple"
                    size="lg"
                    maxPhotos={10}
                    onPhotosCapture={handlePropertyPhotos}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Multiple Photos
                  </CameraButton>
                </div>

                <PhotoGallery
                  photos={propertyPhotos}
                  title="Property Photos"
                  onPhotoDelete={deletePhoto(propertyPhotos, setPropertyPhotos)}
                  maxDisplayPhotos={8}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Document Scanning
                  </div>
                  <Badge variant="secondary">{documentPhotos.length} documents</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Scan important documents like IDs, contracts, certificates, and receipts.
                    Optimized for document clarity and Nigerian network conditions.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <CameraButton
                    variant="document"
                    mode="single"
                    size="lg"
                    onPhotoCapture={handleDocumentPhoto}
                  />
                </div>

                <PhotoGallery
                  photos={documentPhotos}
                  title="Scanned Documents"
                  onPhotoDelete={deletePhoto(documentPhotos, setDocumentPhotos)}
                  maxDisplayPhotos={6}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Photos Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                    General Photography
                  </div>
                  <Badge variant="secondary">{generalPhotos.length} photos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <ImageIcon className="h-4 w-4" />
                  <AlertDescription>
                    General purpose camera for any photography needs. Includes location data and
                    optimized compression.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <CameraButton
                    variant="general"
                    mode="single"
                    size="lg"
                    onPhotoCapture={handleGeneralPhoto}
                  />
                </div>

                <PhotoGallery
                  photos={generalPhotos}
                  title="General Photos"
                  onPhotoDelete={deletePhoto(generalPhotos, setGeneralPhotos)}
                  maxDisplayPhotos={6}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Camera Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Camera Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>High-quality photo capture</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Front/back camera switching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Flash/torch control</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple resolution options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time camera preview</span>
                  </div>
                </CardContent>
              </Card>

              {/* Nigerian Optimizations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🇳🇬 Nigerian Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Signal className="h-4 w-4 text-orange-600" />
                    <span>2G/3G/4G network optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Battery className="h-4 w-4 text-green-600" />
                    <span>Battery-efficient processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Location data capture</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Smart compression for slow networks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Offline photo storage</span>
                  </div>
                </CardContent>
              </Card>

              {/* Photo Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Photo gallery with metadata</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Download and share options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Automatic file naming</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Size and quality optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Timestamp and location tracking</span>
                  </div>
                </CardContent>
              </Card>

              {/* Use Cases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Real Estate Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span>Property listing photos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span>Document scanning (IDs, contracts)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Maintenance issue reporting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Property inspection records</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span>Location-based property photos</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold">Total Photos Captured</h3>
                <p className="text-muted-foreground">
                  Property: {propertyPhotos.length} • Documents: {documentPhotos.length} • General:{' '}
                  {generalPhotos.length}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearAllPhotos}
                  disabled={
                    propertyPhotos.length + documentPhotos.length + generalPhotos.length === 0
                  }
                >
                  Clear All Photos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigerian Network Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            📱 <strong>Nigerian Network Optimization:</strong> All camera features are optimized for
            2G/3G/4G networks with smart compression, adaptive quality, and offline storage
            capabilities. Perfect for Nigerian mobile users!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export default MobileCameraDemoPage;
