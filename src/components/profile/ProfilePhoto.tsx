
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePhotoProps {
  name: string;
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  setProfileImage: (url: string) => void;
}

export const ProfilePhoto = ({ 
  name, 
  previewImage, 
  setPreviewImage, 
  setProfileImage 
}: ProfilePhotoProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials for avatar fallback
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return 'U';
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create a preview URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    
    // Update profile state with the new image
    setProfileImage(imageUrl);
    
    // If authenticated, save the avatar URL to the user's profile in Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: imageUrl })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating profile image:', error);
          toast({
            title: "Error saving image",
            description: "There was a problem saving your profile photo.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Unexpected error updating profile:', error);
      }
    }
    
    toast({
      title: "Image uploaded",
      description: "Your profile photo has been updated.",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleDeletePhoto = async () => {
    // Release the object URL to avoid memory leaks
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    
    // Reset the preview image and profile image
    setPreviewImage(null);
    
    // Reset the file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If authenticated, remove the avatar URL from the user's profile in Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error removing profile image:', error);
          toast({
            title: "Error removing image",
            description: "There was a problem removing your profile photo.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Unexpected error updating profile:', error);
      }
    }
    
    toast({
      title: "Photo removed",
      description: "Your profile photo has been removed.",
    });
  };

  // Load the profile image from Supabase when the component mounts
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user && !previewImage) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile image:', error);
            return;
          }
          
          if (data?.avatar_url) {
            setPreviewImage(data.avatar_url);
            setProfileImage(data.avatar_url);
          }
        } catch (error) {
          console.error('Unexpected error fetching profile:', error);
        }
      }
    };
    
    fetchProfileImage();
  }, [user, previewImage, setPreviewImage, setProfileImage]);

  return (
    <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6 mb-6">
      <Avatar className="h-24 w-24">
        {previewImage ? (
          <AvatarImage src={previewImage} alt="Profile" />
        ) : (
          <AvatarFallback className="text-2xl bg-brand-light text-brand-primary">{getInitials()}</AvatarFallback>
        )}
      </Avatar>
      <div className="mt-4 md:mt-0 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerFileInput}
          className="flex items-center gap-2"
        >
          <Camera size={16} />
          Upload Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {previewImage && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeletePhoto}
            className="flex items-center gap-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 size={16} />
            Delete Photo
          </Button>
        )}
      </div>
    </div>
  );
};
