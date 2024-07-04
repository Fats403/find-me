import React, { useState, useCallback, useEffect } from "react";
import Map, {
  ViewStateChangeEvent,
  MapLayerMouseEvent,
  Source,
  Layer,
} from "react-map-gl";
import { LngLatBounds } from "mapbox-gl";
import { useSettings } from "./settings-provider";
import { setPinLocation } from "@/lib/firebase";
import { Location } from "@/lib/types";

interface MapComponentProps {
  containerStyle?: React.CSSProperties;
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
  placingPin: boolean;
  setPlacingPin: (placing: boolean) => void;
  sessionKey: string | null;
  tripPath?: [number, number][]; // Add tripPath as a prop
  latestPassedPointIndex?: number | null; // Add latestPassedPointIndex as a prop
  currentPosition?: Location | null; // Add currentPosition as a prop
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
  zoom = 8,
  children,
  placingPin,
  sessionKey,
  setPlacingPin,
  tripPath = [],
  latestPassedPointIndex = null,
  currentPosition,
}) => {
  const { boundType } = useSettings();
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

        setPinLocation(sessionKey, {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
          timestamp: Date.now(),
        });
        setPlacingPin(false);
      }
    },
    [placingPin, sessionKey, setPlacingPin]
  );

  useEffect(() => {
    if (boundType === "fitToBounds") {
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

      if (!bounds.isEmpty()) {
        const { _ne, _sw } = bounds;
        setViewport({
          latitude: (_ne.lat + _sw.lat) / 2,
          longitude: (_ne.lng + _sw.lng) / 2,
          zoom: 8,
        });
      }
    } else if (boundType === "centerOnUser" && currentPosition) {
      setViewport({
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        zoom: 15,
      });
    }
  }, [children, boundType, currentPosition]);

  const unpassedTripPath =
    latestPassedPointIndex !== null
      ? tripPath.slice(latestPassedPointIndex)
      : tripPath;

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
        {unpassedTripPath.length > 0 && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: unpassedTripPath,
              },
            }}
          >
            <Layer
              id="route"
              type="line"
              paint={{
                "line-color": "#7D7F7C",
                "line-width": 5,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}
        {children}
      </Map>
    </div>
  );
};

export default React.memo(MapComponent);
