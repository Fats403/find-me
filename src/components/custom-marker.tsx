import React from "react";
import { Marker } from "react-map-gl";
import { MapPin, Pin, User } from "lucide-react";
import { Position } from "@/lib/types";
import Image from "next/image";

interface CustomMarkerPosition extends Position {
  isSessionOwner?: boolean;
  isMostRecent?: boolean;
  isPin?: boolean;
}

const CustomMarker: React.FC<CustomMarkerPosition> = ({
  lat,
  lng,
  timestamp,
  speed,
  heading,
  isMostRecent,
  isSessionOwner,
  isPin,
}) => {
  return (
    <Marker latitude={lat} longitude={lng}>
      <div className="relative group cursor-pointer">
        <div className="hidden group-hover:block group-hover:z-50 absolute bottom-full mb-2 p-2 bg-white text-black dark:bg-black dark:text-white border border-gray-300 rounded-xl shadow-lg w-40 -translate-x-[42%]">
          <p>Lat: {lat}</p>
          <p>Lng: {lng}</p>
          {speed && <p>Speed: {formatSpeed(speed)} km/h</p>}
          {new Date(timestamp).toLocaleString()}
        </div>
        {isMostRecent && !isSessionOwner ? (
          <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-[#7D7F7C]">
            <User className="w-5 h-5 text-red-500" />
          </div>
        ) : isPin ? (
          <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-[#7D7F7C]">
            <Pin className="w-5 h-5 text-red-500" />
          </div>
        ) : (
          <>
            {heading ? (
              <div
                className="inline-block"
                style={{ transform: `rotate(${heading - 90}deg)` }}
              >
                <Image src="/arrow.webp" alt="arrow" width={16} height={16} />
              </div>
            ) : (
              <div className="w-3 h-3 bg-white/70 rounded-full border border-black" />
            )}
          </>
        )}
      </div>
    </Marker>
  );
};

const formatSpeed = (speed: number) => (Number(speed) * 3.6).toFixed(1);

export default CustomMarker;
