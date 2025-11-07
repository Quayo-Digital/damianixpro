
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertyFormValues } from "@/services/property/types";

const commonAmenities = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "Air Conditioning" },
  { id: "parking", label: "Parking" },
  { id: "gym", label: "Gym" },
  { id: "pool", label: "Swimming Pool" },
  { id: "security", label: "24/7 Security" },
  { id: "furnished", label: "Furnished" },
  { id: "balcony", label: "Balcony" },
  { id: "garden", label: "Garden" },
  { id: "generator", label: "Generator" },
];

interface PropertyAmenitiesProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function PropertyAmenities({ form }: PropertyAmenitiesProps) {
  // Get or initialize amenities array from form
  const amenities = form.watch("amenities") || [];

  // Handle amenity toggle
  const toggleAmenity = (amenity: string) => {
    const currentAmenities = amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    form.setValue("amenities", updatedAmenities, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Amenities</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {commonAmenities.map((amenity) => (
          <div key={amenity.id} className="flex items-center space-x-2">
            <Checkbox 
              id={amenity.id}
              checked={amenities?.includes(amenity.id)}
              onCheckedChange={() => toggleAmenity(amenity.id)}
            />
            <label htmlFor={amenity.id} className="text-sm cursor-pointer">
              {amenity.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
