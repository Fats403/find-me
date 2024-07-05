import { useSession } from "@/components/session-provider";
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
  const { updateDistance } = useSession();
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

    // Binary search to narrow down the closest segment
    const binarySearchClosestSegment = (start: number, end: number): number => {
      while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        const distanceToMid = calculateDistance(currentPosition, {
          lng: tripPath[mid][0],
          lat: tripPath[mid][1],
        });

        if (distanceToMid < closestDistance) {
          closestIndex = mid;
          closestDistance = distanceToMid;
        }

        if (distanceToMid === 0) {
          return mid;
        } else if (
          mid > 0 &&
          calculateDistance(currentPosition, {
            lng: tripPath[mid - 1][0],
            lat: tripPath[mid - 1][1],
          }) < distanceToMid
        ) {
          end = mid - 1;
        } else if (
          mid < tripPath.length - 1 &&
          calculateDistance(currentPosition, {
            lng: tripPath[mid + 1][0],
            lat: tripPath[mid + 1][1],
          }) < distanceToMid
        ) {
          start = mid + 1;
        } else {
          break;
        }
      }

      return closestIndex;
    };

    // Initialize closest index and distance
    closestIndex = binarySearchClosestSegment(0, tripPath.length - 1);

    // Fine-tune the search within a threshold distance around the closest index
    const thresholdDistance = Number(updateDistance) * 15; // Define a reasonable threshold based on updateDistance
    let lowerBound = closestIndex;
    let upperBound = closestIndex;

    // Expand lower bound until the distance exceeds thresholdDistance
    while (
      lowerBound > 0 &&
      calculateDistance(currentPosition, {
        lng: tripPath[lowerBound - 1][0],
        lat: tripPath[lowerBound - 1][1],
      }) <= thresholdDistance
    ) {
      lowerBound--;
    }

    // Expand upper bound until the distance exceeds thresholdDistance
    while (
      upperBound < tripPath.length - 1 &&
      calculateDistance(currentPosition, {
        lng: tripPath[upperBound + 1][0],
        lat: tripPath[upperBound + 1][1],
      }) <= thresholdDistance
    ) {
      upperBound++;
    }

    // Fine-tune the search within the calculated bounds
    for (let i = lowerBound; i <= upperBound; i++) {
      const distance = calculateDistance(currentPosition, {
        lng: tripPath[i][0],
        lat: tripPath[i][1],
      });
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  console.log(latestPassedPointIndex);

  return { directions, isLoading: isPending, latestPassedPointIndex };
}
