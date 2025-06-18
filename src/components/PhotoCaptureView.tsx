import React from "react";
import { Image, StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";

interface PhotoCaptureViewProps {
  viewShotRef: React.RefObject<ViewShot | null>;
  capturedPhotoUri: string | null;
  onImageLoad: () => void;
}

export const PhotoCaptureView: React.FC<PhotoCaptureViewProps> = ({
  viewShotRef,
  capturedPhotoUri,
  onImageLoad,
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

      <View style={styles.redSquare} />
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  redSquare: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
});
