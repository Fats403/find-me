import { Location } from "@/lib/types";
import React, { useState, useCallback } from "react";
import Map, { ViewStateChangeEvent, MapLayerMouseEvent } from "react-map-gl";

interface MapComponentProps {
  containerStyle?: React.CSSProperties;
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
  placingPin: boolean;
  setCustomPin: (pin: Location) => void;
  setPlacingPin: (placing: boolean) => void;
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
  placingPin,
  setCustomPin,
  setPlacingPin,
}) => {
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom,
  });

  const handleMove = useCallback((event: ViewStateChangeEvent) => {
    setViewport(event.viewState);
  }, []);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (placingPin) {
        const { lngLat } = event;
        const lat = lngLat.lat;
        const lng = lngLat.lng;
        setCustomPin({ lat, lng });
        setPlacingPin(false);
      }
    },
    [placingPin, setCustomPin, setPlacingPin]
  );

  return (
    <div style={containerStyle}>
      <Map
        {...viewport}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        onMove={handleMove}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: containerStyle.width, height: containerStyle.height }}
      >
        {children}
      </Map>
    </div>
  );
};

export default React.memo(MapComponent);
