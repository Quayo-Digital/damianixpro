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
      <TabsContent value="tenants" className="mt-2 rounded-md border p-4">
        <p className="py-8 text-center text-gray-500">No tenants currently assigned.</p>
      </TabsContent>
      <TabsContent value="maintenance" className="mt-2 rounded-md border p-4">
        <p className="py-8 text-center text-gray-500">No maintenance requests.</p>
      </TabsContent>
    </Tabs>
  );
}
