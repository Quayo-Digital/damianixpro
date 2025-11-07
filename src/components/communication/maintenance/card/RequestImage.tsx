
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface RequestImageProps {
  imageUrl: string | null;
  onClick: () => void;
}

export function RequestImage({ imageUrl, onClick }: RequestImageProps) {
  if (!imageUrl) return null;
  
  return (
    <div className="mb-4 border rounded-md overflow-hidden cursor-pointer" onClick={onClick}>
      <AspectRatio ratio={16/9} className="bg-muted">
        <img 
          src={imageUrl} 
          alt="Request image" 
          className="object-cover w-full h-full rounded-md hover:opacity-90 transition-opacity"
        />
      </AspectRatio>
      <p className="text-xs text-center p-1 text-muted-foreground">Click to view image</p>
    </div>
  );
}
