import React from "react";
import { StyleSheet, View } from "react-native";

interface RedDotOverlayProps {
  x: number;
  y: number;
  size?: number;
}

export const RedDotOverlay: React.FC<RedDotOverlayProps> = ({
  x,
  y,
  size = 20,
}) => {
  return (
    <View
      style={[
        styles.redDot,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  redDot: {
    position: "absolute",
    backgroundColor: "red",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "white",
  },
});
