import AsyncStorage from "@react-native-async-storage/async-storage";

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
  private cache = new Map<string, TeamInfo | null>();
  private statsCache = new Map<string, QuickStats>();
  private baseUrl = "https://api.ftcscout.org/rest/v1";
  private static TEAM_CACHE_KEY = "team_cache";
  private static STATS_CACHE_KEY = "stats_cache";
  private initialized = false;

  private async loadCaches() {
    if (this.initialized) return;
    try {
      const [teamCacheStr, statsCacheStr] = await Promise.all([
        AsyncStorage.getItem(TeamService.TEAM_CACHE_KEY),
        AsyncStorage.getItem(TeamService.STATS_CACHE_KEY),
      ]);
      if (teamCacheStr) {
        const obj = JSON.parse(teamCacheStr);
        this.cache = new Map(Object.entries(obj));
      }
      if (statsCacheStr) {
        const obj = JSON.parse(statsCacheStr);
        this.statsCache = new Map(Object.entries(obj));
      }
    } catch (e) {
      console.error("Failed to load caches from storage", e);
    }
    this.initialized = true;
  }

  private async saveTeamCache() {
    try {
      const obj = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(
        TeamService.TEAM_CACHE_KEY,
        JSON.stringify(obj)
      );
    } catch (e) {
      console.error("Failed to save team cache", e);
    }
  }

  private async saveStatsCache() {
    try {
      const obj = Object.fromEntries(this.statsCache);
      await AsyncStorage.setItem(
        TeamService.STATS_CACHE_KEY,
        JSON.stringify(obj)
      );
    } catch (e) {
      console.error("Failed to save stats cache", e);
    }
  }

  async getTeamInfo(teamNumber: string): Promise<TeamInfo | null> {
    await this.loadCaches();
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
          this.cache.set(teamNumber, null);
          await this.saveTeamCache();
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
      await this.saveTeamCache();
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
    await this.loadCaches();
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
      await this.saveStatsCache();
      return quickStats;
    } catch (error) {
      console.error(
        `Error fetching quick stats for team ${teamNumber}:`,
        error
      );
      return null;
    }
  }

  async clearCache() {
    this.cache.clear();
    this.statsCache.clear();
    await AsyncStorage.multiRemove([
      TeamService.TEAM_CACHE_KEY,
      TeamService.STATS_CACHE_KEY,
    ]);
  }
}

export const teamService = new TeamService();
