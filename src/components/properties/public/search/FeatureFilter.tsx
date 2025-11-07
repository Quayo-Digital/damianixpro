
import { Checkbox } from '@/components/ui/checkbox';

interface FeatureFilterProps {
  selectedFeatures: string[];
  toggleFeature: (feature: string) => void;
  availableFeatures: string[];
}

export function FeatureFilter({
  selectedFeatures,
  toggleFeature,
  availableFeatures
}: FeatureFilterProps) {
  return (
    <div>
      <h4 className="font-medium mb-2">Property Features</h4>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {availableFeatures.map((feature) => (
          <div key={feature} className="flex items-center space-x-2">
            <Checkbox 
              id={`feature-${feature}`} 
              checked={selectedFeatures.includes(feature)}
              onCheckedChange={() => toggleFeature(feature)}
            />
            <label
              htmlFor={`feature-${feature}`}
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {feature}
            </label>
          </div>
        ))}
        {availableFeatures.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2">No features available</p>
        )}
      </div>
    </div>
  );
}
