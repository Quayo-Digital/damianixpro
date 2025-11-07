
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tenant } from '@/services/messages/types';

interface TenantListProps {
  tenants: Tenant[];
  selectedTenant: string;
  setSelectedTenant: (id: string) => void;
  isLoading?: boolean;
}

export const TenantList = ({ tenants, selectedTenant, setSelectedTenant, isLoading }: TenantListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTenants = searchQuery.trim() 
    ? tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.property.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tenants;
  
  return (
    <div className="w-1/3">
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tenants..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-2 overflow-y-auto h-[540px] pr-2">
        {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </Card>
            ))
        ) : filteredTenants.length > 0 ? (
          filteredTenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className={`cursor-pointer hover:bg-muted transition-colors ${selectedTenant === tenant.id ? 'border-brand-primary' : ''}`}
              onClick={() => setSelectedTenant(tenant.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-brand-light text-brand-primary">
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{tenant.property}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tenants found</p>
          </div>
        )}
      </div>
    </div>
  );
};
