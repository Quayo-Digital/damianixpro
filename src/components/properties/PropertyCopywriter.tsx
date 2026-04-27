import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PropertyDetails {
  propertyType: string;
  location: string;
  amenities: string[];
  targetTenant: string;
  bedrooms?: string;
  bathrooms?: string;
  price?: string;
}

export function PropertyCopywriter() {
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [targetTenant, setTargetTenant] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState({
    short: '',
    professional: '',
    whatsapp: '',
  });
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const propertyTypes = [
    'Self-Contained',
    '1 Bedroom Flat',
    '2 Bedroom Flat',
    '3 Bedroom Flat',
    '4 Bedroom Flat',
    '5 Bedroom Duplex',
    'Bungalow',
    'Semi-Detached',
    'Detached House',
    'Studio Apartment',
    'Penthouse',
    'Commercial Space',
    'Shop',
    'Office Space',
    'Warehouse',
  ];

  const amenities = [
    '24/7 Security',
    'Parking Space',
    'Generator',
    'Water Supply',
    'Fitted Kitchen',
    'Air Conditioning',
    'Swimming Pool',
    'Gym',
    'Elevator',
    'WiFi',
    'Cable TV',
    'Garden',
    'Playground',
    'Rooftop',
    'Concierge',
    'CCTV',
    'Intercom',
    'Borehole',
    'Inverter',
    'Solar Power',
  ];

  const targetTenants = [
    'Family',
    'Student',
    'Corporate',
    'Young Professional',
    'Couple',
    'Retiree',
    'Expatriate',
  ];

  const nigerianLocations = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Ibadan',
    'Kano',
    'Enugu',
    'Abeokuta',
    'Calabar',
    'Uyo',
    'Warri',
    'Asaba',
    'Owerri',
    'Kaduna',
    'Jos',
    'Benin City',
  ];

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const generateShortDescription = (details: PropertyDetails): string => {
    const { propertyType, location, amenities, targetTenant, bedrooms, bathrooms, price } = details;

    let description = `Beautiful ${propertyType}`;

    if (bedrooms) {
      description += `, ${bedrooms} bedroom${bedrooms !== '1' ? 's' : ''}`;
    }
    if (bathrooms) {
      description += `, ${bathrooms} bathroom${bathrooms !== '1' ? 's' : ''}`;
    }

    description += ` available in ${location}.`;

    if (amenities.length > 0) {
      const topAmenities = amenities.slice(0, 3);
      description += ` Features include ${topAmenities.join(', ')}.`;
    }

    if (price) {
      description += ` Rent: ₦${parseInt(price).toLocaleString()}/year.`;
    }

    description += ` Perfect for ${targetTenant.toLowerCase()}s.`;

    return description;
  };

  const generateProfessionalDescription = (details: PropertyDetails): string => {
    const { propertyType, location, amenities, targetTenant, bedrooms, bathrooms, price } = details;

    let description = `**${propertyType} Available for Rent in ${location}**\n\n`;

    description += `We present to you this well-maintained ${propertyType.toLowerCase()}`;

    if (bedrooms && bathrooms) {
      description += ` featuring ${bedrooms} spacious bedroom${bedrooms !== '1' ? 's' : ''} and ${bathrooms} modern bathroom${bathrooms !== '1' ? 's' : ''}.`;
    }

    description += ` Located in the heart of ${location}, this property offers convenience and comfort.`;

    if (amenities.length > 0) {
      description += `\n\n**Amenities & Features:**\n`;
      amenities.forEach((amenity, index) => {
        description += `• ${amenity}\n`;
      });
    }

    description += `\n**Ideal For:** ${targetTenant}s\n`;

    if (price) {
      description += `\n**Rent:** ₦${parseInt(price).toLocaleString()} per year (annual)\n`;
    }

    description += `\nThis property is move-in ready and offers excellent value for money. Contact us today to schedule a viewing!`;

    return description;
  };

  const generateWhatsAppDescription = (details: PropertyDetails): string => {
    const { propertyType, location, amenities, targetTenant, bedrooms, bathrooms, price } = details;

    let description = `🏠 *${propertyType} Available in ${location}*\n\n`;

    if (bedrooms && bathrooms) {
      description += `📐 ${bedrooms} Bedroom${bedrooms !== '1' ? 's' : ''} | ${bathrooms} Bathroom${bathrooms !== '1' ? 's' : ''}\n\n`;
    }

    if (amenities.length > 0) {
      description += `✨ *Features:*\n`;
      const displayAmenities = amenities.slice(0, 5);
      displayAmenities.forEach((amenity) => {
        description += `✓ ${amenity}\n`;
      });
      if (amenities.length > 5) {
        description += `+ ${amenities.length - 5} more\n`;
      }
      description += `\n`;
    }

    description += `👥 *Perfect for:* ${targetTenant}s\n\n`;

    if (price) {
      description += `💰 *Rent:* ₦${parseInt(price).toLocaleString()}/year\n\n`;
    }

    description += `📍 *Location:* ${location}\n\n`;
    description += `📞 *Interested?* Contact us for viewing!`;

    // Ensure it's under 500 characters
    if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }

    return description;
  };

  const handleGenerate = () => {
    if (!propertyType || !location || !targetTenant) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in Property Type, Location, and Target Tenant',
        variant: 'destructive',
      });
      return;
    }

    const details: PropertyDetails = {
      propertyType,
      location,
      amenities: selectedAmenities,
      targetTenant,
      bedrooms,
      bathrooms,
      price,
    };

    const short = generateShortDescription(details);
    const professional = generateProfessionalDescription(details);
    const whatsapp = generateWhatsAppDescription(details);

    setGeneratedCopy({ short, professional, whatsapp });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: 'Copied!',
      description: `${type} description copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Property Copywriter
          </CardTitle>
          <CardDescription>
            Generate professional property descriptions for listings, marketing, and WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Details Form */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select or type location" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!nigerianLocations.includes(location) && location && (
                <Input
                  className="mt-2"
                  placeholder="Or enter custom location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger id="bedrooms">
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5', '6+'].map((num) => (
                    <SelectItem key={num} value={num}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Select value={bathrooms} onValueChange={setBathrooms}>
                <SelectTrigger id="bathrooms">
                  <SelectValue placeholder="Select bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5+'].map((num) => (
                    <SelectItem key={num} value={num}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetTenant">Target Tenant *</Label>
              <Select value={targetTenant} onValueChange={setTargetTenant}>
                <SelectTrigger id="targetTenant">
                  <SelectValue placeholder="Who is this for?" />
                </SelectTrigger>
                <SelectContent>
                  {targetTenants.map((tenant) => (
                    <SelectItem key={tenant} value={tenant}>
                      {tenant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Annual Rent (₦)</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 500000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label>Amenities & Features</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant={selectedAmenities.includes(amenity) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Descriptions
          </Button>
        </CardContent>
      </Card>

      {/* Generated Copy */}
      {generatedCopy.short && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Descriptions</CardTitle>
            <CardDescription>Copy and use these descriptions for your listings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="short" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="short">Short</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>

              <TabsContent value="short" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedCopy.short}
                    readOnly
                    className="min-h-[120px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedCopy.short, 'Short')}
                  >
                    {copied === 'Short' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Perfect for social media posts, quick listings, and property cards
                </p>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedCopy.professional}
                    readOnly
                    className="min-h-[300px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedCopy.professional, 'Professional')}
                  >
                    {copied === 'Professional' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Use for detailed listings, property websites, and formal marketing materials
                </p>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedCopy.whatsapp}
                    readOnly
                    className="min-h-[200px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedCopy.whatsapp, 'WhatsApp')}
                  >
                    {copied === 'WhatsApp' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Optimized for WhatsApp sharing ({generatedCopy.whatsapp.length} characters)
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
