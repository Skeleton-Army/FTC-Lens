import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DetectedNumber } from "../types/CameraTypes";

interface NumberOverlaysProps {
  detectedNumbers: DetectedNumber[];
  previewSize: { width: number; height: number };
  frameSize: { width: number; height: number };
}

function transformCoordinates(
  x: number,
  y: number,
  frameSize: { width: number; height: number },
  previewSize: { width: number; height: number }
): { x: number; y: number } {
  const frameAspect = frameSize.width / frameSize.height;
  const previewAspect = previewSize.width / previewSize.height;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (previewAspect > frameAspect) {
    // Center crop cuts off top/bottom
    scale = previewSize.width / frameSize.width;
    const scaledHeight = frameSize.height * scale;
    offsetY = (scaledHeight - previewSize.height) / 2;
  } else {
    // Center crop cuts off left/right
    scale = previewSize.height / frameSize.height;
    const scaledWidth = frameSize.width * scale;
    offsetX = (scaledWidth - previewSize.width) / 2;
  }

  return {
    x: x * scale - offsetX,
    y: y * scale - offsetY,
  };
}

// The camera is in portrait orientation, but
// The camera frame coordinates are in landscape, where:
// x increases top → bottom
// y increases right → left
// We want to rotate those coordinates 90° clockwise to portrait format
function rotateToPortrait(
  pt: { x: number; y: number },
  frameSize: { width: number; height: number } // LANDSCAPE
): { x: number; y: number } {
  return {
    x: frameSize.height - pt.y, // ← flip using the height (original vertical axis)
    y: pt.x, // ← original x becomes y
  };
}

export const NumberOverlays: React.FC<NumberOverlaysProps> = ({
  detectedNumbers,
  previewSize,
  frameSize,
}) => {
  return (
    <>
      {detectedNumbers.map((number, index) => {
        const { cornerPoints } = number;
        const rotated = cornerPoints.map((pt) =>
          rotateToPortrait(pt, frameSize)
        );
        const transformed = rotated.map((pt) =>
          transformCoordinates(
            pt.x,
            pt.y,
            {
              // Frame size is in landscape - rotate to portrait
              width: frameSize.height,
              height: frameSize.width,
            },
            previewSize
          )
        );

        const topLeft = transformed[0];
        const topRight = transformed[1];
        //const bottomRight = transformed[2];
        const bottomLeft = transformed[3];

        const top = topLeft.y;
        const left = topLeft.x;
        const width = Math.abs(topRight.x - topLeft.x);
        const height = Math.abs(bottomLeft.y - topLeft.y);

        console.log("rotated:");
        console.log(rotated);
        console.log("transformed:");
        console.log(transformed);
        console.log("preview: " + previewSize.width + "," + previewSize.height);
        console.log("frame: " + frameSize.width + "," + frameSize.height);
        console.log("top: " + top);
        console.log("left: " + left);

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
