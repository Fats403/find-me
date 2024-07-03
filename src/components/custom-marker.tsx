import React from "react";
import { Marker } from "react-map-gl";
import { CircleUserRound, MapPin } from "lucide-react";
import { Position } from "@/lib/types";

interface CustomMarkerPosition extends Position {
  isMostRecent?: boolean;
}

const CustomMarker: React.FC<CustomMarkerPosition> = ({
  lat,
  lng,
  timestamp,
  isMostRecent,
}) => {
  const handleClick = () => {
    alert(`Lat: ${lat}, Lng: ${lng}`);
  };

  return (
    <Marker latitude={lat} longitude={lng}>
      <div
        onClick={handleClick}
        className={`absolute cursor-pointer pointer-events-auto ${
          isMostRecent ? "z-[1000]" : "z-[500]"
        } ${isMostRecent ? "most-recent-marker" : "other-marker"}`}
      >
        {isMostRecent ? (
          <CircleUserRound className="w-5 h-5 text-black bg-white rounded-full" />
        ) : (
          <MapPin className="w-5 h-5 text-red-500" />
        )}
      </div>
    </Marker>
  );
};

export default CustomMarker;
