import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Property } from '@/services/property';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Get API key from environment variable (managed by Super Admin)
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // Effect for initializing the map
  useEffect(() => {
    console.log('PropertyMap useEffect triggered');
    console.log('API Key available:', !!apiKey);
    console.log('API Key value:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
    console.log('Map container available:', !!mapContainer.current);
    
    if (!apiKey || !mapContainer.current) {
        console.log('Missing requirements for map initialization');
        if (map.current) {
            map.current.remove();
            map.current = null;
        }
        setIsMapLoaded(false);
        return;
    }

    if (map.current) {
        map.current.remove();
    }
    setMapError(null);
    setIsMapLoaded(false);

    const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`;
    console.log('Attempting to load map style from:', styleUrl);
    
    // Test MapTiler API key and initialize map
    const initializeMap = async () => {
      try {
        console.log('Testing MapTiler API key...');
        const response = await fetch(styleUrl);
        console.log('MapTiler API response status:', response.status);
        
        if (!response.ok) {
          console.error('MapTiler API key test failed:', response.status, response.statusText);
          if (response.status === 401) {
            setMapError('Invalid MapTiler API key. Please check your configuration.');
            return;
          } else if (response.status === 403) {
            setMapError('MapTiler API key access denied. Please check your key permissions.');
            return;
          }
        } else {
          console.log('MapTiler API key test successful');
          const styleData = await response.json();
          console.log('Style data loaded:', !!styleData.sources);
        }
        
        console.log('API key valid, proceeding with map initialization');
        
        // Initialize map after API key validation
        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: styleUrl,
          center: [8.6753, 9.0820], // Default center (Nigeria)
          zoom: 5,
          // WebGL fallback options
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true,
          antialias: false // Disable antialiasing to reduce WebGL load
        });
        
        console.log('MapLibre GL initialized successfully');
        
        map.current.on('error', (e: any) => {
          console.error('MapLibre error:', e.error);
          const errorMessage = 'Failed to load map. This may be due to an invalid API key or network issues. Please contact the platform administrator.';
          setMapError(errorMessage);
          toast.error('Map loading failed', {
            description: errorMessage
          });
        });

        map.current.on('load', () => {
          setIsMapLoaded(true);
          setMapError(null);
          console.log('Map loaded successfully');
        });
        
        // Handle WebGL context loss
        map.current.on('webglcontextlost', (e) => {
          console.warn('WebGL context lost, attempting recovery...', e);
          setMapError('Map rendering interrupted. Attempting to recover...');
          setIsMapLoaded(false);
        });
        
        map.current.on('webglcontextrestored', (e) => {
          console.log('WebGL context restored', e);
          setMapError(null);
          setIsMapLoaded(true);
        });
        
      } catch (error) {
        console.error('MapTiler API key test error or map initialization failed:', error);
        setMapError('Failed to connect to MapTiler services or initialize map. Please check your internet connection.');
      }
    };
    
    // Initialize map asynchronously
    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey]);

  // Effect for updating markers when properties change
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;

    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const validProperties = properties.filter(p => p.latitude != null && p.longitude != null);
    
    if (validProperties.length > 0) {
      validProperties.forEach((property) => {
        if (property.longitude && property.latitude) {
          const popupHTML = `
            <div class="w-64 overflow-hidden rounded-lg bg-card text-card-foreground" style="margin: -12px; font-family: var(--font-sans), sans-serif;">
              <a href="/public/properties/${property.id}" target="_blank" rel="noopener noreferrer">
                <img src="${property.imageUrl || '/placeholder.svg'}" alt="${property.name}" class="w-full h-32 object-cover" />
              </a>
              <div class="p-3">
                <a href="/public/properties/${property.id}" target="_blank" rel="noopener noreferrer" class="block">
                  <h3 class="font-semibold text-base truncate hover:text-primary transition-colors">${property.name}</h3>
                </a>
                <p class="text-sm text-muted-foreground truncate">${property.address}, ${property.location}</p>
                <div class="flex justify-between items-center mt-2">
                  <p class="text-lg font-bold text-primary">${property.price}</p>
                  <a href="/public/properties/${property.id}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90">
                    View Details
                  </a>
                </div>
              </div>
            </div>
          `;
          
          const newMarker = new maplibregl.Marker()
            .setLngLat([property.longitude, property.latitude])
            .setPopup(new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML))
            .addTo(map.current!);
          markers.current.push(newMarker);
        }
      });

      try {
        const bounds = new maplibregl.LngLatBounds();
        validProperties.forEach(p => {
            if (p.longitude && p.latitude) {
                bounds.extend([p.longitude, p.latitude]);
            }
        });
        map.current!.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 500 });
      } catch (err) {
        console.error("Error fitting map to bounds: ", err);
      }
    }
  }, [properties, isMapLoaded]);

  if (!apiKey) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Map View Not Available</h3>
        <p className="text-muted-foreground mb-4">
          The map feature has not been configured by the platform administrator.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-2">For Platform Administrators:</p>
          <p className="text-blue-700">
            To enable map functionality, configure the <code className="bg-blue-100 px-1 rounded">VITE_MAPTILER_API_KEY</code> environment variable 
            with a valid MapTiler API key from{' '}
            <a href="https://www.maptiler.com/cloud/plans/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              MapTiler Cloud
            </a>.
          </p>
        </div>
        {mapError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mt-4 text-sm">
            <p className="font-semibold">Configuration Error</p>
            <p className="text-destructive/90">{mapError}</p>
          </div>
        )}
      </Card>
    );
  }
  
  // If WebGL fails completely, show static map fallback
  if (mapError && mapError.includes('WebGL')) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Interactive Map Unavailable</h3>
        <p className="text-muted-foreground mb-4">
          Your browser doesn't support WebGL or hardware acceleration is disabled.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm mb-4">
          <p className="font-semibold text-yellow-800 mb-2">WebGL Issue Detected:</p>
          <p className="text-yellow-700 mb-2">{mapError}</p>
          <div className="text-left">
            <p className="font-semibold text-yellow-800 mb-1">To fix this:</p>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>Enable hardware acceleration in your browser settings</li>
              <li>Update your graphics drivers</li>
              <li>Try a different browser (Chrome, Firefox, Edge)</li>
              <li>Visit <code className="bg-yellow-100 px-1 rounded">get.webgl.org</code> to test WebGL support</li>
            </ul>
          </div>
        </div>
        {/* Static map fallback */}
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h4 className="text-lg font-semibold">Static Map View</h4>
            <p className="text-sm">Interactive map temporarily unavailable</p>
          </div>
          {properties.length > 0 && (
            <div className="text-left">
              <h5 className="font-semibold mb-2">Properties ({properties.length}):</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {properties.slice(0, 5).map((property) => (
                  <div key={property.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{property.name}</p>
                      <p className="text-xs text-gray-600">{property.address}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{property.price}</p>
                  </div>
                ))}
                {properties.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">... and {properties.length - 5} more properties</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-[600px] w-full rounded-lg bg-muted">
      <div ref={mapContainer} className="absolute inset-0" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
