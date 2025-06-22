import { useCallback } from "react";
import { TeamInfo, teamService } from "../core/TeamService";
import { DetectedNumber } from "../types/CameraTypes";

export const useTeamInfo = () => {
  const fetchTeamInfo = useCallback(
    async (teamNumber: string): Promise<TeamInfo | null> => {
      try {
        const teamInfo = await teamService.getTeamInfo(teamNumber);
        return teamInfo;
      } catch (error) {
        console.error(`Error fetching team info for ${teamNumber}:`, error);
        return null;
      }
    },
    []
  );

  const enrichDetectedNumbers = useCallback(
    async (detectedNumbers: DetectedNumber[]): Promise<DetectedNumber[]> => {
      const enrichedNumbers = await Promise.all(
        detectedNumbers.map(async (number) => {
          // Only fetch if we don't already have team info
          if (!number.teamInfo) {
            const teamInfo = await fetchTeamInfo(number.text);
            return {
              ...number,
              teamInfo: teamInfo || undefined,
            };
          }
          return number;
        })
      );

      return enrichedNumbers;
    },
    [fetchTeamInfo]
  );

  return {
    fetchTeamInfo,
    enrichDetectedNumbers,
  };
};
