import { FormLabel } from '@/components/ui/form';
import { PropertyImageUpload } from '@/components/properties/PropertyImageUpload';

interface ImageUploadSectionProps {
  imageUrl: string | null;
  onImageUploaded: (url: string | null) => void;
}

export function ImageUploadSection({ imageUrl, onImageUploaded }: ImageUploadSectionProps) {
  return (
    <div className="space-y-2">
      <FormLabel className="font-medium">Issue Image</FormLabel>
      <PropertyImageUpload onImageUploaded={onImageUploaded} initialImageUrl={imageUrl} />
      <p className="text-xs text-muted-foreground">
        Upload an image of the maintenance issue (optional)
      </p>
    </div>
  );
}
