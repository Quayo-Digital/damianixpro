import { useState, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import CameraButton from '@/components/camera/CameraButton';
import PhotoGallery from '@/components/camera/PhotoGallery';
import { CapturedPhoto } from '@/services/camera/CameraService';
import { Camera, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface PropertyImageUploadProps {
  onImageUploaded: (url: string | null) => void;
  initialImageUrl?: string | null;
}

export function PropertyImageUpload({ onImageUploaded, initialImageUrl }: PropertyImageUploadProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'camera'>('file');
  const { user } = useAuth();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload an image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
      
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
      
      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your property image was uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    if (imageUrl.startsWith('blob:') || imageUrl.includes('placeholder.svg')) {
      setImageUrl(null);
      onImageUploaded(null);
      return;
    }

    setIsUploading(true);
    try {
      const path = new URL(imageUrl).pathname.split('/property-images/')[1];
      if (!path) {
        setImageUrl(null);
        onImageUploaded(null);
        toast({ title: "Image Removed", description: "Image cleared from form." });
        console.warn("Could not determine file path from URL for deletion:", imageUrl);
        return;
      }
      
      const { error } = await supabase.storage
        .from('property-images')
        .remove([path]);
      
      if (error && error.message !== 'The resource was not found') {
        throw error;
      }

      setImageUrl(null);
      onImageUploaded(null);
      toast({
        title: "Image Removed",
        description: "The image has been successfully removed.",
      });

    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Removal Failed",
        description: error.message || "There was a problem removing the image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          {imageUrl ? (
            <div className="relative w-full">
              <img 
                src={imageUrl} 
                alt="Property" 
                className="w-full h-56 object-cover rounded-md mb-4"
              />
              <Button 
                type="button"
                onClick={handleRemoveImage}
                variant="destructive" 
                size="sm"
                className="absolute top-2 right-2"
                disabled={isUploading}
              >
                {isUploading ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          ) : (
            <div className="w-full h-56 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-400 mb-4">
              <p>Upload property image</p>
              <p className="text-xs mt-2">Recommended size: 1200 x 800px</p>
            </div>
          )}
          
          <div className="flex justify-center w-full">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {isUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
