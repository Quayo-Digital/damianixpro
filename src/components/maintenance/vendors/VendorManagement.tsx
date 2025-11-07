
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorList } from './VendorList';
import { AddVendorDialog } from './AddVendorDialog';
import { Vendor } from './vendor-data';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our Vendor type
      const transformedVendors = data.map((vendor: any): Vendor => ({
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        rating: vendor.rating,
        specialties: vendor.specialties,
        totalJobs: vendor.total_jobs,
        completedJobs: vendor.completed_jobs,
        responseTime: vendor.response_time || 'N/A',
        active: vendor.active
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendor data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVendors();
  }, []);
  
  const handleVendorAdded = async (newVendor: Vendor) => {
    try {
      // Transform the vendor to match database schema
      const vendorData = {
        name: newVendor.name,
        category: newVendor.category,
        email: newVendor.email,
        phone: newVendor.phone,
        address: newVendor.address,
        rating: newVendor.rating,
        total_jobs: newVendor.totalJobs,
        completed_jobs: newVendor.completedJobs,
        response_time: newVendor.responseTime,
        active: newVendor.active,
        specialties: newVendor.specialties
      };
      
      // Insert new vendor into Supabase
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select('*')
        .single();
      
      if (error) {
        throw error;
      }
      
      // Transform the returned data to match our Vendor type
      const addedVendor: Vendor = {
        id: data.id,
        name: data.name,
        category: data.category,
        email: data.email,
        phone: data.phone,
        address: data.address,
        rating: data.rating,
        specialties: data.specialties,
        totalJobs: data.total_jobs,
        completedJobs: data.completed_jobs,
        responseTime: data.response_time || 'N/A',
        active: data.active
      };
      
      // Update state with new vendor
      setVendors([addedVendor, ...vendors]);
      
      toast({
        title: 'Success',
        description: 'Vendor added successfully'
      });
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add vendor',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>
            Manage service providers and track their performance
          </CardDescription>
        </div>
        <AddVendorDialog onVendorAdded={handleVendorAdded} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Vendors</TabsTrigger>
              <TabsTrigger value="plumbing">Plumbing</TabsTrigger>
              <TabsTrigger value="electrical">Electrical</TabsTrigger>
              <TabsTrigger value="hvac">HVAC</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <VendorList categoryFilter="all" vendors={vendors} />
            </TabsContent>
            
            <TabsContent value="plumbing" className="mt-0">
              <VendorList categoryFilter="Plumbing" vendors={vendors} />
            </TabsContent>
            
            <TabsContent value="electrical" className="mt-0">
              <VendorList categoryFilter="Electrical" vendors={vendors} />
            </TabsContent>
            
            <TabsContent value="hvac" className="mt-0">
              <VendorList categoryFilter="HVAC" vendors={vendors} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
