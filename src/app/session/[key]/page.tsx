"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Wifi, Eye, Link, Settings, EyeOff, Pin } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useMediaQuery } from "@/lib/use-media-query";
import Spinner from "@/components/ui/spinner";
import MapComponent from "@/components/map";
import CustomMarker from "@/components/custom-marker";
import { AuthContext } from "@/components/firebase-provider";
import GoogleButton from "@/components/ui/google-button";
import { useToast } from "@/components/ui/use-toast";
import { Marker } from "react-map-gl";
import { DeleteSessionResponseData } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import useLocationTracking from "@/hooks/use-location-tracking";
import { useParams } from "next/navigation";
import useFetchSessionData from "@/hooks/use-fetch-session";
import { useSettings } from "@/components/settings-provider";
import { Checkbox } from "@/components/ui/checkbox";

const intervalOptions = {
  "30000": "Every 30 seconds",
  "60000": "Every 1 minute",
  "300000": "Every 5 minutes",
  "600000": "Every 10 minutes",
};

export default function SessionPage() {
  const [open, setOpen] = useState(false);
  const [placingPin, setPlacingPin] = useState(false);

  const { key } = useParams();
  const { toast } = useToast();

  const sessionKey = useMemo(
    () => (typeof key === "string" || key === undefined ? key : key?.[0]),
    [key]
  );

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const authContext = useContext(AuthContext);

  const { tracking, setTracking } = useSettings();
  const { sessionData, loading } = useFetchSessionData(sessionKey);

  const { currentPosition, locations } = useLocationTracking(
    sessionKey,
    sessionData
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(function () {
        toast({
          title: "Copied link to clipboard!",
        });
      });
    }
  };

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {},
      (error) => {
        let description = error.message;
        if (error.code === error.PERMISSION_DENIED) {
          description = "Permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          description = "Position unavailable. Please try again.";
        } else if (error.code === error.TIMEOUT) {
          description = "Location request timed out. Please try again.";
        }
        toast({
          title: "Location error",
          description,
          variant: "destructive",
        });
      }
    );
  };

  const toggleTracking = () => {
    setTracking((prev) => {
      const newState = !prev;
      if (newState) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((result) => {
            if (result.state !== "granted") {
              toast({
                title: "Permission required",
                description: "Please enable location access to start tracking.",
                variant: "destructive",
              });
              requestLocationPermission();
            }
          })
          .catch((error) => {
            console.error("Permission query failed:", error);
            setTracking(false);
          });
      }
      return newState;
    });
  };

  if (loading || authContext?.loading) {
    return (
      <div className="min-h-screen flex justify-center items-center flex-col">
        <h2>Loading Session...</h2>
        <Spinner className="text-black dark:text-white mt-2" />
      </div>
    );
  }

  if (!authContext?.user) {
    return (
      <Dialog open>
        <DialogContent showCloseButton={false} className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>
              To join this session you must be authenticated.
            </DialogDescription>
          </DialogHeader>
          <GoogleButton />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <Button
        variant="outline"
        className="absolute z-50 right-4 top-20 rounded-full bg-white size-12 border-black border-2"
        onMouseDown={() => {
          handleCopyLink();
        }}
      >
        <Link className="w-10 h-10" />
      </Button>

      <Button
        onMouseDown={() => {
          setOpen(true);
        }}
        variant="ghost"
        size="icon"
        className="absolute z-50 right-4 top-4 rounded-full bg-white size-12 border-black border-2"
      >
        <Settings className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <Button
        onClick={toggleTracking}
        className="absolute z-50 left-4 top-4 bg-white text-black border-black border-2 hover:bg-gray-200"
      >
        {!tracking ? (
          <Eye className="h-6 w-6 mr-2" />
        ) : (
          <EyeOff className="h-6 w-6 mr-2" />
        )}
        {!tracking ? "Enable Tracking" : "Disable Tracking"}
      </Button>

      {isDesktop ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Location Updates</DialogTitle>
              <DialogDescription>
                Configure your location update settings.
              </DialogDescription>
            </DialogHeader>
            <SettingsContent
              placingPin={placingPin}
              setPlacingPin={setPlacingPin}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Location Updates</DrawerTitle>
              <DrawerDescription>
                Configure your location update settings.
              </DrawerDescription>
            </DrawerHeader>
            <SettingsContent
              placingPin={placingPin}
              setPlacingPin={setPlacingPin}
            />
          </DrawerContent>
        </Drawer>
      )}

      <div className="h-full w-full overflow-hidden">
        <MapComponent
          center={{ lat: 51.0447, lng: -114.0719 }}
          placingPin={placingPin}
          sessionKey={sessionKey}
          setPlacingPin={setPlacingPin}
        >
          {locations.map(({ lat, lng, timestamp, id }, index) => (
            <CustomMarker
              id={id}
              key={`${index}-${id}`}
              lat={lat}
              lng={lng}
              timestamp={timestamp}
              isMostRecent={index === locations.length - 1}
            />
          ))}
          {sessionData?.pin && (
            <Marker
              latitude={sessionData.pin.lat}
              longitude={sessionData.pin.lng}
            >
              <div className="flex justify-center items-center size-8 rounded-full bg-white border-2 border-black">
                <Pin className="w-5 h-5 text-red-500" />
              </div>
            </Marker>
          )}
        </MapComponent>
      </div>
    </div>
  );
}

interface SettingsContentProps {
  placingPin: boolean;
  setPlacingPin: (placing: boolean) => void;
}

function SettingsContent({ placingPin, setPlacingPin }: SettingsContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { updateInterval, setUpdateInterval, setAutoFit, autoFit } =
    useSettings();
  const defaultValue = updateInterval.toString();
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setOnlineStatus(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleSelectChange = (value: string) => {
    setUpdateInterval(Number(value));
  };

  const handleAutoFitChange = (value: boolean) => {
    setAutoFit(value);
  };

  const deleteSessionMutation = useMutation<DeleteSessionResponseData, Error>({
    mutationFn: async () => {
      const idToken = await authContext?.user?.getIdToken(true);
      return axios.delete("/api/delete-session", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
    },
    onSuccess: (data: DeleteSessionResponseData) => {
      authContext?.setUserData(data.user);
      router.push("/");
      toast({ title: "Session deleted!" });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred.";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Select defaultValue={defaultValue} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(intervalOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoFit"
          checked={autoFit}
          onCheckedChange={handleAutoFitChange}
        />
        <label
          htmlFor="autoFit"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Auto Fit
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Wifi
          className={`w-5 h-5 ${
            onlineStatus ? "text-green-500" : "text-red-500"
          }`}
        />
        <span className="text-sm font-medium">
          {onlineStatus ? "Online" : "Offline"}
        </span>
      </div>

      <Button
        onClick={() => setPlacingPin(!placingPin)}
        variant="outline"
        className="mt-2"
      >
        {placingPin ? "Cancel Pin Placement" : "Place a Pin on the Map"}
      </Button>

      <Button
        variant="destructive"
        onClick={() => deleteSessionMutation.mutate()}
        disabled={deleteSessionMutation.isPending}
        className="mt-2"
      >
        {deleteSessionMutation.isPending ? <Spinner /> : "Delete Session"}
      </Button>
    </div>
  );
}
