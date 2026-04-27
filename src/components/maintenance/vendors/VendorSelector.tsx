import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Vendor {
  id: string;
  name: string;
  specialization: string;
}

interface VendorSelectorProps {
  vendors: Vendor[];
  value: string;
  onChange: (value: string) => void;
}

export function VendorSelector({ vendors, value, onChange }: VendorSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="vendor">Vendor</Label>
      <Select value={value} onValueChange={onChange} required>
        <SelectTrigger id="vendor">
          <SelectValue placeholder="Select vendor" />
        </SelectTrigger>
        <SelectContent>
          {vendors.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              {vendor.name} - {vendor.specialization}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
