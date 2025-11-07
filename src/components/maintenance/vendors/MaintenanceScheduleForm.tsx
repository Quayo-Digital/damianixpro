
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { PropertySelector } from "./PropertySelector";
import { VendorSelector } from "./VendorSelector";
import { MaintenanceTaskFields } from "./MaintenanceTaskFields";
import { DateTimeSelector } from "./DateTimeSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
  specialization: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
}

interface MaintenanceScheduleFormProps {
  vendors: Vendor[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function MaintenanceScheduleForm({ vendors, onSubmit, onCancel }: MaintenanceScheduleFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !title || !property || !vendorId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes);
      
      const scheduleData = {
        title,
        description,
        property_id: property,
        vendor_id: vendorId,
        scheduled_date: scheduledDate.toISOString(),
        status: "scheduled"
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert([scheduleData])
        .select();

      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Maintenance schedule created successfully"
      });
      
      // Call the onSubmit callback to close the dialog and refresh data
      onSubmit(data[0]);
    } catch (error) {
      console.error("Error saving maintenance schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save maintenance schedule",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <MaintenanceTaskFields 
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
      />
      
      <PropertySelector 
        value={property}
        onChange={setProperty}
      />
      
      <VendorSelector 
        vendors={vendors}
        value={vendorId}
        onChange={setVendorId}
      />
      
      <DateTimeSelector 
        date={date}
        onDateChange={setDate}
        time={time}
        onTimeChange={setTime}
      />
      
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Schedule Maintenance"}
        </Button>
      </DialogFooter>
    </form>
  );
}
