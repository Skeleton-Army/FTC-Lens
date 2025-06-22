import React from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedProps } from "react-native-reanimated";
import {
  Camera,
  CameraProps,
  useCameraFormat,
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
  onNumberDetected: (
    numbers: DetectedNumber[],
    frameSize: { width: number; height: number }
  ) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  device,
  camera,
  zoom,
  gesture,
  onNumberDetected,
}) => {
  const format = useCameraFormat(device, [
    { fps: 60 },
    // { videoResolution: { width: 1920, height: 1080 } },
  ]);

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
        format={format}
        outputOrientation={"preview"} // Match photo to preview orientation. This prevents issues with landscape photos being rotated incorrectly.
      />
    </GestureDetector>
  );
};
