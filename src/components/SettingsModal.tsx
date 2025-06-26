import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  url: string;
  onUrlChange: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  url,
  onUrlChange,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={settingsModalStyles.overlay}>
        <View style={settingsModalStyles.modal}>
          <View style={settingsModalStyles.header}>
            <Text style={settingsModalStyles.title}>Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              style={settingsModalStyles.closeButton}
            >
              <Text style={settingsModalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={settingsModalStyles.content}>
            <View style={settingsModalStyles.section}>
              <Text style={settingsModalStyles.sectionTitle}>
                More Info URL
              </Text>
              <Text style={settingsModalStyles.infoText}>
                Set the URL for team info. It will replace{" "}
                <Text style={{ fontWeight: "bold" }}>{"{TEAM}"}</Text> with the
                team number.
              </Text>
              <TextInput
                style={settingsModalStyles.urlInput}
                value={url}
                onChangeText={onUrlChange}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://ftcscout.org/teams/{TEAM}"
                placeholderTextColor="#aaa"
                selectTextOnFocus
                numberOfLines={1}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const settingsModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    marginTop: 8,
  },
  urlInput: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 18,
    fontFamily: "monospace",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  infoText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
    lineHeight: 20,
  },
});
