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

const MapComponent: React.FC<MapComponentProps> = ({
  containerStyle = defaultContainerStyle,
  center,
  zoom,
  children,
}) => {
  const [viewport, setViewport] = useState({
    latitude: center ? center.lat : 0,
    longitude: center ? center.lng : 0,
    zoom: zoom || 10,
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
