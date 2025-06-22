import { useCallback, useState } from "react";
import { TeamInfo, teamService } from "../core/TeamService";
import { DetectedNumber } from "../types/CameraTypes";

export const useTeamInfo = () => {
  const [teamInfoCache, setTeamInfoCache] = useState<Map<string, TeamInfo>>(
    new Map()
  );
  const [loadingTeams, setLoadingTeams] = useState<Set<string>>(new Set());

  const fetchTeamInfo = useCallback(
    async (teamNumber: string): Promise<TeamInfo | null> => {
      // Check if already cached
      if (teamInfoCache.has(teamNumber)) {
        return teamInfoCache.get(teamNumber)!;
      }

      // Check if already loading
      if (loadingTeams.has(teamNumber)) {
        return null;
      }

      // Mark as loading
      setLoadingTeams((prev) => new Set(prev).add(teamNumber));

      try {
        const teamInfo = await teamService.getTeamInfo(teamNumber);

        if (teamInfo) {
          setTeamInfoCache((prev) => new Map(prev).set(teamNumber, teamInfo));
        }

        return teamInfo;
      } catch (error) {
        console.error(`Error fetching team info for ${teamNumber}:`, error);
        return null;
      } finally {
        setLoadingTeams((prev) => {
          const newSet = new Set(prev);
          newSet.delete(teamNumber);
          return newSet;
        });
      }
    },
    [teamInfoCache, loadingTeams]
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

  const clearCache = useCallback(() => {
    setTeamInfoCache(new Map());
    teamService.clearCache();
  }, []);

  return {
    teamInfoCache,
    loadingTeams,
    fetchTeamInfo,
    enrichDetectedNumbers,
    clearCache,
  };
};
