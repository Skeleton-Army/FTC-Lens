import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface NoPermissionViewProps {
  onRequestPermission: () => void;
}

export const NoPermissionView: React.FC<NoPermissionViewProps> = ({
  onRequestPermission,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No access to camera</Text>
      <Text style={styles.text} onPress={onRequestPermission}>
        Grant Permission
      </Text>
    </View>
  );
};

export const NoDeviceView: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No camera device found</Text>
    </View>
  );
};

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
