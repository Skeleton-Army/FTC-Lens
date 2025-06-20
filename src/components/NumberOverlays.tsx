import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        const { cornerPoints } = number;

        // 0 = top left, 1 = top right, 2 = bottom right, 3 = bottom left
        const left = cornerPoints[0].x;
        const top = cornerPoints[0].y;
        const width = cornerPoints[1].x - cornerPoints[0].x;
        const height = cornerPoints[3].y - cornerPoints[0].y;

        return (
          <TouchableOpacity
            onPress={() => {
              console.log("a");
            }}
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
          </TouchableOpacity>
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
