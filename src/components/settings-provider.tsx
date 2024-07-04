"use client";

import { BoundType } from "@/lib/types";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

interface SettingsContextProps {
  boundType: BoundType;
  updateInterval: number;
  tracking: boolean;
  setUpdateInterval: (value: number) => void;
  setTracking: React.Dispatch<React.SetStateAction<boolean>>;
  setBoundType: (boundType: BoundType) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window !== "undefined") {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        return JSON.parse(savedValue);
      }
    }
    return defaultValue;
  };

  const [boundType, setBoundType] = useState<BoundType>(
    getInitialState("boundType", "nothing")
  );
  const [updateInterval, setUpdateInterval] = useState<number>(
    getInitialState("updateInterval", 60000)
  );
  const [tracking, setTracking] = useState<boolean>(
    getInitialState("tracking", false)
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tracking", JSON.stringify(tracking));
    }
  }, [tracking]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("updateInterval", updateInterval.toString());
    }
  }, [updateInterval]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("boundType", JSON.stringify(boundType));
    }
  }, [boundType]);

  return (
    <SettingsContext.Provider
      value={{
        boundType,
        updateInterval,
        tracking,
        setBoundType,
        setUpdateInterval,
        setTracking,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
