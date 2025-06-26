import { useCallback, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

export const useTapToFocus = (
  camera: React.RefObject<any>,
  previewSize: { width: number; height: number }
) => {
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focus = useCallback(
    (point: { x: number; y: number }) => {
      setFocusPoint(point);
      if (camera.current && camera.current.focus) {
        camera.current.focus(point);
      }

      // Hide focus point after 1 second
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setFocusPoint(null);
      }, 2000);
    },
    [camera]
  );

  const gesture = Gesture.Tap().onEnd((event) => {
    // Clamp tap to preview bounds
    const x = Math.max(0, Math.min(event.x, previewSize.width));
    const y = Math.max(0, Math.min(event.y, previewSize.height));
    runOnJS(focus)({ x, y });
  });

  return { gesture, focusPoint };
};
