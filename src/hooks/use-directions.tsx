import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/firebase";
import { GetDirectionsResponseData, Location } from "@/lib/types";
import { calculateDistance } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

export default function useDirections({
  currentPosition,
  pin,
}: {
  currentPosition: Location | null;
  pin: Location | undefined;
}) {
  const { toast } = useToast();
  const [previousPin, setPreviousPin] = useState<Location | undefined>(() => {
    if (typeof window !== "undefined") {
      const savedPreviousPin = localStorage.getItem("previousPin");
      return savedPreviousPin ? JSON.parse(savedPreviousPin) : undefined;
    }
    return undefined;
  });

  const [directions, setDirections] =
    useState<GetDirectionsResponseData | null>(() => {
      if (typeof window !== "undefined") {
        const savedDirections = localStorage.getItem("directions");
        return savedDirections ? JSON.parse(savedDirections) : null;
      }
      return null;
    });

  const [latestPassedPointIndex, setLatestPassedPointIndex] = useState<
    number | null
  >(null);

  const directionsMutation = useMutation<GetDirectionsResponseData, Error>({
    mutationFn: async () => {
      const idToken = await auth.currentUser?.getIdToken(true);
      const response = await axios.post<GetDirectionsResponseData>(
        "/api/directions",
        {
          start: `${currentPosition?.lng},${currentPosition?.lat}`,
          end: `${pin?.lng},${pin?.lat}`,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data;
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
    onSuccess: (data: GetDirectionsResponseData) => {
      setDirections(data);
      localStorage.setItem("directions", JSON.stringify(data));
    },
  });

  const { mutate, isPending } = directionsMutation;

  // TODO: fix issue where this runs twice initially
  useEffect(() => {
    if (currentPosition && pin) {
      if (
        !directions ||
        (previousPin &&
          (previousPin.lng !== pin.lng || previousPin.lat !== pin.lat))
      ) {
        mutate();
        setPreviousPin(pin);
        localStorage.setItem("previousPin", JSON.stringify(pin));
      }
    }
  }, [currentPosition, pin, mutate, directions, previousPin]);

  useEffect(() => {
    if (currentPosition && directions) {
      const closestIndex = getClosestPointIndex(
        currentPosition,
        directions.tripPath
      );
      setLatestPassedPointIndex(closestIndex);
    }
  }, [currentPosition, directions]);

  const getClosestPointIndex = (
    currentPosition: Location,
    tripPath: [number, number][]
  ) => {
    let closestIndex = 0;
    let closestDistance = Infinity;
    tripPath.forEach(([lng, lat], index) => {
      const distance = calculateDistance(currentPosition, { lng, lat });
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  return { directions, isLoading: isPending, latestPassedPointIndex };
}
