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
  return (
    <Marker latitude={lat} longitude={lng}>
      <div className="relative group cursor-pointer">
        <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-white border border-gray-300 rounded shadow-lg">
          <p>Lat: {lat}</p>
          <p>Lng: {lng}</p>
        </div>
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
