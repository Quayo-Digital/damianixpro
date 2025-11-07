
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfilePhoto } from './ProfilePhoto';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  image: string;
}

export const PersonalInfoForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '+234 801 234 5678',
    address: 'Lagos, Nigeria',
    image: ''
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: profile.name }
        });
        
        if (error) throw error;
        
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ProfilePhoto 
          name={profile.name} 
          previewImage={previewImage} 
          setPreviewImage={setPreviewImage} 
          setProfileImage={(url) => setProfile({...profile, image: url})} 
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input 
                id="name" 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            ) : (
              <p className="text-muted-foreground">{profile.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            {isEditing ? (
              <Input 
                id="email" 
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                disabled
              />
            ) : (
              <p className="text-muted-foreground">{profile.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input 
                id="phone" 
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            ) : (
              <p className="text-muted-foreground">{profile.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            {isEditing ? (
              <Input 
                id="address" 
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            ) : (
              <p className="text-muted-foreground">{profile.address}</p>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
};
