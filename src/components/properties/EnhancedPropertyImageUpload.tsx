/**
 * Enhanced Property Image Upload with Camera Integration
 * Combines file upload and mobile camera capture for property photos
 */

import { useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import CameraButton from '@/components/camera/CameraButton';
import PhotoGallery from '@/components/camera/PhotoGallery';
import { CapturedPhoto } from '@/services/camera/CameraService';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  FileImage,
  Smartphone,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react';

interface EnhancedPropertyImageUploadProps {
  onImageUploaded: (url: string | null) => void;
  onMultipleImagesUploaded?: (urls: string[]) => void;
  initialImageUrl?: string | null;
  allowMultiple?: boolean;
  maxImages?: number;
  title?: string;
}

export function EnhancedPropertyImageUpload({ 
  onImageUploaded, 
  onMultipleImagesUploaded,
  initialImageUrl,
  allowMultiple = false,
  maxImages = 10,
  title = "Property Images"
}: EnhancedPropertyImageUploadProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrl ? [initialImageUrl] : []);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'camera'>('camera');
  const { user } = useAuth();

  // Handle file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload images.",
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = allowMultiple ? Array.from(files) : [files[0]];
    
    // Validate file sizes (10MB max for Nigerian networks)
    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} must be less than 10MB for Nigerian networks`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of filesToProcess) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/property_${uuidv4()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);
        
        const publicUrl = publicUrlData.publicUrl;
        uploadedUrls.push(publicUrl);

        // Small delay for Nigerian networks
        if (filesToProcess.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (allowMultiple) {
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        onMultipleImagesUploaded?.(uploadedUrls);
      } else {
        setImageUrl(uploadedUrls[0]);
        onImageUploaded(uploadedUrls[0]);
      }
      
      toast({
        title: "Images uploaded",
        description: `${uploadedUrls.length} property image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your images.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle camera photo capture
  const handleCameraPhoto = async (photo: CapturedPhoto) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload photos.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert blob to file for upload
      const file = new File([photo.blob], photo.filename, { type: photo.blob.type });
      
      const fileExt = photo.metadata.format;
      const fileName = `${user.id}/camera_${photo.id}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);
      
      const publicUrl = publicUrlData.publicUrl;
      
      if (allowMultiple) {
        setImageUrls(prev => [...prev, publicUrl]);
        onMultipleImagesUploaded?.([publicUrl]);
      } else {
        setImageUrl(publicUrl);
        onImageUploaded(publicUrl);
      }
      
      setCapturedPhotos(prev => [...prev, photo]);
      
      toast({
        title: "Photo uploaded",
        description: `Property photo captured and uploaded (${(photo.size / 1024).toFixed(1)}KB)`,
      });
    } catch (error: any) {
      console.error('Error uploading camera photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle multiple camera photos
  const handleCameraPhotos = async (photos: CapturedPhoto[]) => {
    if (!allowMultiple) {
      // For single mode, just use the first photo
      if (photos.length > 0) {
        await handleCameraPhoto(photos[0]);
      }
      return;
    }

    for (const photo of photos) {
      await handleCameraPhoto(photo);
      // Small delay between uploads for Nigerian networks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Remove image
  const handleRemoveImage = async (urlToRemove?: string) => {
    const targetUrl = urlToRemove || imageUrl;
    if (!targetUrl) return;

    setIsUploading(true);
    try {
      if (!targetUrl.startsWith('blob:') && !targetUrl.includes('placeholder.svg')) {
        const path = new URL(targetUrl).pathname.split('/property-images/')[1];
        if (path) {
          const { error } = await supabase.storage
            .from('property-images')
            .remove([path]);
          
          if (error && error.message !== 'The resource was not found') {
            console.warn('Error removing image:', error);
          }
        }
      }

      if (allowMultiple) {
        setImageUrls(prev => prev.filter(url => url !== targetUrl));
      } else {
        setImageUrl(null);
        onImageUploaded(null);
      }
      
      toast({
        title: "Image Removed",
        description: "Property image removed successfully.",
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove failed",
        description: "There was a problem removing the image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove captured photo
  const removeCapturedPhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const totalImages = allowMultiple ? imageUrls.length : (imageUrl ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </div>
          {totalImages > 0 && (
            <Badge variant="secondary">
              {totalImages} image{totalImages !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Method Tabs */}
        <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'camera')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              📱 Camera
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                📱 Capture high-quality property photos directly with your mobile camera. 
                Optimized for Nigerian networks with smart compression.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-4">
              {!allowMultiple ? (
                <CameraButton
                  variant="property"
                  size="lg"
                  onPhotoCapture={handleCameraPhoto}
                  disabled={isUploading}
                />
              ) : (
                <>
                  <CameraButton
                    variant="property"
                    mode="single"
                    size="md"
                    onPhotoCapture={handleCameraPhoto}
                    disabled={isUploading || totalImages >= maxImages}
                  />
                  
                  <CameraButton
                    variant="property"
                    mode="multiple"
                    size="md"
                    maxPhotos={Math.max(1, maxImages - totalImages)}
                    onPhotosCapture={handleCameraPhotos}
                    disabled={isUploading || totalImages >= maxImages}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Multiple Photos
                  </CameraButton>
                </>
              )}
            </div>

            {/* Captured Photos Gallery */}
            {capturedPhotos.length > 0 && (
              <PhotoGallery
                photos={capturedPhotos}
                title="Recently Captured"
                onPhotoDelete={removeCapturedPhoto}
                maxDisplayPhotos={4}
                showMetadata={false}
              />
            )}
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="file" className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Upload property images from your device. Maximum 10MB per file for optimal Nigerian network performance.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center w-full">
              <label htmlFor="property-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 mb-4 text-gray-500 animate-spin" />
                      <p className="mb-2 text-sm text-gray-500">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> property images
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  id="property-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple={allowMultiple}
                  onChange={handleFileChange}
                  disabled={isUploading || (allowMultiple && totalImages >= maxImages)}
                />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Images Display */}
        {allowMultiple && imageUrls.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Images</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Property image ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveImage(url)}
                    disabled={isUploading}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!allowMultiple && imageUrl && (
          <div className="space-y-3">
            <h4 className="font-medium">Current Image</h4>
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Property"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage()}
                disabled={isUploading}
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Nigerian Network Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            🇳🇬 <strong>Nigerian Network Optimized:</strong> Images are automatically compressed 
            for 2G/3G/4G networks while maintaining quality. Camera photos include location data for property mapping.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default EnhancedPropertyImageUpload;
