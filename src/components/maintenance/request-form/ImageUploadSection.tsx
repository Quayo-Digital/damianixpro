import { FormLabel } from '@/components/ui/form';
import { EnhancedPropertyImageUpload } from '@/components/properties/EnhancedPropertyImageUpload';

interface ImageUploadSectionProps {
  imageUrl: string | null;
  onImageUploaded: (url: string | null) => void;
}

export function ImageUploadSection({ imageUrl, onImageUploaded }: ImageUploadSectionProps) {
  return (
    <div>
      <FormLabel className="mb-2 block">📱 Issue Documentation</FormLabel>
      <EnhancedPropertyImageUpload
        onImageUploaded={onImageUploaded}
        initialImageUrl={imageUrl}
        allowMultiple={true}
        maxImages={5}
        title="📸 Maintenance Issue Photos"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        📱 Capture photos of the maintenance issue with your camera or upload from device. Multiple
        photos help technicians understand the problem better.
      </p>
    </div>
  );
}
