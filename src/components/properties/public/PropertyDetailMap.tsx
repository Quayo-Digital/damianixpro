import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@/services/property';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function parseCoords(property: Property): [number, number] | null {
  const lat =
    typeof property.latitude === 'number'
      ? property.latitude
      : property.latitude != null
        ? Number(property.latitude)
        : NaN;
  const lng =
    typeof property.longitude === 'number'
      ? property.longitude
      : property.longitude != null
        ? Number(property.longitude)
        : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

interface PropertyDetailMapProps {
  property: Property;
}

export function PropertyDetailMap({ property }: PropertyDetailMapProps) {
  const position = parseCoords(property);
  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const tileUrl = maptilerKey
    ? `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${maptilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = maptilerKey ? '© MapTiler © OpenStreetMap' : '© OpenStreetMap';

  if (!position) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 p-6">
        <p className="text-center text-muted-foreground">
          Map coordinates are not set for this property.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          {property.address && `${property.address}, `}
          {property.location}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-lg border bg-muted">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: 'var(--muted)' }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        <Marker position={position} icon={defaultIcon}>
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold">{property.name}</p>
              <p className="text-sm text-muted-foreground">
                {property.address}, {property.location}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
