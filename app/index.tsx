import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import {
  Camera,
  CameraProps,
  runAsync,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";

Reanimated.addWhitelistedNativeProps({
  zoom: true,
});
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export default function Index() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const camera = useRef<Camera>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);
  const [detectedNumbers, setDetectedNumbers] = useState<any[]>([]);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const flashOpacity = useSharedValue(0);
  const toastOpacity = useSharedValue(0);

  useEffect(() => {
    if (detectedNumbers.length === 0) return;
    console.log("Current detected numbers list:", detectedNumbers);
  }, [detectedNumbers]);

  // Function to update detected numbers - this will be called from worklet
  const updateDetectedNumbers = (detectedNumbers: any[]) => {
    setDetectedNumbers(detectedNumbers);
  };

  const onNumberDetected = Worklets.createRunOnJS(updateDetectedNumbers);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      runAsync(frame, () => {
        "worklet";
        const scannedOcr = scanOCR(frame);
        const detectedNumbers: any[] = [];

        scannedOcr.result.blocks.forEach((block) => {
          block.lines.forEach((line) => {
            line.elements.forEach((word) => {
              // Check if text is a 4-5 digit number
              if (/\b\d{4,5}\b/g.test(word.text)) {
                console.log(word.text);

                detectedNumbers.push({
                  text: word.text,
                  boundingBox: word.boundingBox,
                });
              }
            });
          });
        });

        onNumberDetected(detectedNumbers);
      });
    },
    [onNumberDetected]
  );

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      const newZoom = interpolate(
        z,
        [1, 10],
        [device?.minZoom ?? 1, device?.maxZoom ?? 10],
        Extrapolation.CLAMP
      );
      zoom.value = withSpring(newZoom, {
        damping: 50,
        stiffness: 500,
        mass: 0.1,
      });
    });

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  );

  const takePhoto = async () => {
    try {
      if (camera.current) {
        // Step 1: Take a photo using the camera's native photo capture
        // This gives us the actual camera image without any overlays
        const photo = await camera.current.takePhoto();
        const photoUri = `file://${photo.path}`;

        // Step 2: Set the captured photo URI to display it inside ViewShot
        // This allows ViewShot to capture the photo + overlay together
        setCapturedPhotoUri(photoUri);

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

        // Step 4: Clear the captured photo URI as it is not needed anymore
        setCapturedPhotoUri(null);

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

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
  }));

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.text} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ViewShot captures everything inside it as an image */}
      {/* We put the captured photo image inside ViewShot so it gets captured with the overlay */}
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
            onLoad={handleImageLoad}
          />
        )}

        <View style={styles.redSquare} />
      </ViewShot>

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

      <View style={styles.redSquare} />

      <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
        <View style={styles.captureButtonInner} />
      </TouchableOpacity>

      {/* Flash overlay that animates when taking a photo */}
      <Reanimated.View style={[styles.flashOverlay, flashStyle]} />

      {/* Saved message toast */}
      <Reanimated.View style={[styles.savedMessage, toastStyle]}>
        <Text style={styles.savedMessageText}>Photo saved to gallery</Text>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  captureButton: {
    position: "absolute",
    bottom: 80,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  redSquare: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    opacity: 0.5,
  },
  savedMessage: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 1001,
  },
  savedMessageText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
