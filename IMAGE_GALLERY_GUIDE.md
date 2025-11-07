# Image Gallery Components Guide

Complete guide to the image gallery components for the short-let system.

## 📦 Components Created

### 1. ImageGallery
**Location:** `src/components/shortlet/ImageGallery.tsx`

Full-featured image gallery with:
- Main image display with navigation
- Thumbnail navigation strip
- Full-screen lightbox mode
- Zoom functionality (0.5x - 3x)
- Keyboard navigation (arrows, escape, +/-)
- Auto-play support
- Image counter
- Error handling with fallback images

**Props:**
```typescript
interface ImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  startIndex?: number;
}
```

**Usage:**
```tsx
<ImageGallery
  images={imageUrls}
  title="Property Name"
  showThumbnails={true}
  autoPlay={false}
/>
```

**Features:**
- Click main image to open lightbox
- Thumbnail navigation
- Zoom controls in lightbox
- Keyboard shortcuts
- Responsive design

### 2. ImageCarousel
**Location:** `src/components/shortlet/ImageCarousel.tsx`

Simpler carousel-style gallery:
- Slide transitions
- Navigation arrows
- Dot indicators
- Auto-play support
- Configurable aspect ratios

**Props:**
```typescript
interface ImageCarouselProps {
  images: string[];
  title?: string;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: 'video' | 'square' | 'auto';
}
```

**Usage:**
```tsx
<ImageCarousel
  images={imageUrls}
  autoPlay={true}
  autoPlayInterval={4000}
  showDots={true}
  aspectRatio="video"
/>
```

**Features:**
- Smooth slide transitions
- Auto-play with configurable interval
- Dot navigation
- Arrow navigation
- Multiple aspect ratios

### 3. ImageGrid
**Location:** `src/components/shortlet/ImageGrid.tsx`

Grid layout for multiple images:
- Responsive grid (2, 3, or 4 columns)
- Click to view in lightbox
- Hover effects
- Configurable gaps

**Props:**
```typescript
interface ImageGridProps {
  images: string[];
  title?: string;
  className?: string;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  onImageClick?: (index: number) => void;
}
```

**Usage:**
```tsx
<ImageGrid
  images={imageUrls}
  columns={3}
  gap="md"
  onImageClick={(index) => console.log('Clicked image', index)}
/>
```

**Features:**
- Responsive grid layout
- Lightbox on click
- Hover effects
- Configurable columns and gaps

## 🎯 Features

### ImageGallery Features
1. **Main Display:** Large main image with navigation
2. **Thumbnails:** Strip of thumbnail images below
3. **Lightbox:** Full-screen view with zoom
4. **Zoom Controls:** Zoom in/out/reset (0.5x - 3x)
5. **Keyboard Navigation:**
   - Arrow keys: Navigate images
   - Escape: Close lightbox
   - +/-: Zoom in/out
   - 0: Reset zoom
6. **Auto-play:** Optional automatic image rotation
7. **Image Counter:** Shows current image number
8. **Error Handling:** Fallback images on load error

### ImageCarousel Features
1. **Slide Transitions:** Smooth transitions between images
2. **Navigation:** Arrow buttons and dot indicators
3. **Auto-play:** Automatic rotation
4. **Aspect Ratios:** Video (16:9), square (1:1), or auto
5. **Responsive:** Adapts to screen size

### ImageGrid Features
1. **Grid Layout:** Responsive grid (2-4 columns)
2. **Lightbox:** Click to view full-size
3. **Hover Effects:** Visual feedback on hover
4. **Configurable:** Columns and gap sizes

## 📍 Integration Points

### In Listing Page
```tsx
// In ShortletListingPage.tsx
<TabsContent value="view">
  {listing.property?.imageUrl && (
    <ImageGallery
      images={[listing.property.imageUrl]}
      title={listing.title}
      showThumbnails={false}
    />
  )}
  <BookingFlow listingId={listing.id} />
</TabsContent>
```

### In Listing Card
```tsx
// In ShortletListingCard.tsx
{listing.property?.imageUrl && (
  <ImageCarousel
    images={[listing.property.imageUrl]}
    aspectRatio="video"
    showDots={false}
  />
)}
```

### Multiple Images
```tsx
// If you have multiple images
const images = [
  listing.property?.imageUrl,
  ...additionalImages
].filter(Boolean);

<ImageGallery
  images={images}
  title={listing.title}
  showThumbnails={true}
/>
```

## 🎨 Styling

### Customization
All components accept `className` prop for custom styling:

```tsx
<ImageGallery
  images={images}
  className="my-custom-class"
/>
```

### Aspect Ratios
ImageCarousel supports different aspect ratios:
- `video`: 16:9 (default)
- `square`: 1:1
- `auto`: Natural image size

## ⌨️ Keyboard Shortcuts (ImageGallery Lightbox)

- **Arrow Left:** Previous image
- **Arrow Right:** Next image
- **Escape:** Close lightbox
- **+ or =:** Zoom in
- **-:** Zoom out
- **0:** Reset zoom

## 🔄 User Flows

### Viewing Images
1. User sees main image in gallery
2. Clicks thumbnail to change image
3. Clicks main image to open lightbox
4. Uses zoom controls or keyboard to navigate
5. Closes lightbox with Escape or X button

### Auto-play
1. Gallery automatically rotates images
2. User can pause by interacting
3. Auto-play resumes after interval

## ✨ Best Practices

1. **Image URLs:** Always provide valid image URLs
2. **Error Handling:** Components handle broken images gracefully
3. **Performance:** Use optimized images (WebP, compressed)
4. **Accessibility:** Include alt text via title prop
5. **Responsive:** All components are mobile-friendly

## 🐛 Common Issues

### Issue: Images not loading
**Solution:** Check image URLs are valid and accessible

### Issue: Lightbox not opening
**Solution:** Ensure Dialog component is properly imported

### Issue: Zoom not working
**Solution:** Check if zoom controls are visible in lightbox

### Issue: Auto-play not working
**Solution:** Ensure autoPlay prop is true and images.length > 1

## 📝 Future Enhancements

1. **Image Upload:** Direct upload in gallery
2. **Image Editing:** Crop, rotate, filter
3. **Lazy Loading:** Load images on demand
4. **Image Optimization:** Automatic compression
5. **360° View:** Support for 360° images
6. **Video Support:** Embed videos in gallery
7. **Social Sharing:** Share images on social media
8. **Download:** Download images feature

## 🔗 Related Components

- `ShortletListingCard` - Uses images for listing cards
- `ShortletListingPage` - Main listing view with gallery
- `PropertyImageUpload` - Upload component for images

