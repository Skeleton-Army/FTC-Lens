import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DetectedNumber } from "../types/CameraTypes";
import { TeamInfoModal } from "./TeamInfoModal";

interface NumberOverlaysProps {
  detectedNumbers: DetectedNumber[];
  previewSize: { width: number; height: number };
  frameSize: { width: number; height: number };
}

/**
 * Transforms coordinates from camera frame space to preview display space.
 *
 * This function handles the coordinate mapping when the camera frame and preview
 * have different aspect ratios, applying center-crop scaling to maintain the
 * correct visual alignment of detected number overlays.
 *
 * @param x - X coordinate in frame space
 * @param y - Y coordinate in frame space
 * @param frameSize - Dimensions of the camera frame
 * @param previewSize - Dimensions of the preview display
 * @returns Transformed coordinates in preview space
 */
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

/**
 * Rotates coordinates from landscape camera frame to portrait display orientation.
 *
 * The camera captures frames in landscape orientation where:
 * - X increases from top to bottom
 * - Y increases from right to left
 *
 * This function rotates the coordinates 90° clockwise to match the portrait
 * display orientation where:
 * - X increases from left to right
 * - Y increases from top to bottom
 *
 * @param pt - Point coordinates in landscape frame space
 * @param frameSize - Dimensions of the landscape frame
 * @returns Rotated coordinates in portrait display space
 */
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
  const [selectedTeam, setSelectedTeam] = useState<DetectedNumber | null>(null);

  const handleTeamPress = (number: DetectedNumber) => {
    if (number.teamInfo) {
      setSelectedTeam(number);
      console.log("Team pressed:", number.teamInfo.name, `(${number.text})`);
    }
  };

  const closeModal = () => {
    setSelectedTeam(null);
  };

  return (
    <>
      {detectedNumbers.map((number, index) => {
        const { cornerPoints } = number;

        // Step 1: Rotate coordinates from landscape to portrait
        const rotated = cornerPoints.map((pt) =>
          rotateToPortrait(pt, frameSize)
        );

        // Step 2: Transform coordinates from frame space to preview space
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

        // Step 3: Calculate width, height, and rotation angle for the overlay rectangle
        const [topLeft, topRight, bottomRight, bottomLeft] = transformed;
        const width = Math.hypot(
          topRight.x - topLeft.x,
          topRight.y - topLeft.y
        );
        const height = Math.hypot(
          bottomLeft.x - topLeft.x,
          bottomLeft.y - topLeft.y
        );
        const angleRad = Math.atan2(
          topRight.y - topLeft.y,
          topRight.x - topLeft.x
        );
        const angleDeg = (angleRad * 180) / Math.PI;

        const displayText = `${number.text}\n${number.teamInfo!.name}`;

        return (
          <TouchableOpacity
            onPress={() => handleTeamPress(number)}
            key={`${number.text}-${index}`}
            style={[
              styles.overlay,
              {
                width,
                height,
                left: topLeft.x,
                top: topLeft.y,
                transform: [
                  // Rotate around the top-left corner by shifting the origin to the top-left, rotating, then shifting back
                  { translateX: -width / 2 },
                  { translateY: -height / 2 },
                  { rotate: `${angleDeg}deg` },
                  { translateX: width / 2 },
                  { translateY: height / 2 },
                ],
              },
            ]}
          >
            <View style={styles.border} />
            <Text style={[styles.text, styles.teamText]}>{displayText}</Text>
          </TouchableOpacity>
        );
      })}

      <TeamInfoModal
        teamInfo={selectedTeam?.teamInfo || null}
        onClose={closeModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
    textAlign: "center",
    lineHeight: 14,
  },
  teamText: {
    fontSize: 11,
    lineHeight: 13,
  },
});
