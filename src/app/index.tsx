import { useState } from "react";
import { View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { CameraView } from "../components/CameraView";
import { CaptureButton } from "../components/CaptureButton";
import { NumberOverlays } from "../components/NumberOverlays";
import { FlashOverlay, ToastMessage } from "../components/Overlays";
import { NoDeviceView, NoPermissionView } from "../components/PermissionViews";
import { PhotoCaptureView } from "../components/PhotoCaptureView";
import { useOCRDetection } from "../core/OCRProcessor";
import { useCamera } from "../hooks/useCamera";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { useTapToFocus } from "../hooks/useTapToFocus";
import { useZoomGesture } from "../hooks/useZoomGesture";
import { cameraStyles } from "../styles/cameraStyles";

export default function Index() {
  const { device, hasPermission, requestPermission, camera } = useCamera();
  const { detectedNumbers, frameSize, onNumberDetected } = useOCRDetection();
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const {
    viewShotRef,
    capturedPhotoUri,
    capturedNumbers,
    flashOpacity,
    toastOpacity,
    takePhoto,
    handleImageLoad,
  } = usePhotoCapture(camera, detectedNumbers);

  const { zoom, gesture: zoomGesture } = useZoomGesture(device);
  const { gesture: tapToFocusGesture, focusPoint } = useTapToFocus(
    camera,
    previewSize
  );

  // Compose gestures: tap-to-focus + zoom
  const gesture = Gesture.Simultaneous(tapToFocusGesture, zoomGesture);

  if (!hasPermission) {
    return <NoPermissionView onRequestPermission={requestPermission} />;
  }

  if (!device) {
    return <NoDeviceView />;
  }

  return (
    <View
      style={cameraStyles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setPreviewSize({ width, height });
      }}
    >
      {/* Photo capture view for capturing with ViewShot */}
      <PhotoCaptureView
        viewShotRef={viewShotRef}
        capturedPhotoUri={capturedPhotoUri}
        onImageLoad={handleImageLoad}
        detectedNumbers={capturedNumbers}
        previewSize={previewSize}
        frameSize={frameSize}
      />

      {/* Main camera view with gesture handling */}
      <CameraView
        device={device}
        camera={camera}
        zoom={zoom}
        gesture={gesture}
        onNumberDetected={onNumberDetected}
        focusPoint={focusPoint}
      />

      {/* Live number overlays */}
      <NumberOverlays
        detectedNumbers={detectedNumbers}
        previewSize={previewSize}
        frameSize={frameSize}
      />

      {/* Capture button */}
      <CaptureButton onPress={takePhoto} />

      {/* Flash overlay that animates when taking a photo */}
      <FlashOverlay flashOpacity={flashOpacity} />

      {/* Saved message toast */}
      <ToastMessage
        toastOpacity={toastOpacity}
        message="Photo saved to gallery"
      />
    </View>
  );
}
