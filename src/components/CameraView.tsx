import React from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedProps } from "react-native-reanimated";
import {
  Camera,
  CameraProps,
  useFrameProcessor,
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
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      processOCRFrame(frame, onNumberDetected);
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
      />
    </GestureDetector>
  );
};
