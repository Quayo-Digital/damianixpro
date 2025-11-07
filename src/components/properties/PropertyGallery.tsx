
import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-muted flex items-center justify-center rounded-lg h-[400px]">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg">
        <img
          src={images[activeImage]}
          alt="Property main image"
          className="object-cover w-full h-full"
        />
      </AspectRatio>

      {images.length > 1 && (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                <div 
                  className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                    activeImage === index ? 'border-brand-primary' : 'border-transparent'
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <AspectRatio ratio={1}>
                    <img 
                      src={image} 
                      alt={`Property thumbnail ${index + 1}`} 
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      )}
    </div>
  );
}
