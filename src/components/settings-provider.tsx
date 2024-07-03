"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

interface SettingsContextProps {
  autoFit: boolean;
  updateInterval: number;
  tracking: boolean;
  setAutoFit: (value: boolean) => void;
  setUpdateInterval: (value: number) => void;
  setTracking: React.Dispatch<React.SetStateAction<boolean>>;
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

  const [autoFit, setAutoFit] = useState<boolean>(
    getInitialState("autoFit", true)
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
      localStorage.setItem("autoFit", JSON.stringify(autoFit));
    }
  }, [autoFit]);

  return (
    <SettingsContext.Provider
      value={{
        autoFit,
        updateInterval,
        tracking,
        setAutoFit,
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
