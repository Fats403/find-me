import React from "react";
import { Marker } from "react-map-gl";
import { MapPin, Pin, User } from "lucide-react";
import { Position } from "@/lib/types";

interface CustomMarkerPosition extends Position {
  isMostRecent?: boolean;
  isPin?: boolean;
}

const CustomMarker: React.FC<CustomMarkerPosition> = ({
  lat,
  lng,
  timestamp,
  isMostRecent,
  isPin,
}) => {
  return (
    <Marker latitude={lat} longitude={lng}>
      <div className="relative group cursor-pointer">
        <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-white text-black dark:bg-black dark:text-white border border-gray-300 rounded-xl shadow-lg w-40 -left-16">
          <p>Lat: {lat}</p>
          <p>Lng: {lng}</p>
          {new Date(timestamp).toLocaleString()}
        </div>
        {isMostRecent ? (
          <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-[#7D7F7C]">
            <User className="w-5 h-5 text-red-500" />
          </div>
        ) : isPin ? (
          <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-[#7D7F7C]">
            <Pin className="w-5 h-5 text-red-500" />
          </div>
        ) : (
          <div className="w-3 h-3 bg-red-500/70 rounded-full border border-[#7D7F7C]" />
        )}
      </div>
    </Marker>
  );
};

export default CustomMarker;
