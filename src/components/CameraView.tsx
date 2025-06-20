import { Skia } from "@shopify/react-native-skia";
import React from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedProps } from "react-native-reanimated";
import {
  Camera,
  CameraProps,
  useSkiaFrameProcessor,
} from "react-native-vision-camera";
import { processOCRFrame } from "../core/OCRProcessor";
import { DetectedNumber } from "../types/CameraTypes";

Reanimated.addWhitelistedNativeProps({
  zoom: true,
});
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

interface CameraViewProps {
  device: any;
  camera: React.RefObject<Camera | null>;
  zoom: any;
  gesture: any;
  onNumberDetected: (numbers: DetectedNumber[]) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  device,
  camera,
  zoom,
  gesture,
  onNumberDetected,
}) => {
  // const [pixelRatio, setPixelRatio] = React.useState<number>(1);

  // const frameProcessor = useFrameProcessor(
  //   (frame) => {
  //     "worklet";
  //     processOCRFrame(frame, onNumberDetected);
  //   },
  //   [onNumberDetected]
  // );

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      "worklet";
      frame.render();

      processOCRFrame(frame, onNumberDetected);

      // Draw dot at (300, 300)
      const centerX = 300;
      const centerY = 300;
      const rect = Skia.XYWHRect(centerX, centerY, 10, 10);
      const paint = Skia.Paint();
      paint.setColor(Skia.Color("red"));
      frame.drawRect(rect, paint);
    },
    [onNumberDetected]
  );

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  );

  return (
    <GestureDetector gesture={gesture}>
      <ReanimatedCamera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        animatedProps={animatedProps}
        photo={true}
        frameProcessor={frameProcessor}
        // resizeMode={"contain"}
      />
    </GestureDetector>
  );
};
