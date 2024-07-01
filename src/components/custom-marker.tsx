import { OverlayViewF } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import React from "react";

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
    <OverlayViewF position={{ lat, lng }} mapPaneName="overlayMouseTarget">
      <div
        onClick={handleClick}
        style={{
          cursor: "pointer !important",
        }}
      >
        <MapPin className="w-5 h-5 text-red-500" />
      </div>
    </OverlayViewF>
  );
};

export default CustomMarker;
