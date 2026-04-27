import { Checkbox } from '@/components/ui/checkbox';

interface FeatureFilterProps {
  selectedFeatures: string[];
  toggleFeature: (feature: string) => void;
  availableFeatures: string[];
}

export function FeatureFilter({
  selectedFeatures,
  toggleFeature,
  availableFeatures,
}: FeatureFilterProps) {
  return (
    <div>
      <h4 className="mb-2 font-medium">Property Features</h4>
      <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
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
          <p className="col-span-2 text-sm text-muted-foreground">No features available</p>
        )}
      </div>
    </div>
  );
}
