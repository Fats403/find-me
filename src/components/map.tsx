import React, { useState, useCallback } from "react";
import Map, { ViewStateChangeEvent } from "react-map-gl";

interface MapComponentProps {
  containerStyle?: React.CSSProperties;
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
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
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom,
  });

  const handleMove = useCallback((event: ViewStateChangeEvent) => {
    setViewport(event.viewState);
  }, []);

  return (
    <div style={containerStyle}>
      <Map
        {...viewport}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        onMove={handleMove}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: containerStyle.width, height: containerStyle.height }}
      >
        {children}
      </Map>
    </div>
  );
};

export default React.memo(MapComponent);
