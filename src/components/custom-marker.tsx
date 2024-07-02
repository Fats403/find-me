import React from "react";
import { Marker } from "react-map-gl";
import { MapPin } from "lucide-react";

interface CustomMarkerProps {
  lat: number;
  lng: number;
  timestamp: number;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ lat, lng, timestamp }) => {
  const handleClick = () => {
    alert(
      `Lat: ${lat}, Lng: ${lng}, Timestamp: ${new Date(
        timestamp
      ).toLocaleString()}`
    );
  };

  return (
    <Marker latitude={lat} longitude={lng}>
      <div
        onClick={handleClick}
        style={{
          cursor: "pointer",
        }}
      >
        <MapPin className="w-5 h-5 text-red-500" />
      </div>
    </Marker>
  );
};

export default CustomMarker;
