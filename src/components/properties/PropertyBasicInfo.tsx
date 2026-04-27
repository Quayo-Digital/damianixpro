import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { PropertyFormValues } from '@/services/property/types';

interface PropertyBasicInfoProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function PropertyBasicInfo({ form }: PropertyBasicInfoProps) {
  const transactionType = form.watch('transaction_type');
  const propertyCategory = form.watch('property_category');
  const isLand = propertyCategory === 'LAND';

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter property name" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transaction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Clear price fields when transaction type changes
                  if (value === 'SALE') {
                    form.setValue('lease_price', '');
                  } else {
                    form.setValue('sale_price', '');
                  }
                }}
                defaultValue={field.value || 'LEASE'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SALE">Sale</SelectItem>
                  <SelectItem value="LEASE">Lease</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="property_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Category *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // If land is selected, clear building-specific fields
                  if (value === 'LAND') {
                    form.setValue('bedrooms', undefined);
                    form.setValue('bathrooms', undefined);
                    form.setValue('squareFeet', undefined);
                    // Set type to land for backward compatibility
                    form.setValue('type', 'land');
                  } else {
                    // If building is selected, set appropriate type
                    if (!form.getValues('type') || form.getValues('type') === 'land') {
                      form.setValue('type', 'residential');
                    }
                  }
                }}
                defaultValue={field.value || 'RESIDENTIAL'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RESIDENTIAL">Building - Residential</SelectItem>
                  <SelectItem value="COMMERCIAL">Building - Commercial</SelectItem>
                  <SelectItem value="INDUSTRIAL">Building - Industrial</SelectItem>
                  <SelectItem value="LAND">Land</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isLand && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'residential'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input placeholder="Enter full address" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {transactionType === 'SALE' ? (
          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Price *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="₦0.00"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e);
                      // Also update the legacy price field for backward compatibility
                      form.setValue('price', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="lease_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leasing Price (Annual) *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="₦0.00/year"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e);
                      // Also update the legacy price field for backward compatibility
                      form.setValue('price', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="City, State" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Market Value - For sale properties to show appreciation */}
      {transactionType === 'SALE' && (
        <FormField
          control={form.control}
          name="market_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Market Value (₦) - Optional</FormLabel>
              <FormControl>
                <Input type="text" placeholder="₦0.00" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                The current appraised market value of the property. Used to calculate appreciation
                and ROI. If not provided, will use the sale price as fallback.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
