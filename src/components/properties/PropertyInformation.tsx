
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PropertyInformationProps {
  description: string;
  features: string[];
}

export function PropertyInformation({ description, features }: PropertyInformationProps) {
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4">Description</h3>
        <p className="text-gray-700">{description}</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-4">Features</h3>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <Badge key={index} variant="secondary">{feature}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
