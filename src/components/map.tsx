import setPinLocation from "@/lib/firebase";
import React, { useState, useCallback, useEffect } from "react";
import Map, { ViewStateChangeEvent, MapLayerMouseEvent } from "react-map-gl";
import { LngLatBounds } from "mapbox-gl";
import { useSettings } from "./settings-provider";

interface MapComponentProps {
  containerStyle?: React.CSSProperties;
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
  placingPin: boolean;
  setPlacingPin: (placing: boolean) => void;
  sessionKey: string | null;
}

const defaultContainerStyle: React.CSSProperties = {
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
  zoom = 9,
  children,
  placingPin,
  sessionKey,
  setPlacingPin,
}) => {
  const { autoFit } = useSettings();
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

        setPinLocation(sessionKey, { lat: lngLat.lat, lng: lngLat.lng });
        setPlacingPin(false);
      }
    },
    [placingPin, sessionKey, setPlacingPin]
  );

  useEffect(() => {
    if (!autoFit) return;

    const bounds = new LngLatBounds();
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const { latitude, longitude, lat, lng } = child.props;
        if (latitude && longitude) {
          bounds.extend([longitude, latitude]);
        } else if (lat && lng) {
          bounds.extend([lng, lat]);
        }
      }
    });

    if (bounds.isEmpty()) {
      return;
    }

    const { _ne, _sw } = bounds;

    setViewport({
      latitude: (_ne.lat + _sw.lat) / 2,
      longitude: (_ne.lng + _sw.lng) / 2,
      zoom: 10,
    });
  }, [children, autoFit]);

  return (
    <div style={containerStyle}>
      <Map
        {...viewport}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        onMove={handleMove}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: containerStyle.width, height: containerStyle.height }}
      >
        {children}
      </Map>
    </div>
  );
};

export default React.memo(MapComponent);
