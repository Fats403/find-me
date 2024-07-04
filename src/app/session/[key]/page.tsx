"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
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
import {
  Wifi,
  Eye,
  Link,
  Settings,
  EyeOff,
  Pin,
  Milestone,
} from "lucide-react";
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
import useDirections from "@/hooks/use-directions";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SessionPage() {
  const [open, setOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [placingPin, setPlacingPin] = useState(false);

  const { key } = useParams();
  const { toast } = useToast();

  const sessionKey = useMemo(
    () => (typeof key === "string" || key === undefined ? key : key?.[0]),
    [key]
  );

  const authContext = useContext(AuthContext);

  const { tracking, setTracking } = useSettings();
  const { sessionData, loading } = useFetchSessionData(sessionKey);

  const { currentPosition, locations } = useLocationTracking(
    sessionKey,
    sessionData
  );

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSessionOwner = authContext?.user?.uid === sessionData?.creatorId;

  const {
    directions,
    isLoading: isLoadingDirections,
    latestPassedPointIndex,
  } = useDirections({
    currentPosition,
    pin: sessionData?.pin,
  });

  const toggleTracking = () => {
    setTracking((prev) => !prev);
  };

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
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="z-50 absolute top-52 right-4">
            <ThemeToggle />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Theme</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="absolute z-50 right-4 top-20 rounded-full bg-white size-12 border-black border-2"
            onMouseDown={() => {
              setDirectionsOpen(true);
            }}
          >
            <Milestone className="absolute w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Directions</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="absolute z-50 right-4 top-36 rounded-full bg-white size-12 border-black border-2 hover:bg-gray-200 dark:hover:bg-gray-800"
            onMouseDown={() => {
              handleCopyLink();
            }}
          >
            <Link className="absolute w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Copy Session Link</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onMouseDown={() => {
              setOpen(true);
            }}
            variant="ghost"
            size="icon"
            className="absolute z-50 right-4 top-4 rounded-full bg-white text-black dark:bg-black dark:text-white size-12 border-black border-2 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <Settings className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Location Settings</p>
        </TooltipContent>
      </Tooltip>

      {isSessionOwner && (
        <Button
          onClick={toggleTracking}
          className="absolute z-50 left-4 top-4 bg-white text-black dark:bg-black dark:text-white border-black border-2 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {!tracking ? (
            <Eye className="h-6 w-6 mr-2" />
          ) : (
            <EyeOff className="h-6 w-6 mr-2" />
          )}
          {!tracking ? "Enable Tracking" : "Disable Tracking"}
        </Button>
      )}

      {isDesktop ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Location Settings</DialogTitle>
              <DialogDescription>
                Configure your location update settings.
              </DialogDescription>
            </DialogHeader>
            <SettingsContent
              isSessionOwner={isSessionOwner}
              placingPin={placingPin}
              setPlacingPin={setPlacingPin}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Location Settings</DrawerTitle>
              <DrawerDescription>
                Configure your location update settings.
              </DrawerDescription>
            </DrawerHeader>
            <SettingsContent
              isSessionOwner={isSessionOwner}
              placingPin={placingPin}
              setPlacingPin={setPlacingPin}
            />
          </DrawerContent>
        </Drawer>
      )}

      <Drawer open={directionsOpen} onOpenChange={setDirectionsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Step-by-Step Directions</DrawerTitle>
            <DrawerDescription>
              Follow these steps to get to the pinned location.
            </DrawerDescription>
          </DrawerHeader>
          {directions ? (
            <div className="grid gap-4 px-4 py-6 max-h-64 overflow-auto">
              {directions?.instructions.map((instruction, index) => (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white dark:text-black text-white">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{instruction.maneuver}</h4>
                  </div>
                </div>
              ))}
            </div>
          ) : isLoadingDirections ? (
            <div className="w-full flex justify-center items-center">
              <Spinner />
            </div>
          ) : (
            <div className="text-center text-sm text-red-500 my-4 px-4">
              {!sessionData?.pin && (
                <p>
                  The session creator must set a pin beore you can get
                  directions.
                </p>
              )}
              {!currentPosition && (
                <p>You must enable tracking to get directions.</p>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <div className="h-full w-full overflow-hidden">
        <MapComponent
          center={{ lat: 51.0447, lng: -114.0719 }}
          placingPin={placingPin}
          sessionKey={sessionKey}
          setPlacingPin={setPlacingPin}
          tripPath={directions?.tripPath}
          latestPassedPointIndex={latestPassedPointIndex}
          currentPosition={currentPosition}
        >
          {locations.map(
            ({ lat, lng, timestamp, id, speed, heading }, index) => (
              <CustomMarker
                id={id}
                key={`${index}-${id}`}
                lat={lat}
                lng={lng}
                speed={speed}
                heading={heading}
                timestamp={timestamp}
                isMostRecent={index === locations.length - 1}
              />
            )
          )}

          {sessionData?.pin && (
            <CustomMarker
              lat={sessionData?.pin.lat}
              lng={sessionData?.pin.lng}
              timestamp={sessionData?.pin.timestamp}
              isPin
            />
          )}

          {currentPosition && (
            <Marker
              latitude={currentPosition.lat}
              longitude={currentPosition.lng}
            >
              <div className="relative flex justify-center items-center">
                <div className="absolute w-8 h-8 bg-blue-500 rounded-full opacity-75 animate-ping" />
                <div className="relative w-4 h-4 bg-blue-500 rounded-full" />
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
  isSessionOwner: boolean;
}

function SettingsContent({
  placingPin,
  setPlacingPin,
  isSessionOwner,
}: SettingsContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { setBoundType, boundType, updateDistance, setUpdateDistance } =
    useSettings();

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
      if (typeof window !== "undefined") {
        localStorage.removeItem("directions");
        localStorage.removeItem("previousPin");
        localStorage.removeItem("tracking");
      }

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
      {isSessionOwner && (
        <>
          <Label htmlFor="update-distance-select">Update position every</Label>
          <Select value={updateDistance} onValueChange={setUpdateDistance}>
            <SelectTrigger id="update-distance-select" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="100">100 meters</SelectItem>
                <SelectItem value="250">250 meters</SelectItem>
                <SelectItem value="500">500 meters</SelectItem>
                <SelectItem value="1000">1 kilometer</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )}

      <Label htmlFor="update-distance-select">Bind map to</Label>
      <Select value={boundType} onValueChange={setBoundType}>
        <SelectTrigger id="update-distance-select" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="nothing">Nothing</SelectItem>
            <SelectItem value="centerOnUser">My position</SelectItem>
            <SelectItem value="fitToBounds">All positions</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {isSessionOwner && (
        <Button
          onClick={() => setPlacingPin(!placingPin)}
          variant="outline"
          className="mt-2"
        >
          {placingPin ? "Cancel Pin Placement" : "Place a Pin on the Map"}
        </Button>
      )}

      {isSessionOwner && (
        <Button
          variant="destructive"
          onClick={() => deleteSessionMutation.mutate()}
          disabled={deleteSessionMutation.isPending}
          className="mt-2"
        >
          {deleteSessionMutation.isPending ? <Spinner /> : "Delete Session"}
        </Button>
      )}
    </div>
  );
}
