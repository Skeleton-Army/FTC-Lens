import { StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export default function Index() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

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
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
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
});
