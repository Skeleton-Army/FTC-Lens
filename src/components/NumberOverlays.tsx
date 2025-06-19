import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DetectedNumber } from "../types/CameraTypes";

interface NumberOverlaysProps {
  detectedNumbers: DetectedNumber[];
}

export const NumberOverlays: React.FC<NumberOverlaysProps> = ({
  detectedNumbers,
}) => {
  return (
    <>
      {detectedNumbers.map((number, index) => {
        const { boundingBox } = number;

        // Use absolute pixel coordinates directly
        const left = boundingBox.left;
        const top = boundingBox.top;
        const width = boundingBox.right - boundingBox.left;
        const height = boundingBox.bottom - boundingBox.top;

        return (
          <View
            key={`${number.text}-${index}`}
            style={[
              styles.overlay,
              {
                left,
                top,
                width,
                height,
              },
            ]}
          >
            <View style={styles.border} />
            <Text style={styles.text}>{number.text}</Text>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  border: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00FF00",
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    width: "100%",
    height: "100%",
  },
  text: {
    color: "#00FF00",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
