import { View } from "react-native";
import { CameraView } from "../components/CameraView";
import { CaptureButton } from "../components/CaptureButton";
import { FlashOverlay, ToastMessage } from "../components/Overlays";
import { NoDeviceView, NoPermissionView } from "../components/PermissionViews";
import { PhotoCaptureView } from "../components/PhotoCaptureView";
import { useOCRDetection } from "../core/OCRProcessor";
import { useCamera } from "../hooks/useCamera";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { useZoomGesture } from "../hooks/useZoomGesture";
import { cameraStyles } from "../styles/cameraStyles";

export default function Index() {
  const { device, hasPermission, requestPermission, camera } = useCamera();

  const { detectedNumbers, createNumberDetectionWorklet } = useOCRDetection();

  const {
    viewShotRef,
    capturedPhotoUri,
    flashOpacity,
    toastOpacity,
    takePhoto,
    handleImageLoad,
  } = usePhotoCapture(camera);

  const { zoom, gesture } = useZoomGesture(device);

  const onNumberDetected = createNumberDetectionWorklet();

  if (!hasPermission) {
    return <NoPermissionView onRequestPermission={requestPermission} />;
  }

  if (!device) {
    return <NoDeviceView />;
  }

  return (
    <View style={cameraStyles.container}>
      {/* Photo capture view for capturing with ViewShot */}
      <PhotoCaptureView
        viewShotRef={viewShotRef}
        capturedPhotoUri={capturedPhotoUri}
        onImageLoad={handleImageLoad}
      />

      {/* Main camera view with gesture handling */}
      <CameraView
        device={device}
        camera={camera}
        zoom={zoom}
        gesture={gesture}
        onNumberDetected={onNumberDetected}
      />

      {/* Red square overlay */}
      <View style={cameraStyles.redSquare} />

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
