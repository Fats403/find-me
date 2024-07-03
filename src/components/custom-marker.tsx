import React from "react";
import { Marker } from "react-map-gl";
import { MapPin, User } from "lucide-react";
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
      <div onClick={handleClick} className={`absolute cursor-pointer`}>
        {isMostRecent ? (
          <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-black">
            <User className="w-5 h-5 text-red-500" />
          </div>
        ) : (
          <MapPin className="w-6 h-6 text-red-500" />
        )}
      </div>
    </Marker>
  );
};

export default CustomMarker;
