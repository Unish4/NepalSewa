import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Navigation, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const NEPAL_CENTER = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

const MapCenterer = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position)
      map.setView([position.lat, position.lng], 15, { animate: true });
  }, [position, map]);
  return null;
};

const LocationPicker = ({ onLocationChange, initialPosition = null }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isLocating, setIsLocating] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      return data.display_name || "";
    } catch {
      return "";
    }
  };

  const handleMapClick = async (lat, lng) => {
    setPosition({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    onLocationChange({ lat, lng, address });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition({ lat, lng });
        const address = await reverseGeocode(lat, lng);
        onLocationChange({ lat, lng, address });
        setIsLocating(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not get your location. Click the map instead.");
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  const mapCenter = position ? [position.lat, position.lng] : NEPAL_CENTER;
  const mapZoom = position ? 15 : DEFAULT_ZOOM;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm
          font-medium border border-gray-200 rounded-lg text-gray-600
          hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Navigation size={15} className="text-green-600" />
        {isLocating ? "Detecting your location..." : "Use my current location"}
      </button>

      <div className="h-72 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onLocationSelect={handleMapClick} />
          <MapCenterer position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {position ? (
        <div
          className="flex items-start gap-2 bg-green-50 border border-green-100
          rounded-lg px-3 py-2.5"
        >
          <MapPin size={14} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-700">
              Location pinned
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Click anywhere on the map to pin the issue location
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
