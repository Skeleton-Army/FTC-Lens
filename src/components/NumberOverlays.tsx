import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DetectedNumber } from "../types/CameraTypes";
import { calculateFontSize } from "../utils/calculateFontSize";
import { rotateToPortrait } from "../utils/rotateToPortrait";
import { transformCoordinates } from "../utils/transformCoordinates";
import { TeamInfoModal } from "./TeamInfoModal";

interface NumberOverlaysProps {
  detectedNumbers: DetectedNumber[];
  previewSize: { width: number; height: number };
  frameSize: { width: number; height: number };
  urlTemplate?: string;
}

export const NumberOverlays: React.FC<NumberOverlaysProps> = ({
  detectedNumbers,
  previewSize,
  frameSize,
  urlTemplate,
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

        const maxFontSize = 16;
        const minFontSize = 1;

        const fontSize = calculateFontSize(
          displayText,
          width,
          height,
          maxFontSize,
          minFontSize
        );

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
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              allowFontScaling={true}
              style={[
                styles.text,
                styles.teamText,
                { fontSize, lineHeight: fontSize },
              ]}
            >
              {displayText}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TeamInfoModal
        teamInfo={selectedTeam?.teamInfo || null}
        onClose={closeModal}
        urlTemplate={urlTemplate}
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 5,
  },
  border: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#00FF00",
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  text: {
    color: "#00FF00",
    fontSize: 12,
    fontWeight: "bold",
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
