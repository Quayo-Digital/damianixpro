/**
 * Property Inspection Camera Component
 * Comprehensive camera interface for agent property inspections and documentation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Home,
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Share2,
  FileText,
  Zap,
  Droplets,
  Wrench,
  Shield,
  Thermometer,
} from 'lucide-react';
import CameraButton from '@/components/camera/CameraButton';
import PhotoGallery from '@/components/camera/PhotoGallery';
import { CapturedPhoto } from '@/services/camera/CameraService';

export interface InspectionCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  items: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxPhotos: number;
}

const INSPECTION_CATEGORIES: InspectionCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior',
    description: 'Building exterior, landscaping, and surroundings',
    icon: Home,
    color: 'blue',
    items: [
      {
        id: 'front_view',
        name: 'Front View',
        description: 'Main building facade',
        required: true,
        maxPhotos: 3,
      },
      {
        id: 'back_view',
        name: 'Back View',
        description: 'Rear of the building',
        required: true,
        maxPhotos: 2,
      },
      {
        id: 'side_views',
        name: 'Side Views',
        description: 'Left and right sides',
        required: true,
        maxPhotos: 4,
      },
      {
        id: 'roof',
        name: 'Roof Condition',
        description: 'Roof and gutters',
        required: true,
        maxPhotos: 3,
      },
      {
        id: 'landscaping',
        name: 'Landscaping',
        description: 'Garden and outdoor areas',
        required: false,
        maxPhotos: 3,
      },
      {
        id: 'parking',
        name: 'Parking Area',
        description: 'Parking spaces and driveways',
        required: false,
        maxPhotos: 2,
      },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    description: 'Rooms, layout, and interior features',
    icon: Home,
    color: 'green',
    items: [
      {
        id: 'living_room',
        name: 'Living Room',
        description: 'Main living area',
        required: true,
        maxPhotos: 4,
      },
      {
        id: 'bedrooms',
        name: 'Bedrooms',
        description: 'All bedroom spaces',
        required: true,
        maxPhotos: 8,
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        description: 'Kitchen and appliances',
        required: true,
        maxPhotos: 5,
      },
      {
        id: 'bathrooms',
        name: 'Bathrooms',
        description: 'All bathroom facilities',
        required: true,
        maxPhotos: 6,
      },
      {
        id: 'dining_area',
        name: 'Dining Area',
        description: 'Dining room or area',
        required: false,
        maxPhotos: 2,
      },
      {
        id: 'storage',
        name: 'Storage Areas',
        description: 'Closets and storage spaces',
        required: false,
        maxPhotos: 3,
      },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Electrical, plumbing, and mechanical systems',
    icon: Zap,
    color: 'orange',
    items: [
      {
        id: 'electrical_panel',
        name: 'Electrical Panel',
        description: 'Main electrical distribution',
        required: true,
        maxPhotos: 2,
      },
      {
        id: 'water_heater',
        name: 'Water Heater',
        description: 'Water heating system',
        required: true,
        maxPhotos: 2,
      },
      {
        id: 'plumbing',
        name: 'Plumbing',
        description: 'Visible pipes and fixtures',
        required: true,
        maxPhotos: 4,
      },
      {
        id: 'hvac',
        name: 'HVAC System',
        description: 'Heating and cooling equipment',
        required: false,
        maxPhotos: 3,
      },
      {
        id: 'generator',
        name: 'Generator',
        description: 'Backup power system',
        required: false,
        maxPhotos: 2,
      },
    ],
  },
  {
    id: 'issues',
    name: 'Issues',
    description: 'Defects, damages, and maintenance needs',
    icon: AlertCircle,
    color: 'red',
    items: [
      {
        id: 'structural_issues',
        name: 'Structural Issues',
        description: 'Cracks, foundation problems',
        required: false,
        maxPhotos: 5,
      },
      {
        id: 'water_damage',
        name: 'Water Damage',
        description: 'Leaks, stains, moisture',
        required: false,
        maxPhotos: 5,
      },
      {
        id: 'electrical_issues',
        name: 'Electrical Issues',
        description: 'Faulty wiring, outlets',
        required: false,
        maxPhotos: 3,
      },
      {
        id: 'plumbing_issues',
        name: 'Plumbing Issues',
        description: 'Leaks, blockages',
        required: false,
        maxPhotos: 3,
      },
      {
        id: 'cosmetic_issues',
        name: 'Cosmetic Issues',
        description: 'Paint, flooring, fixtures',
        required: false,
        maxPhotos: 5,
      },
    ],
  },
];

interface PropertyInspectionCameraProps {
  propertyId?: string;
  propertyAddress?: string;
  onInspectionUpdate: (inspection: Record<string, Record<string, CapturedPhoto[]>>) => void;
  onInspectionComplete?: (inspection: Record<string, Record<string, CapturedPhoto[]>>) => void;
  initialInspection?: Record<string, Record<string, CapturedPhoto[]>>;
}

export function PropertyInspectionCamera({
  propertyId,
  propertyAddress,
  onInspectionUpdate,
  onInspectionComplete,
  initialInspection = {},
}: PropertyInspectionCameraProps) {
  const [inspection, setInspection] =
    useState<Record<string, Record<string, CapturedPhoto[]>>>(initialInspection);
  const [activeCategory, setActiveCategory] = useState<string>('exterior');

  const handleItemPhoto = (categoryId: string, itemId: string) => (photo: CapturedPhoto) => {
    const updatedInspection = {
      ...inspection,
      [categoryId]: {
        ...inspection[categoryId],
        [itemId]: [...(inspection[categoryId]?.[itemId] || []), photo],
      },
    };
    setInspection(updatedInspection);
    onInspectionUpdate(updatedInspection);
  };

  const handleItemPhotos = (categoryId: string, itemId: string) => (photos: CapturedPhoto[]) => {
    const updatedInspection = {
      ...inspection,
      [categoryId]: {
        ...inspection[categoryId],
        [itemId]: [...(inspection[categoryId]?.[itemId] || []), ...photos],
      },
    };
    setInspection(updatedInspection);
    onInspectionUpdate(updatedInspection);
  };

  const removeItemPhoto = (categoryId: string, itemId: string) => (photoId: string) => {
    const updatedInspection = {
      ...inspection,
      [categoryId]: {
        ...inspection[categoryId],
        [itemId]: (inspection[categoryId]?.[itemId] || []).filter((photo) => photo.id !== photoId),
      },
    };
    setInspection(updatedInspection);
    onInspectionUpdate(updatedInspection);
  };

  const getItemStatus = (categoryId: string, item: InspectionItem) => {
    const photos = inspection[categoryId]?.[item.id] || [];
    const photoCount = photos.length;

    if (item.required && photoCount === 0) {
      return { status: 'missing', color: 'destructive', text: 'Required' };
    } else if (photoCount === 0) {
      return { status: 'optional', color: 'secondary', text: 'Optional' };
    } else if (photoCount >= item.maxPhotos) {
      return { status: 'complete', color: 'default', text: 'Complete' };
    } else {
      return { status: 'partial', color: 'secondary', text: `${photoCount}/${item.maxPhotos}` };
    }
  };

  const getCategoryProgress = (category: InspectionCategory) => {
    const requiredItems = category.items.filter((item) => item.required);
    const completedRequired = requiredItems.filter(
      (item) => (inspection[category.id]?.[item.id] || []).length > 0
    );
    return {
      completed: completedRequired.length,
      total: requiredItems.length,
      percentage:
        requiredItems.length > 0
          ? Math.round((completedRequired.length / requiredItems.length) * 100)
          : 100,
    };
  };

  const getTotalProgress = () => {
    const allRequired = INSPECTION_CATEGORIES.flatMap((cat) =>
      cat.items
        .filter((item) => item.required)
        .map((item) => ({ categoryId: cat.id, itemId: item.id }))
    );
    const completedRequired = allRequired.filter(
      ({ categoryId, itemId }) => (inspection[categoryId]?.[itemId] || []).length > 0
    );
    return {
      completed: completedRequired.length,
      total: allRequired.length,
      percentage:
        allRequired.length > 0
          ? Math.round((completedRequired.length / allRequired.length) * 100)
          : 100,
    };
  };

  const handleCompleteInspection = () => {
    onInspectionComplete?.(inspection);
  };

  const totalProgress = getTotalProgress();
  const totalPhotos = Object.values(inspection).reduce(
    (total, category) =>
      total + Object.values(category).reduce((catTotal, photos) => catTotal + photos.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Inspection Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-600" />
              🏠 Property Inspection
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{totalPhotos} photos</Badge>
              <Badge variant={totalProgress.percentage === 100 ? 'default' : 'secondary'}>
                {totalProgress.completed}/{totalProgress.total} Required
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {propertyAddress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {propertyAddress}
            </div>
          )}

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              📱 <strong>Professional Property Documentation:</strong> Capture comprehensive photos
              for property listings, inspections, and records. Location data is automatically
              included for each photo.
            </AlertDescription>
          </Alert>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Inspection Progress</span>
              <span>{totalProgress.percentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${totalProgress.percentage}%` }}
              />
            </div>
          </div>

          {totalProgress.percentage === 100 && (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Inspection Complete!</span>
              </div>
              <Button
                onClick={handleCompleteInspection}
                className="bg-green-600 hover:bg-green-700"
              >
                Finalize Inspection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspection Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {INSPECTION_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const progress = getCategoryProgress(category);

            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex h-auto flex-col items-center gap-1 py-3"
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs">{category.name}</span>
                <Badge variant="outline" className="text-xs">
                  {progress.completed}/{progress.total}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {INSPECTION_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {category.items.map((item) => {
                const status = getItemStatus(category.id, item);
                const photos = inspection[category.id]?.[item.id] || [];
                const canAddMore = photos.length < item.maxPhotos;

                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{item.name}</span>
                        <Badge variant={status.color as any}>{status.text}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Camera Buttons */}
                      <div className="flex gap-2">
                        <CameraButton
                          variant="property"
                          size="sm"
                          onPhotoCapture={handleItemPhoto(category.id, item.id)}
                          disabled={!canAddMore}
                        >
                          <Camera className="mr-1 h-3 w-3" />
                          Capture
                        </CameraButton>

                        {item.maxPhotos > 1 && canAddMore && (
                          <CameraButton
                            variant="property"
                            mode="multiple"
                            size="sm"
                            maxPhotos={item.maxPhotos - photos.length}
                            onPhotosCapture={handleItemPhotos(category.id, item.id)}
                          >
                            <Camera className="mr-1 h-3 w-3" />
                            Multiple
                          </CameraButton>
                        )}
                      </div>

                      {/* Item Photos */}
                      {photos.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">
                            Photos ({photos.length}/{item.maxPhotos})
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {photos.map((photo) => (
                              <div key={photo.id} className="group relative">
                                <img
                                  src={photo.dataUrl}
                                  alt={`${item.name} photo`}
                                  className="aspect-square w-full rounded border object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeItemPhoto(category.id, item.id)(photo.id)}
                                  className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  ×
                                </Button>
                                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {(photo.size / 1024).toFixed(1)}KB
                                  </Badge>
                                  {photo.location && (
                                    <Badge variant="outline" className="text-xs">
                                      <MapPin className="mr-1 h-2 w-2" />
                                      GPS
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Nigerian Real Estate Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          🇳🇬 <strong>Nigerian Property Standards:</strong> This inspection follows Nigerian real
          estate documentation standards. All photos include GPS coordinates and timestamps for
          property records and legal documentation.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default PropertyInspectionCamera;
