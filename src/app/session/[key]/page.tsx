"use client";

import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Eye, Link, Settings, EyeOff, Milestone } from "lucide-react";
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
import { useSession } from "@/components/session-provider";
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
import { Checkbox } from "@/components/ui/checkbox";

export default function SessionPage() {
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const {
    tracking,
    setTracking,
    sessionData,
    sessionKey,
    setLocationSettingsOpen,
    locationSettingsOpen,
    isLoadingSession,
    setDirectionsOpen,
    directionsOpen,
    isSessionOwner,
    placingPin,
    setPlacingPin,
    showLocations,
  } = useSession();

  const { currentPosition, locations } = useLocationTracking(
    sessionKey,
    sessionData
  );

  const {
    directions,
    isLoading: isLoadingDirections,
    latestPassedPointIndex,
  } = useDirections({
    currentPosition,
    pin: sessionData?.pin,
  });

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(function () {
        toast({
          title: "Copied link to clipboard!",
        });
      });
    }
  };

  if (isLoadingSession || authContext?.loading) {
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
              setLocationSettingsOpen(true);
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
          onClick={() => setTracking((prev) => !prev)}
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
        <Dialog
          open={locationSettingsOpen}
          onOpenChange={setLocationSettingsOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Location Settings</DialogTitle>
              <DialogDescription>
                Configure your location update settings.
              </DialogDescription>
            </DialogHeader>
            <SettingsContent />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer
          open={locationSettingsOpen}
          onOpenChange={setLocationSettingsOpen}
        >
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Location Settings</DrawerTitle>
              <DrawerDescription>
                Configure your location update settings.
              </DrawerDescription>
            </DrawerHeader>
            <SettingsContent />
          </DrawerContent>
        </Drawer>
      )}

      <DeleteSessionDialog />

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
          {(showLocations
            ? locations
            : locations.length > 0
            ? [locations[locations.length - 1]]
            : []
          ).map(({ lat, lng, timestamp, id, speed, heading }, index) => (
            <CustomMarker
              id={id}
              key={`${index}-${id}`}
              lat={lat}
              lng={lng}
              speed={speed}
              heading={heading}
              timestamp={timestamp}
              isMostRecent={index === locations.length - 1}
              isSessionOwner={isSessionOwner}
            />
          ))}

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

function SettingsContent() {
  const {
    placingPin,
    setPlacingPin,
    isSessionOwner,
    setBoundType,
    boundType,
    updateDistance,
    setUpdateDistance,
    setDeleteSessionOpen,
    setLocationSettingsOpen,
    showLocations,
    setShowLocations,
  } = useSession();

  return (
    <div className="flex flex-col gap-4 p-4">
      {isSessionOwner && (
        <div>
          <Label htmlFor="update-distance-select">Update position every</Label>
          <Select value={updateDistance} onValueChange={setUpdateDistance}>
            <SelectTrigger id="update-distance-select" className="w-full mt-2">
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
        </div>
      )}

      <div>
        <Label htmlFor="update-distance-select">Bind map to</Label>
        <Select value={boundType} onValueChange={setBoundType}>
          <SelectTrigger id="update-distance-select" className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="nothing">Nothing</SelectItem>
              <SelectItem value="centerOnUser">My position</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="show-location-updates-checkbox"
          checked={showLocations}
          onCheckedChange={setShowLocations}
        />
        <Label
          htmlFor="show-location-updates-checkbox"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show all session leader locations
        </Label>
      </div>

      {isSessionOwner && (
        <Button onClick={() => setPlacingPin(!placingPin)} className="mt-8">
          {placingPin ? "Cancel Pin Placement" : "Place a Pin on the Map"}
        </Button>
      )}

      {isSessionOwner && (
        <Button
          variant="destructive"
          onClick={() => {
            setLocationSettingsOpen(false);
            setDeleteSessionOpen(true);
          }}
          className="mt-2"
        >
          Delete Session
        </Button>
      )}
    </div>
  );
}

function DeleteSessionDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);

  const { setDeleteSessionOpen, deleteSessionOpen } = useSession();

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

      setDeleteSessionOpen(false);
      toast({ title: "Session deleted!" });

      authContext?.setUserData(data.user);
      router.push("/");
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
    <Dialog open={deleteSessionOpen} onOpenChange={setDeleteSessionOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete your session?</DialogTitle>
          <DialogDescription>
            All viewers will be kicked from the session and your session data
            will be deleted permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="mt-2 flex justify-center items-center">
            <Button
              className="mr-2"
              onClick={() => setDeleteSessionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSessionMutation.mutate()}
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending ? <Spinner /> : "Yes, I'm Sure"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
