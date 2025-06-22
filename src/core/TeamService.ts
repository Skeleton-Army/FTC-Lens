export interface TeamInfo {
  number: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface TeamSearchResult {
  number: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface QuickStats {
  averageScore: number;
  autoScore: number;
  driverControlledScore: number;
  endgameScore: number;
  totalRank: number;
  autoRank: number;
  driverControlledRank: number;
  endgameRank: number;
}

class TeamService {
  private cache = new Map<string, TeamInfo>();
  private statsCache = new Map<string, QuickStats>();
  private invalidTeamsCache = new Set<string>(); // Cache for teams that don't exist
  private baseUrl = "https://api.ftcscout.org/rest/v1";

  async getTeamInfo(teamNumber: string): Promise<TeamInfo | null> {
    // Check if we already know this team doesn't exist
    if (this.invalidTeamsCache.has(teamNumber)) {
      return null;
    }

    // Check cache first
    if (this.cache.has(teamNumber)) {
      return this.cache.get(teamNumber)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamNumber}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Team ${teamNumber} not found`);
          // Cache that this team doesn't exist
          this.invalidTeamsCache.add(teamNumber);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const teamData = await response.json();

      const teamInfo: TeamInfo = {
        number: teamData.number,
        name: teamData.name,
        city: teamData.city,
        state: teamData.state,
        country: teamData.country,
      };

      // Cache the result
      this.cache.set(teamNumber, teamInfo);

      return teamInfo;
    } catch (error) {
      console.error(`Error fetching team ${teamNumber}:`, error);
      return null;
    }
  }

  async getQuickStats(
    teamNumber: string,
    season?: number
  ): Promise<QuickStats | null> {
    const cacheKey = `${teamNumber}-${season || "current"}`;

    // Check cache first
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    try {
      const seasonParam = season ? `?season=${season}` : "";
      const response = await fetch(
        `${this.baseUrl}/teams/${teamNumber}/quick-stats${seasonParam}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Quick stats not found for team ${teamNumber}`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const statsData = await response.json();

      const quickStats: QuickStats = {
        averageScore: statsData.tot?.value ?? 0,
        autoScore: statsData.auto?.value ?? 0,
        driverControlledScore: statsData.dc?.value ?? 0,
        endgameScore: statsData.eg?.value ?? 0,
        totalRank: statsData.tot?.rank ?? 0,
        autoRank: statsData.auto?.rank ?? 0,
        driverControlledRank: statsData.dc?.rank ?? 0,
        endgameRank: statsData.eg?.rank ?? 0,
      };

      // Cache the result
      this.statsCache.set(cacheKey, quickStats);

      return quickStats;
    } catch (error) {
      console.error(
        `Error fetching quick stats for team ${teamNumber}:`,
        error
      );
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
    this.statsCache.clear();
    this.invalidTeamsCache.clear();
  }
}

export const teamService = new TeamService();
