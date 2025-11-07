
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

export function PropertyTabs() {
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="tenants" className="mt-6">
      <TabsList className={`${isMobile ? 'w-full' : 'grid grid-cols-2'}`}>
        <TabsTrigger value="tenants">Tenants</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>
      <TabsContent value="tenants" className="p-4 border rounded-md mt-2">
        <p className="text-gray-500 text-center py-8">No tenants currently assigned.</p>
      </TabsContent>
      <TabsContent value="maintenance" className="p-4 border rounded-md mt-2">
        <p className="text-gray-500 text-center py-8">No maintenance requests.</p>
      </TabsContent>
    </Tabs>
  );
}
