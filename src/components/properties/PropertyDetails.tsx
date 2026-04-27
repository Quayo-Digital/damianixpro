import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { PropertyFormValues } from '@/services/property/types';

interface PropertyDetailsProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function PropertyDetails({ form }: PropertyDetailsProps) {
  const propertyCategory = form.watch('property_category');
  const isLand = propertyCategory === 'LAND';
  const transactionType = form.watch('transaction_type');

  return (
    <>
      {isLand ? (
        // Land-specific fields
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="land_size_sqft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Land Size (Square Feet)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g., 50000"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="land_size_acres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Land Size (Acres)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g., 1.15"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price_per_sqft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Square Foot</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="₦0.00/sqft"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : (
        // Building-specific fields
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of bedrooms"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of bathrooms"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="squareFeet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Square Feet</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Area in square feet"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {isLand && (
        <FormField
          control={form.control}
          name="development_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Development Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select development status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RAW_LAND">Raw Land</SelectItem>
                  <SelectItem value="SURVEYED">Surveyed</SelectItem>
                  <SelectItem value="TITLED">Titled</SelectItem>
                  <SelectItem value="DEVELOPED">Developed</SelectItem>
                  <SelectItem value="UNDER_DEVELOPMENT">Under Development</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter property description"
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availability_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {transactionType === 'LEASE' && (
        <FormField
          control={form.control}
          name="lease_terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lease Terms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter lease terms and conditions"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
