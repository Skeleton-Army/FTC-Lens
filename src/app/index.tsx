import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CameraView } from "../components/CameraView";
import { CaptureButton } from "../components/CaptureButton";
import { NumberOverlays } from "../components/NumberOverlays";
import { FlashOverlay, ToastMessage } from "../components/Overlays";
import { NoDeviceView, NoPermissionView } from "../components/PermissionViews";
import { PhotoCaptureView } from "../components/PhotoCaptureView";
import { SettingsModal } from "../components/SettingsModal";
import { useOCRDetection } from "../core/OCRProcessor";
import { useCamera } from "../hooks/useCamera";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { useTapToFocus } from "../hooks/useTapToFocus";
import { useZoomGesture } from "../hooks/useZoomGesture";
import { cameraStyles } from "../styles/cameraStyles";

const URL_TEMPLATE_KEY = "url_template";

export default function Index() {
  const { device, hasPermission, requestPermission, camera } = useCamera();
  const { detectedNumbers, frameSize, onNumberDetected } = useOCRDetection();
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [flash, setFlash] = useState(false);
  const {
    viewShotRef,
    capturedPhotoUri,
    capturedNumbers,
    flashOpacity,
    toastOpacity,
    takePhoto,
    handleImageLoad,
  } = usePhotoCapture(camera, detectedNumbers, flash);

  const { zoom, gesture: zoomGesture } = useZoomGesture(device);
  const { gesture: tapToFocusGesture, focusPoint } = useTapToFocus(
    camera,
    previewSize
  );

  // Compose gestures: tap-to-focus + zoom
  const gesture = Gesture.Simultaneous(tapToFocusGesture, zoomGesture);

  // Zoom indicator state
  const [zoomValue, setZoomValue] = useState(device?.neutralZoom ?? 1);
  useAnimatedReaction(
    () => zoom.value,
    (current, prev) => {
      if (current !== prev) runOnJS(setZoomValue)(current);
    },
    [zoom]
  );

  // Add state to control settings modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [urlTemplate, setUrlTemplate] = useState(
    "https://ftcscout.org/teams/{TEAM}"
  );

  // Load urlTemplate from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(URL_TEMPLATE_KEY).then((saved) => {
      if (saved) setUrlTemplate(saved);
    });
  }, []);

  // Save urlTemplate to storage on change
  useEffect(() => {
    AsyncStorage.setItem(URL_TEMPLATE_KEY, urlTemplate);
  }, [urlTemplate]);

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

      {/* Zoom indicator */}
      {zoomValue !== (device?.neutralZoom ?? 1) && (
        <View
          style={{
            position: "absolute",
            bottom: 160,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 6,
            zIndex: 1001,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {zoomValue.toFixed(1)}x
          </Text>
        </View>
      )}

      {/* Live number overlays */}
      <NumberOverlays
        detectedNumbers={detectedNumbers}
        previewSize={previewSize}
        frameSize={frameSize}
        urlTemplate={urlTemplate}
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

      {/* Flash and Settings icons */}
      <View
        style={{
          position: "absolute",
          right: 24,
          top: 60,
          alignItems: "center",
          zIndex: 1002,
        }}
      >
        {/* Settings icon */}
        <TouchableOpacity
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            borderRadius: 24,
            padding: 10,
            marginBottom: 18,
          }}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings-outline" size={28} color="#fff" />
        </TouchableOpacity>
        {/* Flash icon */}
        <TouchableOpacity
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            borderRadius: 24,
            padding: 10,
          }}
          onPress={() => setFlash((f) => !f)}
        >
          <Ionicons
            name={flash ? "flash" : "flash-off"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        url={urlTemplate}
        onUrlChange={setUrlTemplate}
      />
    </View>
  );
}
