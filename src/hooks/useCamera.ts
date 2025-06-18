import { useRef } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export const useCamera = () => {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  return {
    device,
    hasPermission,
    requestPermission,
    camera,
  };
};
