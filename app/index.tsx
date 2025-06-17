import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Skia } from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import {
  Camera,
  CameraProps,
  runAsync,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  useSkiaFrameProcessor,
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

  const skiaFrameProcessor = useSkiaFrameProcessor((frame) => {
    "worklet";
    frame.render();

    const centerX = frame.width / 2;
    const centerY = frame.height / 2;
    const rect = Skia.XYWHRect(centerX, centerY, 150, 150);
    const paint = Skia.Paint();
    paint.setColor(Skia.Color("red"));
    frame.drawRect(rect, paint);
  }, []);

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
      if (viewShotRef.current && viewShotRef.current.capture) {
        // Capture the entire screen including the Skia overlay
        const uri = await viewShotRef.current.capture();

        // Save to camera roll
        await CameraRoll.saveAsset(uri, {
          type: "photo",
        });
        Alert.alert("Success", "Photo with overlay saved to gallery!");
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
      Alert.alert("Error", "Failed to save photo to gallery");
    }
  };

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
    <ViewShot
      ref={viewShotRef}
      style={styles.container}
      options={{ format: "jpg", quality: 1 }}
    >
      <GestureDetector gesture={gesture}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          animatedProps={animatedProps}
          photo={true}
          frameProcessor={skiaFrameProcessor}
        />
      </GestureDetector>

      <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
        <View style={styles.captureButtonInner} />
      </TouchableOpacity>
    </ViewShot>
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
    bottom: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
});
