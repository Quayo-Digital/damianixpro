import { AspectRatio } from '@/components/ui/aspect-ratio';

interface RequestImageProps {
  imageUrl: string | null;
  onClick: () => void;
}

export function RequestImage({ imageUrl, onClick }: RequestImageProps) {
  if (!imageUrl) return null;

  return (
    <div className="mb-4 cursor-pointer overflow-hidden rounded-md border" onClick={onClick}>
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src={imageUrl}
          alt="Request image"
          className="h-full w-full rounded-md object-cover transition-opacity hover:opacity-90"
        />
      </AspectRatio>
      <p className="p-1 text-center text-xs text-muted-foreground">Click to view image</p>
    </div>
  );
}
