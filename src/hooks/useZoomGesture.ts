import { Gesture } from "react-native-gesture-handler";
import {
  Extrapolation,
  interpolate,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export const useZoomGesture = (device: any) => {
  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      const newZoom = interpolate(
        z,
        [1, 10],
        [device?.minZoom ?? 1, device?.maxZoom ?? 10],
        Extrapolation.CLAMP
      );
      zoom.value = withSpring(newZoom, {
        damping: 50,
        stiffness: 500,
        mass: 0.1,
      });
    });

  return {
    zoom,
    gesture,
  };
};
