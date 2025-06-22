import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { QuickStats, teamService } from "../core/TeamService";
import { TeamInfo } from "../types/CameraTypes";

interface TeamInfoModalProps {
  teamInfo: TeamInfo | null;
  onClose: () => void;
}

interface StatRowProps {
  label: string;
  value: number;
  rank: number;
  ordinal: (n: number) => string;
}

export const TeamInfoModal: React.FC<TeamInfoModalProps> = ({
  teamInfo,
  onClose,
}) => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!teamInfo) return;

    setLoadingStats(true);
    try {
      const quickStats = await teamService.getQuickStats(teamInfo.number);
      setStats(quickStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [teamInfo]);

  useEffect(() => {
    if (teamInfo) {
      fetchStats();
    }
  }, [teamInfo, fetchStats]);

  const handleMoreInfo = async () => {
    if (!teamInfo) return;

    const url = `https://ftcscout.org/teams/${teamInfo.number}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Cannot Open Browser",
          "Unable to open the team page in your browser.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open the team page. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  if (!teamInfo) return null;

  const location = [teamInfo.city, teamInfo.state, teamInfo.country]
    .filter(Boolean)
    .join(", ");

  const StatRow: React.FC<StatRowProps> = ({ label, value, rank, ordinal }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}:</Text>
      <View style={styles.statValueContainer}>
        <Text style={styles.statValue}>{value.toFixed(2)}</Text>
        <Text style={styles.statRank}>({ordinal(rank)})</Text>
      </View>
    </View>
  );

  const renderStats = () => {
    if (loadingStats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      );
    }

    if (!stats) {
      return (
        <Text style={styles.statsText}>No stats available for this team.</Text>
      );
    }

    // Helper to format rank as 1st, 2nd, 3rd, etc.
    const ordinal = (n: number) => {
      if (n == null) return "";
      const s = ["th", "st", "nd", "rd"],
        v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
      <View style={styles.statsContainer}>
        <StatRow
          label="Total OPR"
          value={stats.averageScore}
          rank={stats.totalRank}
          ordinal={ordinal}
        />
        <StatRow
          label="Auto OPR"
          value={stats.autoScore}
          rank={stats.autoRank}
          ordinal={ordinal}
        />
        <StatRow
          label="Driver Controlled OPR"
          value={stats.driverControlledScore}
          rank={stats.driverControlledRank}
          ordinal={ordinal}
        />
        <StatRow
          label="Endgame OPR"
          value={stats.endgameScore}
          rank={stats.endgameRank}
          ordinal={ordinal}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Team {teamInfo.number}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team Name</Text>
              <Text style={styles.teamName}>{teamInfo.name}</Text>
            </View>

            {location && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.location}>{location}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              {renderStats()}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.moreInfoButton}
              onPress={handleMoreInfo}
            >
              <Text style={styles.moreInfoButtonText}>
                More Info on FTC Scout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    lineHeight: 24,
  },
  location: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  statsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  statsContainer: {
    gap: 8,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "bold",
  },
  statRank: {
    fontSize: 13,
    color: "#888",
    marginLeft: 4,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fafbfc",
    borderRadius: 6,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  moreInfoButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  moreInfoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
