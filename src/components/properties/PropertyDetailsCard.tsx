
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PropertyDetailsCardProps {
  status: string;
  rent: string;
  size: string;
  bedrooms: number;
  bathrooms: number;
  units: number;
  occupancyRate: number;
}

export function PropertyDetailsCard({
  status,
  rent,
  size,
  bedrooms,
  bathrooms,
  units,
  occupancyRate,
}: PropertyDetailsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Details</h3>
          <Badge className="bg-brand-light text-brand-primary">
            {status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Rent</span>
            <span className="font-medium">{rent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span className="font-medium">{size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bedrooms</span>
            <span className="font-medium">{bedrooms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bathrooms</span>
            <span className="font-medium">{bathrooms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Units</span>
            <span className="font-medium">{units}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Occupancy</span>
            <span className="font-medium">{occupancyRate}%</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button className="w-full mb-2">Manage Property</Button>
          <Button variant="outline" className="w-full">Contact</Button>
        </div>
      </CardContent>
    </Card>
  );
}
