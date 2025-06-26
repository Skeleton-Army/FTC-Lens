import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import { Camera } from "react-native-vision-camera";
import { DetectedNumber } from "../types/CameraTypes";

export const usePhotoCapture = (
  camera: React.RefObject<Camera | null>,
  detectedNumbers: DetectedNumber[],
  flash: boolean
) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedNumbers, setCapturedNumbers] = useState<DetectedNumber[]>([]);
  const flashOpacity = useSharedValue(0);
  const toastOpacity = useSharedValue(0);

  const takePhoto = async () => {
    try {
      if (camera.current) {
        // Step 1: Take a photo using the camera's native photo capture
        // This gives us the actual camera image without any overlays
        const photo = await camera.current.takePhoto({
          flash: flash ? "on" : "off",
        });
        const photoUri = `file://${photo.path}`;

        // Step 2: Set the captured photo URI to display it inside ViewShot
        // This allows ViewShot to capture the photo + overlay together
        setCapturedPhotoUri(photoUri);

        // Capture the detected numbers at the moment the photo is taken
        setCapturedNumbers([...detectedNumbers]);

        flashOpacity.value = withTiming(1, { duration: 100 }, () => {
          flashOpacity.value = withTiming(0, { duration: 100 });
        });
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
      Alert.alert("Error", "Failed to save photo to gallery");
    }
  };

  // This function is called when the captured photo image finishes loading
  // We wait for the image to load before capturing ViewShot to ensure everything is rendered
  const handleImageLoad = async () => {
    if (viewShotRef.current && viewShotRef.current.capture) {
      try {
        // Step 3: Capture ViewShot after the image has loaded
        // This captures the photo + overlay as a single image
        const viewShotUri = await viewShotRef.current.capture();

        // Step 4: Clear the captured photo URI and numbers as they are not needed anymore
        setCapturedPhotoUri(null);
        setCapturedNumbers([]);

        // Step 5: Save the ViewShot capture (photo + overlay) to camera roll
        await CameraRoll.saveAsset(viewShotUri, {
          type: "photo",
        });

        toastOpacity.value = withTiming(1, { duration: 300 });
        setTimeout(() => {
          toastOpacity.value = withTiming(0, { duration: 300 });
        }, 2000);
      } catch (error) {
        console.error("Failed to capture or save ViewShot:", error);
        Alert.alert("Error", "Failed to save photo to gallery");
      }
    }
  };

  return {
    viewShotRef,
    capturedPhotoUri,
    capturedNumbers,
    flashOpacity,
    toastOpacity,
    takePhoto,
    handleImageLoad,
  };
};
