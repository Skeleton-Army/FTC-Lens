import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CaptureButtonProps {
  onPress: () => void;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.captureButton} onPress={onPress}>
      <View style={styles.captureButtonInner} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  captureButton: {
    position: "absolute",
    bottom: 70,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
  },
});
