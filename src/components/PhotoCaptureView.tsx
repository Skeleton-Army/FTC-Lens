import React from "react";
import { Image, StyleSheet } from "react-native";
import ViewShot from "react-native-view-shot";
import { DetectedNumber } from "../types/CameraTypes";
import { NumberOverlays } from "./NumberOverlays";

interface PhotoCaptureViewProps {
  viewShotRef: React.RefObject<ViewShot | null>;
  capturedPhotoUri: string | null;
  onImageLoad: () => void;
  detectedNumbers?: DetectedNumber[];
  previewSize: { width: number; height: number };
  frameSize: { width: number; height: number };
}

export const PhotoCaptureView: React.FC<PhotoCaptureViewProps> = ({
  viewShotRef,
  capturedPhotoUri,
  onImageLoad,
  detectedNumbers = [],
  previewSize,
  frameSize,
}) => {
  return (
    <ViewShot
      ref={viewShotRef}
      style={StyleSheet.absoluteFill}
      options={{ format: "jpg", quality: 1 }}
    >
      {capturedPhotoUri && (
        <Image
          source={{ uri: capturedPhotoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={onImageLoad}
        />
      )}

      <NumberOverlays
        detectedNumbers={detectedNumbers}
        previewSize={previewSize}
        frameSize={frameSize}
      />
    </ViewShot>
  );
};
