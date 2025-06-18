import React from "react";
import { StyleSheet, Text } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

interface FlashOverlayProps {
  flashOpacity: any;
}

export const FlashOverlay: React.FC<FlashOverlayProps> = ({ flashOpacity }) => {
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return <Reanimated.View style={[styles.flashOverlay, flashStyle]} />;
};

interface ToastMessageProps {
  toastOpacity: any;
  message: string;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({
  toastOpacity,
  message,
}) => {
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
  }));

  return (
    <Reanimated.View style={[styles.savedMessage, toastStyle]}>
      <Text style={styles.savedMessageText}>{message}</Text>
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
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
