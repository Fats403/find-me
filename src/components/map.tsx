import React, { ReactNode } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import Spinner from "./ui/spinner";

interface MapComponentProps {
  containerStyle?: React.CSSProperties;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  children?: ReactNode;
}

const defaultContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 51.0447,
  lng: -114.0719,
};

const MapComponent: React.FC<MapComponentProps> = ({
  containerStyle = defaultContainerStyle,
  center = defaultCenter,
  zoom = 10,
  children,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      options={{ fullscreenControl: false }}
    >
      {children}
    </GoogleMap>
  ) : (
    <div className="min-h-screen flex justify-center items-center">
      <Spinner className="text-black dark:text-white" />
    </div>
  );
};

export default React.memo(MapComponent);
