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
  tracking: boolean;
  updateDistance: string;
  setTracking: React.Dispatch<React.SetStateAction<boolean>>;
  setBoundType: (boundType: BoundType) => void;
  setUpdateDistance: (distance: string) => void;
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

  const [updateDistance, setUpdateDistance] = useState<string>(
    getInitialState("updateDistance", "250")
  );
  const [boundType, setBoundType] = useState<BoundType>(
    getInitialState("boundType", "nothing")
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
      localStorage.setItem("boundType", JSON.stringify(boundType));
    }
  }, [boundType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("updateDistance", JSON.stringify(updateDistance));
    }
  }, [updateDistance]);

  return (
    <SettingsContext.Provider
      value={{
        updateDistance,
        boundType,
        tracking,
        setUpdateDistance,
        setBoundType,
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
