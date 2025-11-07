// VR/AR Tour Management Component
// Comprehensive management interface for creating and editing VR tours

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVRTours } from '@/hooks/useVRTours';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';
import {
  Plus,
  Save,
  Trash2,
  Edit,
  Eye,
  Image,
  Camera,
  Layers,
  MapPin,
  BarChart3,
  Loader2,
  CheckCircle,
  Share2
} from 'lucide-react';
import { VRTour, TourQuality, TourType, RoomType } from '@/types/vrTours';

interface VRTourManagerProps {
  propertyId?: string;
  className?: string;
  onTourCreated?: (tour: VRTour) => void;
  onTourUpdated?: (tour: VRTour) => void;
  onTourDeleted?: (tourId: string) => void;
}

export function VRTourManager({
  propertyId,
  className,
  onTourCreated,
  onTourUpdated,
  onTourDeleted
}: VRTourManagerProps) {
  const {
    tours,
    createTour,
    updateTour,
    deleteTour,
    canCreateTours,
    hasPremiumFeatures,
    hasVRAccess
  } = useVRTours();

  // State
  const [selectedTour, setSelectedTour] = useState<VRTour | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [tourForm, setTourForm] = useState({
    title: '',
    description: '',
    tourType: '360' as TourType,
    quality: 'hd' as TourQuality,
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 500,
    address: '',
    features: [] as string[],
    amenities: [] as string[]
  });

  // Tour operations
  const handleCreateTour = useCallback(async () => {
    try {
      setIsCreating(true);
      
      const tourData: Partial<VRTour> = {
        propertyId: propertyId || '',
        title: tourForm.title,
        description: tourForm.description,
        tourType: tourForm.tourType,
        quality: tourForm.quality,
        metadata: {
          propertyDetails: {
            address: tourForm.address,
            propertyType: tourForm.propertyType,
            bedrooms: tourForm.bedrooms,
            bathrooms: tourForm.bathrooms,
            squareFootage: tourForm.squareFootage,
            yearBuilt: new Date().getFullYear(),
            features: tourForm.features,
            amenities: tourForm.amenities,
            neighborhood: ''
          },
          captureInfo: {
            captureDate: new Date(),
            equipment: 'Unknown',
            photographer: 'Unknown',
            processingDate: new Date(),
            software: 'VR Tour Builder',
            version: '1.0.0',
            notes: ''
          },
          technicalSpecs: {
            totalScenes: 0,
            totalHotspots: 0,
            totalFileSize: 0,
            averageLoadTime: 0,
            supportedDevices: [],
            minSystemRequirements: {
              cpu: 'Intel i5 or equivalent',
              gpu: 'DirectX 11 compatible',
              ram: '8GB',
              storage: '1GB',
              bandwidth: '5 Mbps',
              browser: ['Chrome 80+', 'Firefox 75+', 'Safari 13+'],
              webgl: 'WebGL 2.0'
            },
            maxConcurrentUsers: 100
          },
          seoData: {
            title: tourForm.title,
            description: tourForm.description,
            keywords: [],
            ogImage: '',
            ogTitle: '',
            ogDescription: '',
            structuredData: {}
          },
          tags: [],
          categories: []
        }
      };

      const newTour = await createTour(tourData);
      setSelectedTour(newTour);
      setIsCreating(false);
      
      if (onTourCreated) {
        onTourCreated(newTour);
      }

      // Reset form
      setTourForm({
        title: '',
        description: '',
        tourType: '360',
        quality: 'hd',
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        squareFootage: 500,
        address: '',
        features: [],
        amenities: []
      });
    } catch (error) {
      console.error('Failed to create tour:', error);
      setIsCreating(false);
    }
  }, [tourForm, propertyId, createTour, onTourCreated]);

  const handleUpdateTour = useCallback(async () => {
    if (!selectedTour) return;

    try {
      setIsEditing(true);
      
      const updates: Partial<VRTour> = {
        title: tourForm.title,
        description: tourForm.description,
        tourType: tourForm.tourType,
        quality: tourForm.quality
      };

      const updatedTour = await updateTour(selectedTour.id, updates);
      if (updatedTour) {
        setSelectedTour(updatedTour);
        if (onTourUpdated) {
          onTourUpdated(updatedTour);
        }
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update tour:', error);
      setIsEditing(false);
    }
  }, [selectedTour, tourForm, updateTour, onTourUpdated]);

  const handleDeleteTour = useCallback(async (tourId: string) => {
    try {
      await deleteTour(tourId);
      if (selectedTour?.id === tourId) {
        setSelectedTour(null);
      }
      if (onTourDeleted) {
        onTourDeleted(tourId);
      }
    } catch (error) {
      console.error('Failed to delete tour:', error);
    }
  }, [deleteTour, selectedTour, onTourDeleted]);

  // Load tour data into form when selected
  const loadTourIntoForm = useCallback((tour: VRTour) => {
    setTourForm({
      title: tour.title,
      description: tour.description,
      tourType: tour.tourType,
      quality: tour.quality,
      propertyType: tour.metadata.propertyDetails.propertyType,
      bedrooms: tour.metadata.propertyDetails.bedrooms,
      bathrooms: tour.metadata.propertyDetails.bathrooms,
      squareFootage: tour.metadata.propertyDetails.squareFootage,
      address: tour.metadata.propertyDetails.address,
      features: tour.metadata.propertyDetails.features,
      amenities: tour.metadata.propertyDetails.amenities
    });
  }, []);

  const handleTourSelect = useCallback((tour: VRTour) => {
    setSelectedTour(tour);
    loadTourIntoForm(tour);
  }, [loadTourIntoForm]);

  if (!hasVRAccess) {
    return (
      <FeatureGate 
        feature="vr_tours"
        fallback={
          <Card className={className}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">VR Tour Management</h3>
                <p className="text-muted-foreground">
                  Create and manage immersive virtual reality property tours
                </p>
                <Button>Upgrade to Access VR Tours</Button>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div />
      </FeatureGate>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VR Tour Manager</h2>
          <p className="text-muted-foreground">Create and manage immersive property tours</p>
        </div>
        {canCreateTours && (
          <Button onClick={() => setSelectedTour(null)}>
            <Plus className="h-4 w-4 mr-2" />
            New Tour
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tour List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Tours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tours.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No tours created yet</p>
              </div>
            ) : (
              tours.map(tour => (
                <div
                  key={tour.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedTour?.id === tour.id && "bg-muted border-primary"
                  )}
                  onClick={() => handleTourSelect(tour)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{tour.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{tour.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {tour.tourType.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tour.scenes.length} scenes
                        </Badge>
                        <Badge 
                          variant={tour.status === 'published' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {tour.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTour(tour.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {!selectedTour ? (
            /* Create New Tour */
            <Card>
              <CardHeader>
                <CardTitle>Create New VR Tour</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="property">Property Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tour Title</Label>
                      <Input
                        id="title"
                        value={tourForm.title}
                        onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter tour title..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={tourForm.description}
                        onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your property..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tour Type</Label>
                        <Select
                          value={tourForm.tourType}
                          onValueChange={(value: TourType) => setTourForm(prev => ({ ...prev, tourType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="360">360° Photos</SelectItem>
                            <SelectItem value="vr">VR Experience</SelectItem>
                            <SelectItem value="ar">AR Experience</SelectItem>
                            <SelectItem value="guided">Guided Tour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quality</Label>
                        <Select
                          value={tourForm.quality}
                          onValueChange={(value: TourQuality) => setTourForm(prev => ({ ...prev, quality: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="hd">HD</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                            {hasPremiumFeatures && <SelectItem value="8k">8K (Premium)</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="property" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={tourForm.address}
                        onChange={(e) => setTourForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Property address..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Property Type</Label>
                        <Select
                          value={tourForm.propertyType}
                          onValueChange={(value) => setTourForm(prev => ({ ...prev, propertyType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={tourForm.bedrooms}
                          onChange={(e) => setTourForm(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          value={tourForm.bathrooms}
                          onChange={(e) => setTourForm(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    onClick={handleCreateTour}
                    disabled={!tourForm.title || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tour
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Edit Existing Tour */
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="scenes">Scenes</TabsTrigger>
                <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedTour.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={selectedTour.status === 'published' ? 'default' : 'secondary'}>
                            {selectedTour.status}
                          </Badge>
                          {selectedTour.status === 'published' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Total Views</Label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedTour.analytics.totalViews.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tour Progress</Label>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Scenes: {selectedTour.scenes.length}</span>
                          <span>Hotspots: {selectedTour.hotspots.length}</span>
                        </div>
                        <Progress value={selectedTour.scenes.length > 0 ? 75 : 25} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={tourForm.title}
                          onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={tourForm.description}
                          onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleUpdateTour} disabled={isEditing}>
                          {isEditing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scenes">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Scenes ({selectedTour.scenes.length})</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Scene
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedTour.scenes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No scenes added yet</p>
                        <p className="text-xs">Upload 360° photos or videos to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTour.scenes.map((scene) => (
                          <div key={scene.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{scene.name}</p>
                                <p className="text-sm text-muted-foreground">{scene.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {scene.roomType}
                                  </Badge>
                                  {scene.isEntryPoint && (
                                    <Badge variant="secondary" className="text-xs">
                                      Entry Point
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hotspots">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Hotspots ({selectedTour.hotspots.length})</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Hotspot
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedTour.hotspots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No hotspots added yet</p>
                        <p className="text-xs">Add interactive points to enhance the tour experience</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTour.hotspots.map(hotspot => (
                          <div key={hotspot.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{hotspot.title}</p>
                              <p className="text-sm text-muted-foreground">{hotspot.description}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {hotspot.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Tour Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedTour.analytics.totalViews}</p>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedTour.analytics.uniqueVisitors}</p>
                        <p className="text-sm text-muted-foreground">Unique Visitors</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedTour.analytics.averageViewTime}m</p>
                        <p className="text-sm text-muted-foreground">Avg. View Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedTour.analytics.completionRate}%</p>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
