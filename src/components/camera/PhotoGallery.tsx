/**
 * Photo Gallery Component
 * Display and manage captured photos with Nigerian network optimization
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Download,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  FileImage,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { CapturedPhoto } from '@/services/camera/CameraService';

export interface PhotoGalleryProps {
  photos: CapturedPhoto[];
  onPhotoDelete?: (photoId: string) => void;
  onPhotoDownload?: (photo: CapturedPhoto) => void;
  onPhotoShare?: (photo: CapturedPhoto) => void;
  title?: string;
  showMetadata?: boolean;
  allowDelete?: boolean;
  allowDownload?: boolean;
  allowShare?: boolean;
  maxDisplayPhotos?: number;
  className?: string;
}

export function PhotoGallery({
  photos,
  onPhotoDelete,
  onPhotoDownload,
  onPhotoShare,
  title = 'Photos',
  showMetadata = true,
  allowDelete = true,
  allowDownload = true,
  allowShare = true,
  maxDisplayPhotos,
  className = '',
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null);

  const displayPhotos = maxDisplayPhotos ? photos.slice(0, maxDisplayPhotos) : photos;
  const remainingCount = maxDisplayPhotos ? Math.max(0, photos.length - maxDisplayPhotos) : 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDownload = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onPhotoDownload?.(photo);
  };

  const handleShare = async (photo: CapturedPhoto) => {
    if (navigator.share && photo.blob) {
      try {
        const file = new File([photo.blob], photo.filename, { type: photo.blob.type });
        await navigator.share({
          title: 'Property Photo',
          text: `Photo captured on ${formatDate(photo.timestamp)}`,
          files: [file],
        });
        onPhotoShare?.(photo);
      } catch (error) {
        console.error('Share failed:', error);
        // Fallback to copy link
        handleCopyLink(photo);
      }
    } else {
      handleCopyLink(photo);
    }
  };

  const handleCopyLink = (photo: CapturedPhoto) => {
    navigator.clipboard.writeText(photo.dataUrl).then(() => {
      setCopiedPhotoId(photo.id);
      setTimeout(() => setCopiedPhotoId(null), 2000);
    });
  };

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileImage className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No photos captured yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {title}
            </CardTitle>
            <Badge variant="secondary">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {displayPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                {/* Photo Thumbnail */}
                <div
                  className="aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Photo Info */}
                <div className="mt-2 space-y-1">
                  <p className="truncate text-xs text-muted-foreground">{photo.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(photo.size)}</p>
                </div>

                {/* Action Buttons */}
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    {allowDownload && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                        className="h-8 w-8 border border-border bg-card/95 p-0 hover:bg-card"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}

                    {allowDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPhotoDelete?.(photo.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Show More Indicator */}
            {remainingCount > 0 && (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">+{remainingCount}</p>
                  <p className="text-xs text-muted-foreground">more</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {selectedPhoto.filename}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Photo Display */}
                <div className="relative">
                  <img
                    src={selectedPhoto.dataUrl}
                    alt={selectedPhoto.filename}
                    className="h-auto max-h-96 w-full rounded-lg bg-gray-100 object-contain"
                  />
                </div>

                {/* Photo Metadata */}
                {showMetadata && (
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Captured:</span>
                        <span>{formatDate(selectedPhoto.timestamp)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Size:</span>
                        <span>{formatFileSize(selectedPhoto.size)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Dimensions:</span>
                        <span>
                          {selectedPhoto.metadata.width} × {selectedPhoto.metadata.height}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Format:</span>
                        <span className="uppercase">{selectedPhoto.metadata.format}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Quality:</span>
                        <span>{Math.round(selectedPhoto.metadata.quality * 100)}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Camera:</span>
                        <span className="capitalize">{selectedPhoto.metadata.facingMode}</span>
                      </div>

                      {selectedPhoto.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Location:</span>
                          <span className="text-xs">
                            {selectedPhoto.location.latitude.toFixed(6)},{' '}
                            {selectedPhoto.location.longitude.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 border-t pt-4">
                  {allowDownload && (
                    <Button onClick={() => handleDownload(selectedPhoto)} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}

                  {allowShare && (
                    <Button
                      variant="outline"
                      onClick={() => handleShare(selectedPhoto)}
                      className="flex-1"
                    >
                      {copiedPhotoId === selectedPhoto.id ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </>
                      )}
                    </Button>
                  )}

                  {allowDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onPhotoDelete?.(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>

                {/* Nigerian Network Info */}
                <div className="border-t pt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    📱 Photo optimized for Nigerian networks • {formatFileSize(selectedPhoto.size)}{' '}
                    size
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PhotoGallery;
