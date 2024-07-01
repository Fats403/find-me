"use client";

import React, { useState, useCallback, useEffect, useContext } from "react";
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
import { SlidersVertical, Wifi, Eye, Link } from "lucide-react";
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
import { useSession } from "@/components/session-provider";
import { AuthContext } from "@/components/firebase-provider";
import GoogleButton from "@/components/ui/google-button";
import { useToast } from "@/components/ui/use-toast";

const intervalOptions = {
  "30000": "Every 30 seconds",
  "60000": "Every 1 minute",
  "300000": "Every 5 minutes",
  "600000": "Every 10 minutes",
};

export default function SessionPage() {
  const [open, setOpen] = useState(false);
  const { loading, updateInterval, setUpdateInterval, sessionKey } =
    useSession();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const authContext = useContext(AuthContext);
  const { toast } = useToast();

  useEffect(() => {
    const storedInterval = localStorage.getItem("updateInterval");
    if (storedInterval) {
      setUpdateInterval(Number(storedInterval));
    }
  }, [setUpdateInterval]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleSelectChange = useCallback(
    (value: string) => {
      const interval = Number(value);
      setUpdateInterval(interval);
      localStorage.setItem("updateInterval", value);
    },
    [setUpdateInterval]
  );

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
        className="absolute z-50 right-2 top-2"
        onClick={() => setOpen(true)}
      >
        <SlidersVertical className="w-5 h-5 mr-2" />
        Open Settings
      </Button>

      <Button
        variant="outline"
        className="absolute z-50 right-2 bottom-48 rounded-full bg-white size-12 border-black border-1"
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard
              .writeText(window.location.href)
              .then(function () {
                toast({
                  title: "Copied link to clipboard!",
                });
              });
          }
        }}
      >
        <Link className="w-6 h-6" />
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
              onSelectChange={handleSelectChange}
              currentInterval={updateInterval}
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
              onSelectChange={handleSelectChange}
              currentInterval={updateInterval}
            />
          </DrawerContent>
        </Drawer>
      )}

      <div className="h-full w-full">
        <MapComponent
          containerStyle={{ width: "100%", height: "100%" }}
          zoom={12}
        />
      </div>
    </div>
  );
}

interface SettingsContentProps {
  onSelectChange: (value: string) => void;
  currentInterval: number;
}

function SettingsContent({
  onSelectChange,
  currentInterval,
}: SettingsContentProps) {
  const { deleteSession, isDeletingSession } = useSession();
  const defaultValue = currentInterval.toString();
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Select defaultValue={defaultValue} onValueChange={onSelectChange}>
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
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium">12 viewers</span>
      </div>
      <Button
        variant="destructive"
        onClick={deleteSession}
        disabled={isDeletingSession}
      >
        {isDeletingSession ? <Spinner /> : "Delete Session"}
      </Button>
    </div>
  );
}
