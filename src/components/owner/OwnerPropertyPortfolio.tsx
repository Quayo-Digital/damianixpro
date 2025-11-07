import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Square
} from 'lucide-react';
import { OwnerProperty } from '@/hooks/useEnhancedOwnerData';

interface OwnerPropertyPortfolioProps {
  properties: OwnerProperty[];
  onAddProperty?: (propertyData: Partial<OwnerProperty>) => void;
}

const OwnerPropertyPortfolio: React.FC<OwnerPropertyPortfolioProps> = ({
  properties,
  onAddProperty
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<OwnerProperty | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState<Partial<OwnerProperty>>({});

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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Home className="h-4 w-4 text-gray-600" />;
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 15) return 'text-green-600';
    if (roi >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          is_negotiable: newPropertyData.negotiable === 'yes'
        };

        await onAddProperty(propertyData);
        setNewPropertyData({});
        setIsAddPropertyOpen(false);
      } catch (error) {
        console.error('Error in handleAddProperty:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Portfolio</h2>
          <p className="text-gray-600">Manage and monitor your property investments</p>
        </div>
        
        {onAddProperty && (
          <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Property</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Property Images */}
                <div>
                  <Label>Property Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="property-images"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewPropertyData({...newPropertyData, images: files});
                      }}
                    />
                    <label htmlFor="property-images" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600">Click to upload property images</p>
                        <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB each</p>
                      </div>
                    </label>
                  </div>
                  {newPropertyData.images && newPropertyData.images.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {newPropertyData.images.length} image(s) selected
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Property Title *</Label>
                      <Input
                        id="title"
                        value={newPropertyData.title || ''}
                        onChange={(e) => setNewPropertyData({...newPropertyData, title: e.target.value})}
                        placeholder="Enter property title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Property Type *</Label>
                      <Select value={newPropertyData.type || ''} onValueChange={(value) => setNewPropertyData({...newPropertyData, type: value as any})}>
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
                        onChange={(e) => setNewPropertyData({...newPropertyData, address: e.target.value})}
                        placeholder="Enter full property address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newPropertyData.city || ''}
                        onChange={(e) => setNewPropertyData({...newPropertyData, city: e.target.value})}
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select value={newPropertyData.state || ''} onValueChange={(value) => setNewPropertyData({...newPropertyData, state: value})}>
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
                  <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newPropertyData.type !== 'land' && (
                      <>
                        <div>
                          <Label htmlFor="bedrooms">Bedrooms {newPropertyData.type !== 'commercial' && newPropertyData.type !== 'warehouse' && newPropertyData.type !== 'office' ? '*' : ''}</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            value={newPropertyData.bedrooms || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, bedrooms: parseInt(e.target.value)})}
                            placeholder="3"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bathrooms">Bathrooms {newPropertyData.type !== 'commercial' && newPropertyData.type !== 'warehouse' && newPropertyData.type !== 'office' ? '*' : ''}</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            value={newPropertyData.bathrooms || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, bathrooms: parseInt(e.target.value)})}
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
                        onChange={(e) => setNewPropertyData({...newPropertyData, area_sqm: parseInt(e.target.value)})}
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
                          onChange={(e) => setNewPropertyData({...newPropertyData, parking_spaces: parseInt(e.target.value)})}
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
                          onChange={(e) => setNewPropertyData({...newPropertyData, year_built: parseInt(e.target.value)})}
                          placeholder="2020"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newPropertyData.status || 'available'} onValueChange={(value) => setNewPropertyData({...newPropertyData, status: value})}>
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
                  <h3 className="text-lg font-semibold mb-4">Property Purpose</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="listing_type">Listing Type *</Label>
                      <Select value={newPropertyData.listing_type || ''} onValueChange={(value) => setNewPropertyData({...newPropertyData, listing_type: value})}>
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
                      <Select value={newPropertyData.availability_status || 'available'} onValueChange={(value) => setNewPropertyData({...newPropertyData, availability_status: value})}>
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
                  <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                  
                  {/* Sale Information */}
                  {(newPropertyData.listing_type === 'sale' || newPropertyData.listing_type === 'both') && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-3 text-blue-900">Sale Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sale_price">Sale Price (₦) *</Label>
                          <Input
                            id="sale_price"
                            type="number"
                            value={newPropertyData.sale_price || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, sale_price: parseInt(e.target.value)})}
                            placeholder="50000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negotiable">Price Negotiable</Label>
                          <Select value={newPropertyData.negotiable || 'yes'} onValueChange={(value) => setNewPropertyData({...newPropertyData, negotiable: value})}>
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
                  {(newPropertyData.listing_type === 'rent' || newPropertyData.listing_type === 'both') && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-3 text-green-900">Rental Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="monthly_rent">Monthly Rent (₦) *</Label>
                          <Input
                            id="monthly_rent"
                            type="number"
                            value={newPropertyData.monthly_rent || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, monthly_rent: parseInt(e.target.value)})}
                            placeholder="1500000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="security_deposit">Security Deposit (₦)</Label>
                          <Input
                            id="security_deposit"
                            type="number"
                            value={newPropertyData.security_deposit || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, security_deposit: parseInt(e.target.value)})}
                            placeholder="3000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="service_charge">Service Charge (₦)</Label>
                          <Input
                            id="service_charge"
                            type="number"
                            value={newPropertyData.service_charge || ''}
                            onChange={(e) => setNewPropertyData({...newPropertyData, service_charge: parseInt(e.target.value)})}
                            placeholder="200000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Investment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purchase_price">Original Purchase Price (₦)</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        value={newPropertyData.purchase_price || ''}
                        onChange={(e) => setNewPropertyData({...newPropertyData, purchase_price: parseInt(e.target.value)})}
                        placeholder="45000000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_value">Current Market Value (₦)</Label>
                      <Input
                        id="current_value"
                        type="number"
                        value={newPropertyData.current_value || ''}
                        onChange={(e) => setNewPropertyData({...newPropertyData, current_value: parseInt(e.target.value)})}
                        placeholder="60000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      'Air Conditioning', 'Swimming Pool', 'Gym/Fitness Center', 'Security',
                      'Generator', 'Water Supply', 'Internet/WiFi', 'Parking',
                      'Garden/Landscaping', 'Elevator', 'Balcony/Terrace', 'Furnished'
                    ].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newPropertyData.amenities?.includes(amenity) || false}
                          onChange={(e) => {
                            const amenities = newPropertyData.amenities || [];
                            if (e.target.checked) {
                              setNewPropertyData({...newPropertyData, amenities: [...amenities, amenity]});
                            } else {
                              setNewPropertyData({...newPropertyData, amenities: amenities.filter(a => a !== amenity)});
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
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-vertical"
                    value={newPropertyData.description || ''}
                    onChange={(e) => setNewPropertyData({...newPropertyData, description: e.target.value})}
                    placeholder="Describe the property, its unique features, neighborhood, and any additional information..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProperty} disabled={!newPropertyData.title || !newPropertyData.address}>
                  Add Property
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.status === 'occupied').length}
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
                <p className="text-sm font-medium text-gray-600">Vacant</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => p.status === 'vacant').length}
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
                <p className="text-sm font-medium text-gray-600">Avg ROI</p>
                <p className="text-2xl font-bold text-purple-600">
                  {properties.length > 0 
                    ? (properties.reduce((sum, p) => sum + p.roi_percentage, 0) / properties.length).toFixed(1)
                    : '0.0'}%
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
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {property.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(property.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{property.address}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Bed className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bath className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Square className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{property.area_sqm}m²</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Current Value</p>
                  <p className="font-semibold">{formatCurrency(property.current_value)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly Rent</p>
                  <p className="font-semibold">{formatCurrency(property.monthly_rent)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ROI</span>
                  <span className={`text-sm font-bold ${getROIColor(property.roi_percentage)}`}>
                    {property.roi_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(property.roi_percentage, 25) / 25 * 100} className="h-2" />
              </div>

              {property.status === 'occupied' && (
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">
                    {property.tenant_count} tenant{property.tenant_count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {property.status === 'vacant' && property.days_vacant_ytd > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600">
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
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
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
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more properties.'
                : 'Start by adding your first property to begin building your portfolio.'}
            </p>
            {onAddProperty && (
              <Button onClick={() => setIsAddPropertyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
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
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`${getStatusColor(selectedProperty.status)} mt-1`}>
                    {selectedProperty.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedProperty.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p className="text-sm">{selectedProperty.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">City, State</Label>
                  <p className="text-sm">{selectedProperty.city}, {selectedProperty.state}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Purchase Price</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedProperty.purchase_price)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Value</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedProperty.current_value)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ROI</Label>
                  <p className={`text-sm font-bold ${getROIColor(selectedProperty.roi_percentage)}`}>
                    {selectedProperty.roi_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedProperty(null)}>
                  Close
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Property
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OwnerPropertyPortfolio;
