import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Calendar,
  Settings,
  Camera,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface VendorProfile {
  id: string;
  user_id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  description: string;
  hourly_rate: number;
  experience_years: number;
  certifications: string[];
  professional_references: string;
  availability_hours: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  service_areas: string[];
  is_available: boolean;
  profile_image_url?: string;
  business_license?: string;
  insurance_info?: string;
}

interface VendorProfileManagementProps {
  profile: VendorProfile;
  onUpdateProfile: (updates: Partial<VendorProfile>) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  isLoading?: boolean;
}

const VENDOR_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Landscaping',
  'Security',
  'General Maintenance',
  'Appliance Repair',
];

const NIGERIAN_STATES = [
  'Lagos',
  'Abuja FCT',
  'Kano',
  'Rivers',
  'Kaduna',
  'Oyo',
  'Delta',
  'Edo',
  'Anambra',
  'Imo',
  'Plateau',
  'Cross River',
  'Akwa Ibom',
  'Ondo',
  'Osun',
  'Ogun',
  'Kwara',
  'Benue',
  'Enugu',
  'Abia',
  'Bauchi',
  'Borno',
  'Taraba',
  'Kebbi',
  'Adamawa',
  'Gombe',
  'Yobe',
  'Sokoto',
  'Zamfara',
  'Katsina',
  'Jigawa',
  'Kogi',
  'Nasarawa',
  'Niger',
  'Ekiti',
  'Ebonyi',
  'Bayelsa',
];

export const VendorProfileManagement: React.FC<VendorProfileManagementProps> = ({
  profile,
  onUpdateProfile,
  onUploadImage,
  isLoading = false,
}) => {
  const [editingProfile, setEditingProfile] = useState<Partial<VendorProfile>>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveProfile = async () => {
    try {
      setSaveStatus('saving');
      await onUpdateProfile(editingProfile);
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await onUploadImage(file);
      setEditingProfile((prev) => ({ ...prev, profile_image_url: imageUrl }));
      await onUpdateProfile({ profile_image_url: imageUrl });
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateAvailability = (day: string, field: string, value: any) => {
    setEditingProfile((prev) => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [day]: {
          ...prev.availability_hours?.[day as keyof typeof prev.availability_hours],
          [field]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
          <CardDescription>Loading profile information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-200"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Management
              </CardTitle>
              <CardDescription>
                Manage your business profile and availability settings
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Error</span>
                </div>
              )}
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Save className="mr-1 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700">
                      <Camera className="h-3 w-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <Badge variant="secondary">{profile.category}</Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingProfile.is_available ?? profile.is_available}
                      onCheckedChange={(checked) =>
                        setEditingProfile((prev) => ({ ...prev, is_available: checked }))
                      }
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(editingProfile.is_available ?? profile.is_available)
                        ? 'Available for jobs'
                        : 'Not available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={editingProfile.name ?? profile.name}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingProfile.category ?? profile.category}
                    onValueChange={(value) =>
                      setEditingProfile((prev) => ({ ...prev, category: value }))
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingProfile.email ?? profile.email}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingProfile.phone ?? profile.phone}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={editingProfile.description ?? profile.description}
                  onChange={(e) =>
                    setEditingProfile((prev) => ({ ...prev, description: e.target.value }))
                  }
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Describe your services, experience, and what makes you unique..."
                />
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (₦)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={editingProfile.hourly_rate ?? profile.hourly_rate}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({
                        ...prev,
                        hourly_rate: parseFloat(e.target.value),
                      }))
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current rate: {formatCurrency(profile.hourly_rate)}/hour
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={editingProfile.experience_years ?? profile.experience_years}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({
                        ...prev,
                        experience_years: parseInt(e.target.value),
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={editingProfile.city ?? profile.city}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, city: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={editingProfile.state ?? profile.state}
                    onValueChange={(value) =>
                      setEditingProfile((prev) => ({ ...prev, state: value }))
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={editingProfile.address ?? profile.address}
                  onChange={(e) =>
                    setEditingProfile((prev) => ({ ...prev, address: e.target.value }))
                  }
                  disabled={!isEditing}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional_references">Professional References</Label>
                <Textarea
                  id="professional_references"
                  value={editingProfile.professional_references ?? profile.professional_references}
                  onChange={(e) =>
                    setEditingProfile((prev) => ({
                      ...prev,
                      professional_references: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  rows={3}
                  placeholder="List previous clients, employers, or professional references..."
                />
              </div>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Weekly Availability</h3>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    Set your working hours
                  </Badge>
                </div>

                <div className="space-y-4">
                  {Object.entries(profile.availability_hours || {}).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="w-24">
                        <Label className="font-medium capitalize">{day}</Label>
                      </div>

                      <Switch
                        checked={
                          editingProfile.availability_hours?.[
                            day as keyof typeof editingProfile.availability_hours
                          ]?.available ?? hours.available
                        }
                        onCheckedChange={(checked) => updateAvailability(day, 'available', checked)}
                        disabled={!isEditing}
                      />

                      {(editingProfile.availability_hours?.[
                        day as keyof typeof editingProfile.availability_hours
                      ]?.available ??
                        hours.available) && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={
                              editingProfile.availability_hours?.[
                                day as keyof typeof editingProfile.availability_hours
                              ]?.start ?? hours.start
                            }
                            onChange={(e) => updateAvailability(day, 'start', e.target.value)}
                            disabled={!isEditing}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={
                              editingProfile.availability_hours?.[
                                day as keyof typeof editingProfile.availability_hours
                              ]?.end ?? hours.end
                            }
                            onChange={(e) => updateAvailability(day, 'end', e.target.value)}
                            disabled={!isEditing}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="font-medium">Job Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new job assignments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="font-medium">Email Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get weekly performance reports via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="font-medium">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">Urgent job updates via SMS</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_license">Business License Number</Label>
                  <Input
                    id="business_license"
                    value={editingProfile.business_license ?? profile.business_license ?? ''}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, business_license: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="Enter your business license number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_info">Insurance Information</Label>
                  <Textarea
                    id="insurance_info"
                    value={editingProfile.insurance_info ?? profile.insurance_info ?? ''}
                    onChange={(e) =>
                      setEditingProfile((prev) => ({ ...prev, insurance_info: e.target.value }))
                    }
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Insurance provider, policy number, coverage details..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
