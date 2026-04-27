import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Bed,
  Bath,
  Square,
} from 'lucide-react';
import { OwnerProperty } from '@/hooks/useEnhancedOwnerData';
import { EditPropertyDialog } from '@/components/properties/EditPropertyDialog';
import { Property } from '@/services/property/types';
import { getPropertyById } from '@/services/property/api/queries';
import { useToast } from '@/hooks/use-toast';
import { PropertyImageUpload } from '@/components/properties/PropertyImageUpload';

interface OwnerPropertyPortfolioProps {
  properties: OwnerProperty[];
  onAddProperty?: (propertyData: Partial<OwnerProperty>) => void;
  onPropertyUpdated?: () => void;
}

const OwnerPropertyPortfolio: React.FC<OwnerPropertyPortfolioProps> = ({
  properties,
  onAddProperty,
  onPropertyUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<OwnerProperty | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState<Partial<OwnerProperty>>({});
  const [propertyImageUrl, setPropertyImageUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'marketing':
        return 'bg-blue-100 text-blue-800';
      case 'sold':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'vacant':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'marketing':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'sold':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Home className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 15) return 'text-green-600';
    if (roi >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEditProperty = async (property: OwnerProperty) => {
    setIsLoadingProperty(true);
    try {
      // Fetch the full property data from database
      const fullProperty = await getPropertyById(property.id);
      if (fullProperty) {
        setPropertyToEdit(fullProperty);
        setIsEditDialogOpen(true);
      } else {
        toast({
          title: 'Error',
          description: 'Property not found. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching property for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load property details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const handlePropertyUpdated = () => {
    setIsEditDialogOpen(false);
    setPropertyToEdit(null);
    if (onPropertyUpdated) {
      onPropertyUpdated();
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddProperty = async () => {
    if (newPropertyData.title && newPropertyData.address && onAddProperty) {
      try {
        // Map form data to database schema - fix 'name' column requirement
        const propertyData = {
          name: newPropertyData.title, // Map title to name column (required)
          title: newPropertyData.title,
          address: newPropertyData.address,
          city: newPropertyData.city,
          state: newPropertyData.state,
          property_type: newPropertyData.type,
          bedrooms: newPropertyData.bedrooms || null,
          bathrooms: newPropertyData.bathrooms || null,
          area_sqm: newPropertyData.area_sqm || null,
          parking_spaces: newPropertyData.parking_spaces || null,
          year_built: newPropertyData.year_built || null,
          security_deposit: newPropertyData.security_deposit || null,
          service_charge: newPropertyData.service_charge || null,
          amenities: newPropertyData.amenities || [],
          // Price fields
          price: newPropertyData.monthly_rent || newPropertyData.sale_price || null,
          monthly_rent: newPropertyData.monthly_rent || null,
          sale_price: newPropertyData.sale_price || null,
          lease_price: newPropertyData.monthly_rent || null,
          // Additional fields
          description: newPropertyData.description || null,
          status: newPropertyData.status || 'available',
          location: newPropertyData.city || newPropertyData.state || null,
          transaction_type: newPropertyData.listing_type === 'sale' ? 'SALE' : 'LEASE',
          is_negotiable: newPropertyData.negotiable === 'yes',
          // Image URL
          imageUrl: propertyImageUrl || null,
        };

        await onAddProperty(propertyData);
        setNewPropertyData({});
        setPropertyImageUrl(null);
        setIsAddPropertyOpen(false);
      } catch (error) {
        console.error('Error in handleAddProperty:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Property Portfolio</h2>
          <p className="text-muted-foreground">Manage and monitor your property investments</p>
        </div>

        {onAddProperty && (
          <Dialog
            open={isAddPropertyOpen}
            onOpenChange={(open) => {
              setIsAddPropertyOpen(open);
              if (!open) {
                // Reset form when dialog closes
                setNewPropertyData({});
                setPropertyImageUrl(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Property</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[95vh] max-w-6xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Property Image Upload */}
                <div>
                  <PropertyImageUpload
                    onImageUploaded={(url) => {
                      setPropertyImageUrl(url);
                      setNewPropertyData({ ...newPropertyData, imageUrl: url || undefined });
                    }}
                    initialImageUrl={propertyImageUrl}
                  />
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="title">Property Title *</Label>
                      <Input
                        id="title"
                        value={newPropertyData.title || ''}
                        onChange={(e) =>
                          setNewPropertyData({ ...newPropertyData, title: e.target.value })
                        }
                        placeholder="Enter property title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Property Type *</Label>
                      <Select
                        value={newPropertyData.type || ''}
                        onValueChange={(value) =>
                          setNewPropertyData({ ...newPropertyData, type: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="bungalow">Bungalow</SelectItem>
                          <SelectItem value="mansion">Mansion</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="office">Office Space</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={newPropertyData.address || ''}
                        onChange={(e) =>
                          setNewPropertyData({ ...newPropertyData, address: e.target.value })
                        }
                        placeholder="Enter full property address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newPropertyData.city || ''}
                        onChange={(e) =>
                          setNewPropertyData({ ...newPropertyData, city: e.target.value })
                        }
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={newPropertyData.state || ''}
                        onValueChange={(value) =>
                          setNewPropertyData({ ...newPropertyData, state: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lagos">Lagos</SelectItem>
                          <SelectItem value="Abuja">Abuja (FCT)</SelectItem>
                          <SelectItem value="Rivers">Rivers (Port Harcourt)</SelectItem>
                          <SelectItem value="Kano">Kano</SelectItem>
                          <SelectItem value="Oyo">Oyo (Ibadan)</SelectItem>
                          <SelectItem value="Kaduna">Kaduna</SelectItem>
                          <SelectItem value="Plateau">Plateau (Jos)</SelectItem>
                          <SelectItem value="Edo">Edo (Benin City)</SelectItem>
                          <SelectItem value="Enugu">Enugu</SelectItem>
                          <SelectItem value="Cross River">Cross River (Calabar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Property Details</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {newPropertyData.type !== 'land' && (
                      <>
                        <div>
                          <Label htmlFor="bedrooms">
                            Bedrooms{' '}
                            {newPropertyData.type !== 'commercial' &&
                            newPropertyData.type !== 'warehouse' &&
                            newPropertyData.type !== 'office'
                              ? '*'
                              : ''}
                          </Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            value={newPropertyData.bedrooms || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                bedrooms: parseInt(e.target.value),
                              })
                            }
                            placeholder="3"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bathrooms">
                            Bathrooms{' '}
                            {newPropertyData.type !== 'commercial' &&
                            newPropertyData.type !== 'warehouse' &&
                            newPropertyData.type !== 'office'
                              ? '*'
                              : ''}
                          </Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            value={newPropertyData.bathrooms || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                bathrooms: parseInt(e.target.value),
                              })
                            }
                            placeholder="2"
                            min="0"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="area_sqm">
                        {newPropertyData.type === 'land' ? 'Land Area (sqm) *' : 'Area (sqm)'}
                      </Label>
                      <Input
                        id="area_sqm"
                        type="number"
                        value={newPropertyData.area_sqm || ''}
                        onChange={(e) =>
                          setNewPropertyData({
                            ...newPropertyData,
                            area_sqm: parseInt(e.target.value),
                          })
                        }
                        placeholder={newPropertyData.type === 'land' ? '1000' : '150'}
                      />
                    </div>
                    {newPropertyData.type !== 'land' && (
                      <div>
                        <Label htmlFor="parking_spaces">Parking Spaces</Label>
                        <Input
                          id="parking_spaces"
                          type="number"
                          value={newPropertyData.parking_spaces || ''}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              parking_spaces: parseInt(e.target.value),
                            })
                          }
                          placeholder="2"
                          min="0"
                        />
                      </div>
                    )}
                    {newPropertyData.type !== 'land' && (
                      <div>
                        <Label htmlFor="year_built">Year Built</Label>
                        <Input
                          id="year_built"
                          type="number"
                          value={newPropertyData.year_built || ''}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              year_built: parseInt(e.target.value),
                            })
                          }
                          placeholder="2020"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newPropertyData.status || 'available'}
                        onValueChange={(value) =>
                          setNewPropertyData({ ...newPropertyData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Property Purpose */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Property Purpose</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="listing_type">Listing Type *</Label>
                      <Select
                        value={newPropertyData.listing_type || ''}
                        onValueChange={(value) =>
                          setNewPropertyData({ ...newPropertyData, listing_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select listing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                          <SelectItem value="both">For Rent & Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="availability_status">Availability</Label>
                      <Select
                        value={newPropertyData.availability_status || 'available'}
                        onValueChange={(value) =>
                          setNewPropertyData({ ...newPropertyData, availability_status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Financial Information</h3>

                  {/* Sale Information */}
                  {(newPropertyData.listing_type === 'sale' ||
                    newPropertyData.listing_type === 'both') && (
                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                      <h4 className="mb-3 font-medium text-blue-900">Sale Information</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="sale_price">Sale Price (₦) *</Label>
                          <Input
                            id="sale_price"
                            type="number"
                            value={newPropertyData.sale_price || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                sale_price: parseInt(e.target.value),
                              })
                            }
                            placeholder="50000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negotiable">Price Negotiable</Label>
                          <Select
                            value={newPropertyData.negotiable || 'yes'}
                            onValueChange={(value) =>
                              setNewPropertyData({ ...newPropertyData, negotiable: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rental Information */}
                  {(newPropertyData.listing_type === 'rent' ||
                    newPropertyData.listing_type === 'both') && (
                    <div className="mb-6 rounded-lg bg-green-50 p-4">
                      <h4 className="mb-3 font-medium text-green-900">Rental Information</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label htmlFor="monthly_rent">Annual Rent (₦) *</Label>
                          <Input
                            id="monthly_rent"
                            type="number"
                            value={newPropertyData.monthly_rent || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                monthly_rent: parseInt(e.target.value),
                              })
                            }
                            placeholder="1500000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="security_deposit">Security Deposit (₦)</Label>
                          <Input
                            id="security_deposit"
                            type="number"
                            value={newPropertyData.security_deposit || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                security_deposit: parseInt(e.target.value),
                              })
                            }
                            placeholder="3000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="service_charge">Service Charge (₦)</Label>
                          <Input
                            id="service_charge"
                            type="number"
                            value={newPropertyData.service_charge || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                service_charge: parseInt(e.target.value),
                              })
                            }
                            placeholder="200000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Investment Information - Only for Sale properties */}
                  {(newPropertyData.listing_type === 'sale' ||
                    newPropertyData.listing_type === 'both') && (
                    <div className="mb-6 rounded-lg bg-purple-50 p-4">
                      <h4 className="mb-3 font-medium text-purple-900">Investment Information</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="purchase_price">Original Purchase Price (₦)</Label>
                          <Input
                            id="purchase_price"
                            type="number"
                            value={newPropertyData.purchase_price || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                purchase_price: parseInt(e.target.value),
                              })
                            }
                            placeholder="45000000"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            The price you originally paid for this property. Used for ROI
                            calculations.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="current_value">Current Market Value (₦)</Label>
                          <Input
                            id="current_value"
                            type="number"
                            value={newPropertyData.current_value || ''}
                            onChange={(e) =>
                              setNewPropertyData({
                                ...newPropertyData,
                                current_value: parseInt(e.target.value),
                              })
                            }
                            placeholder="60000000"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            The current appraised market value. Shows property appreciation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Amenities</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      'Air Conditioning',
                      'Swimming Pool',
                      'Gym/Fitness Center',
                      'Security',
                      'Generator',
                      'Water Supply',
                      'Internet/WiFi',
                      'Parking',
                      'Garden/Landscaping',
                      'Elevator',
                      'Balcony/Terrace',
                      'Furnished',
                    ].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newPropertyData.amenities?.includes(amenity) || false}
                          onChange={(e) => {
                            const amenities = newPropertyData.amenities || [];
                            if (e.target.checked) {
                              setNewPropertyData({
                                ...newPropertyData,
                                amenities: [...amenities, amenity],
                              });
                            } else {
                              setNewPropertyData({
                                ...newPropertyData,
                                amenities: amenities.filter((a) => a !== amenity),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Property Description</Label>
                  <textarea
                    id="description"
                    className="resize-vertical min-h-[120px] w-full rounded-md border border-border p-3"
                    value={newPropertyData.description || ''}
                    onChange={(e) =>
                      setNewPropertyData({ ...newPropertyData, description: e.target.value })
                    }
                    placeholder="Describe the property, its unique features, neighborhood, and any additional information..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProperty}
                  disabled={!newPropertyData.title || !newPropertyData.address}
                >
                  Add Property
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold text-foreground">{properties.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter((p) => p.status === 'occupied').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vacant</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {properties.filter((p) => p.status === 'vacant').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg ROI</p>
                <p className="text-2xl font-bold text-purple-600">
                  {properties.length > 0
                    ? (
                        properties.reduce((sum, p) => sum + p.roi_percentage, 0) / properties.length
                      ).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search properties by title, address, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="mt-1 flex items-center space-x-2">
                    <Badge className={getStatusColor(property.status)}>
                      {(property.display_status || property.status).toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{property.type.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1">{getStatusIcon(property.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{property.address}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{property.area_sqm}m²</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Value</p>
                  <p className="font-semibold">{formatCurrency(property.current_value)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Annual Rent</p>
                  <p className="font-semibold">{formatCurrency(property.annual_rent || 0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <span className={`text-sm font-bold ${getROIColor(property.roi_percentage)}`}>
                    {property.roi_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(Math.min(property.roi_percentage, 25) / 25) * 100}
                  className="h-2"
                />
              </div>

              {property.status === 'occupied' && (
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    {property.tenant_count} tenant{property.tenant_count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {property.status === 'vacant' && property.days_vacant_ytd > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">
                    Vacant for {property.days_vacant_ytd} days
                  </span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProperty(property)}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditProperty(property)}
                  disabled={isLoadingProperty}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No properties found</h3>
            <p className="mb-4 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more properties.'
                : 'Start by adding your first property to begin building your portfolio.'}
            </p>
            {onAddProperty && (
              <Button onClick={() => setIsAddPropertyOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>{selectedProperty.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={`${getStatusColor(selectedProperty.status)} mt-1`}>
                    {(selectedProperty.display_status || selectedProperty.status).toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedProperty.type.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm">{selectedProperty.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">City, State</Label>
                  <p className="text-sm">
                    {selectedProperty.city}, {selectedProperty.state}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Purchase Price
                  </Label>
                  <p className="text-sm font-bold">
                    {formatCurrency(selectedProperty.purchase_price)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Value</Label>
                  <p className="text-sm font-bold">
                    {formatCurrency(selectedProperty.current_value)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ROI</Label>
                  <p
                    className={`text-sm font-bold ${getROIColor(selectedProperty.roi_percentage)}`}
                  >
                    {selectedProperty.roi_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedProperty(null)}>
                  Close
                </Button>
                <Button onClick={() => handleEditProperty(selectedProperty)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Property
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Property Dialog */}
      {propertyToEdit && (
        <EditPropertyDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setPropertyToEdit(null);
            }
          }}
          property={propertyToEdit}
          onPropertyUpdated={handlePropertyUpdated}
        />
      )}
    </div>
  );
};

export default OwnerPropertyPortfolio;
