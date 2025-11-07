
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const vendorFormSchema = z.object({
  name: z.string().min(1, { message: "Vendor name is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  address: z.string().min(3, { message: "Address is required" }),
  specialties: z.array(z.string()).min(1, { message: "At least one specialty is required" }),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface AddVendorDialogProps {
  onVendorAdded?: (vendor: any) => void;
}

export function AddVendorDialog({ onVendorAdded }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      category: "",
      email: "",
      phone: "",
      address: "",
      specialties: [],
    },
  });
  
  const specialties = form.watch("specialties") || [];
  
  const addSpecialty = () => {
    if (specialtyInput && !specialties.includes(specialtyInput)) {
      form.setValue("specialties", [...specialties, specialtyInput]);
      setSpecialtyInput('');
    }
  };
  
  const removeSpecialty = (specialty: string) => {
    form.setValue(
      "specialties", 
      specialties.filter(s => s !== specialty)
    );
  };
  
  const onSubmit = (data: VendorFormValues) => {
    // In a real app, this would send data to an API
    console.log('Form submitted:', data);
    
    const newVendor = {
      ...data,
      id: `v${Date.now()}`,
      rating: 0,
      totalJobs: 0,
      completedJobs: 0,
      responseTime: "N/A",
      active: true,
    };
    
    if (onVendorAdded) {
      onVendorAdded(newVendor);
    }
    
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Plumbing, Electrical" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vendor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 800 000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter vendor address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialties</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add specialty"
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="py-1 px-2">
                        {specialty}
                        <button 
                          type="button" 
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {specialties.length === 0 && (
                    <FormDescription>
                      Add specialties like "Emergency repairs", "Installations", etc.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Vendor</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
