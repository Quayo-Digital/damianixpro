
import { Property } from '@/services/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface PropertyActionCardProps {
  property: Property;
  onApplyClick: () => void;
  onRequestViewingClick: () => void;
  onContactAgentClick: () => void;
}

export const PropertyActionCard = ({ property, onApplyClick, onRequestViewingClick, onContactAgentClick }: PropertyActionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{property.price}</CardTitle>
        <CardDescription>
          {property.type === 'rent' ? 'per month' : 'selling price'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center border-b pb-4">
          <DollarSign className="h-5 w-5 text-primary mr-2" />
          <div>
            <p className="font-medium">Payment Terms</p>
            <p className="text-sm text-muted-foreground">
              {property.type === 'rent' ? 'Monthly rent + deposit' : 'Full payment or mortgage'}
            </p>
          </div>
        </div>
        
        {property.status === 'Available' ? (
          <Button 
            className="w-full" 
            size="lg"
            onClick={onApplyClick}
          >
            Apply to Rent
          </Button>
        ) : (
          <Button className="w-full" size="lg" disabled>
            Not Available
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onRequestViewingClick}
        >
          Request Viewing
        </Button>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="link" className="w-full text-muted-foreground hover:text-primary" onClick={onContactAgentClick}>
          Contact agent for more details
        </Button>
      </CardFooter>
    </Card>
  );
};
