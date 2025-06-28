import React from "react";
import { StyleSheet, View } from "react-native";
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
  onNumberDetected: (
    numbers: DetectedNumber[],
    frameSize: { width: number; height: number }
  ) => void;
  onOcrExecuted?: () => void;
  focusPoint?: { x: number; y: number } | null;
  flash?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  device,
  camera,
  zoom,
  gesture,
  onNumberDetected,
  focusPoint,
  flash = false,
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
      <View style={StyleSheet.absoluteFill}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          animatedProps={animatedProps}
          photo={true}
          frameProcessor={frameProcessor}
          outputOrientation={"preview"} // Match photo to preview orientation. This prevents issues with landscape photos being rotated incorrectly.
          videoHdr={false}
          enableBufferCompression={true}
          torch={flash ? "on" : "off"}
        />

        {/* Focus indicator */}
        {focusPoint && (
          <Reanimated.View
            style={[
              {
                position: "absolute",
                left: focusPoint.x - 20,
                top: focusPoint.y - 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#FFD700",
                backgroundColor: "rgba(255, 215, 0, 0.2)",
              },
            ]}
          />
        )}
      </View>
    </GestureDetector>
  );
};
