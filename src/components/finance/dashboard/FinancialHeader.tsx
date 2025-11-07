
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertiesList } from '@/hooks/usePropertiesList';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialHeaderProps {
  propertyFilter: string;
  setPropertyFilter: (value: string) => void;
  timeframe: string;
  setTimeframe: (value: string) => void;
  disabled?: boolean;
}

export function FinancialHeader({ 
  propertyFilter, 
  setPropertyFilter, 
  timeframe, 
  setTimeframe,
  disabled = false,
}: FinancialHeaderProps) {
  const { data: properties, isLoading: isLoadingProperties } = usePropertiesList();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <p className="text-muted-foreground">Track and forecast your property portfolio performance</p>
      </div>
      <div className="flex gap-3">
        {isLoadingProperties ? (
          <Skeleton className="h-10 w-[180px]" />
        ) : (
          <Select
            value={propertyFilter}
            onValueChange={setPropertyFilter}
            disabled={disabled}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties?.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={timeframe}
          onValueChange={setTimeframe}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
