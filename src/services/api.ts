import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  BallEventPayload,
  CommentaryItem,
  CreateTeamPayload,
  CreateTournamentPayload,
  Match,
  MatchStatus,
  NotificationItem,
  Player,
  Scorecard,
  Team,
  Tournament,
  TournamentStanding,
  User,
} from '../types/cricket';
import { applyBallToMatch } from '../utils/cricketRules';
import { generateCustomId } from '../utils/idGenerator';
import {
  mockCommentaryFeed,
  mockMatches,
  mockNotifications,
  mockPlayers,
  mockScorecards,
  mockTournamentStandings,
} from './mockData';

// Stateful in-memory stores for fallback / offline execution
let statefulMatches: Match[] = [...mockMatches];
let statefulScorecards: Record<string, Scorecard> = { ...mockScorecards };
let statefulCommentary: CommentaryItem[] = [...mockCommentaryFeed];

// In-memory mock tournaments matching screenshots
let statefulTournaments: Tournament[] = [
  {
    id: 'tour_warriors_02',
    name: 'WARRIORS CLUB CHAMPIONSHIP - 2',
    code: 'WARR1092',
    clubName: "Sundar's Club",
    city: 'Chennai',
    season: 'Season 2 - 2026',
    ballType: 'Tennis Ball',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    winnerTeam: 'TEAM FALCONS is the winner',
    totalTeams: 8,
    status: 'completed',
    bannerUrl:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'tour_warriors_01',
    name: 'WARRIORS CLUB CHAMPIONSHIP - 1',
    code: 'WARR1091',
    clubName: "Sundar's Club",
    city: 'Chennai',
    season: 'Season 1 - 2025',
    ballType: 'Tennis Ball',
    startDate: '2025-08-15',
    endDate: '2025-08-25',
    winnerTeam: 'TEAM TIGERS is the winner',
    totalTeams: 8,
    status: 'completed',
    bannerUrl:
      'https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'tour_madatugama_10',
    name: 'MADATUGAMA FRIENDSHIP TROPHY',
    code: 'MADA8391',
    clubName: 'Madatugama CC',
    city: 'Colombo',
    season: 'SEASON - 10 (2026)',
    ballType: 'Leather Ball',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    totalTeams: 8,
    status: 'ongoing',
    bannerUrl:
      'https://images.unsplash.com/photo-1512719994953-eabf50895df7?w=800&auto=format&fit=crop&q=80',
  },
];

// In-memory mock teams
let statefulTeams: Team[] = [
  {
    id: 'team_alpha_01',
    name: 'Alpha Warriors',
    shortName: 'ALW',
    code: 'ALPH9204',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
    city: 'Chennai',
    playersCount: 11,
    matchesPlayed: 4,
  },
  {
    id: 'team_dehoop_01',
    name: 'DE HOOP O11A 2026',
    shortName: 'DHO',
    code: 'DEHO1102',
    logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
    city: 'Paarl',
    playersCount: 11,
    matchesPlayed: 2,
  },
  {
    id: 'team_laerskool_01',
    name: 'LAERSKOOL PAARL GIMNASIUM 11',
    shortName: 'LPG',
    code: 'LAER3921',
    logoUrl: 'https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=128&q=80',
    city: 'Paarl',
    playersCount: 11,
    matchesPlayed: 3,
  },
];

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export const cricketApi = {
  // ==========================================
  // AUTHENTICATION & PROFILE APIS
  // ==========================================

  /**
   * POST /auth/send-otp
   * Sends 4-digit OTP to WhatsApp
   */
  async sendWhatsAppOtp(
    mobile: string
  ): Promise<{ success: boolean; message: string; isNewUser: boolean; devOtp?: string }> {
    try {
      const response = await apiClient.post('/auth/send-otp', { mobile });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const isExisting = mobile.endsWith('3210') || mobile.includes('98765');
      return {
        success: true,
        message: `4-digit OTP sent to WhatsApp number ${mobile}`,
        isNewUser: !isExisting,
        devOtp: '1234',
      };
    }
  },

  /**
   * POST /auth/verify-otp
   */
  async verifyOtp(
    mobile: string,
    otp: string
  ): Promise<{ verified: boolean; isNewUser: boolean; user?: User; token?: string }> {
    try {
      const response = await apiClient.post('/auth/verify-otp', { mobile, otp });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const isValid = otp === '1234' || otp.length === 4;
      if (!isValid) throw new Error('Invalid OTP code. Please enter 1234 or request a new code.');

      const isExisting = mobile.endsWith('3210') || mobile.includes('98765');
      if (isExisting) {
        return {
          verified: true,
          isNewUser: false,
          user: {
            id: 'user_sundar_01',
            name: 'Sundar',
            mobile,
            userCode: 'SUND4821',
            profileImage:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
          },
          token: 'mock_jwt_token_sundar',
        };
      }

      return {
        verified: true,
        isNewUser: true,
      };
    }
  },

  /**
   * POST /auth/complete-signup
   * Creates user with first 4 letters name + 4 digit random number ID
   */
  async completeSignup(payload: {
    mobile: string;
    name: string;
    pin: string;
    profileImage?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.post('/auth/complete-signup', payload);
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const userCode = generateCustomId(payload.name);
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: payload.name,
        mobile: payload.mobile,
        userCode,
        profileImage:
          payload.profileImage ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      };
      return {
        user: newUser,
        token: `mock_jwt_${Date.now()}`,
      };
    }
  },

  /**
   * POST /auth/login-pin
   */
  async loginWithPin(mobile: string, pin: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.post('/auth/login-pin', { mobile, pin });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (pin.length !== 4) throw new Error('Invalid 4-digit PIN');
      return {
        user: {
          id: 'user_sundar_01',
          name: 'Sundar',
          mobile,
          userCode: 'SUND4821',
          profileImage:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
        },
        token: 'mock_jwt_token_sundar',
      };
    }
  },

  /**
   * POST /upload
   * Image upload service for avatars, logos, and banners
   */
  async uploadImage(base64: string, filename?: string, folder?: string): Promise<{ url: string }> {
    try {
      const response = await apiClient.post('/upload', { base64, filename, folder });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Return direct data URI or base64 format for fallback
      const dataUri = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
      return { url: dataUri };
    }
  },

  // ==========================================
  // TOURNAMENTS APIS
  // ==========================================

  async getTournaments(): Promise<Tournament[]> {
    try {
      const response = await apiClient.get('/tournaments');
      return response.data.tournaments || response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return statefulTournaments;
    }
  },

  async createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
    try {
      const response = await apiClient.post('/tournaments', payload);
      const newTour = response.data.tournament;
      statefulTournaments = [newTour, ...statefulTournaments];
      return newTour;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const code = generateCustomId(payload.name);
      const newTour: Tournament = {
        id: `tour_${Date.now()}`,
        name: payload.name,
        code,
        clubName: payload.clubName || "Sundar's Club",
        city: payload.city || 'City',
        season: payload.season || '2026',
        ballType: payload.ballType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        bannerUrl:
          payload.bannerUrl ||
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
        totalTeams: 8,
        status: 'upcoming',
      };
      statefulTournaments = [newTour, ...statefulTournaments];
      return newTour;
    }
  },

  // ==========================================
  // TEAMS APIS
  // ==========================================

  async getTeams(userId?: string): Promise<Team[]> {
    try {
      const response = await apiClient.get('/teams', { params: userId ? { userId } : undefined });
      return response.data.teams || response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return statefulTeams;
    }
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    try {
      const response = await apiClient.post('/teams', payload);
      const newTeam = response.data.team;
      statefulTeams = [newTeam, ...statefulTeams];
      return newTeam;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const code = generateCustomId(payload.name);
      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: payload.name,
        shortName: payload.shortName || payload.name.slice(0, 3).toUpperCase(),
        code,
        logoUrl:
          payload.logoUrl ||
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
        city: payload.city || '',
        playersCount: 11,
        matchesPlayed: 0,
      };
      statefulTeams = [newTeam, ...statefulTeams];
      return newTeam;
    }
  },

  // ==========================================
  // MATCHES, SCORING & COMMENTARY APIS
  // ==========================================

  async getMatches(status?: MatchStatus): Promise<Match[]> {
    try {
      const response = await apiClient.get<Match[]>('/matches', {
        params: status ? { status } : undefined,
      });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!status) return statefulMatches;
      return statefulMatches.filter((m) => m.status === status);
    }
  },

  async getMatchById(matchId: string): Promise<Match> {
    try {
      const response = await apiClient.get<Match>(`/matches/${matchId}`);
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const match = statefulMatches.find((m) => m.id === matchId);
      if (!match) throw new Error(`Match with ID ${matchId} not found`);
      return match;
    }
  },

  async getScorecard(matchId: string): Promise<Scorecard> {
    try {
      const response = await apiClient.get<Scorecard>(`/matches/${matchId}/scorecard`);
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const scorecard = statefulScorecards[matchId];
      if (scorecard) return scorecard;

      const match = statefulMatches.find((m) => m.id === matchId);
      if (match) {
        const fallback: Scorecard = {
          matchId,
          innings1: {
            teamId: match.team1.id,
            teamName: match.team1.name,
            shortName: match.team1.shortName,
            score: match.team1.score,
            wickets: match.team1.wickets,
            overs: match.team1.overs,
            legalBalls: 120,
            maxOvers: 20,
            runRate: 8.5,
            batting: [match.activeBatters.striker, match.activeBatters.nonStriker],
            bowling: [match.activeBowler],
            extras: { wides: 3, noBalls: 0, byes: 0, legByes: 2, penalty: 0, total: 5 },
            fallOfWickets: [],
          },
        };
        statefulScorecards[matchId] = fallback;
        return fallback;
      }
      throw new Error(`Scorecard for match ${matchId} not found`);
    }
  },

  async getCommentary(matchId: string, filter?: string): Promise<CommentaryItem[]> {
    try {
      const response = await apiClient.get<CommentaryItem[]>(`/matches/${matchId}/commentary`, {
        params: filter ? { filter } : undefined,
      });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      let items = statefulCommentary.filter(
        (c) => c.matchId === matchId || matchId === 'match_blr_mum_01'
      );
      if (filter === 'boundary') {
        items = items.filter((c) => c.isBoundary);
      } else if (filter === 'wicket') {
        items = items.filter((c) => c.isWicket);
      }
      return items;
    }
  },

  async postBallEvent(
    matchId: string,
    payload: BallEventPayload
  ): Promise<{ match: Match; scorecard: Scorecard; commentaryItem: CommentaryItem }> {
    try {
      const response = await apiClient.post(`/matches/${matchId}/ball`, payload);
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const matchIndex = statefulMatches.findIndex((m) => m.id === matchId);
      const match = matchIndex >= 0 ? statefulMatches[matchIndex] : statefulMatches[0];
      const scorecard = statefulScorecards[matchId] || statefulScorecards['match_blr_mum_01'];

      const result = applyBallToMatch(match, scorecard, payload);

      if (matchIndex >= 0) {
        statefulMatches[matchIndex] = result.updatedMatch;
      }
      statefulScorecards[matchId] = result.updatedScorecard;

      const commentaryItem: CommentaryItem = {
        id: result.ballEvent.id,
        matchId: result.ballEvent.matchId,
        over: result.ballEvent.displayOver,
        bowlerName: result.ballEvent.bowlerName,
        strikerName: result.ballEvent.strikerName,
        runs: result.ballEvent.runsScored,
        ballType: result.ballEvent.ballType,
        isBoundary: result.ballEvent.isBoundary,
        isWicket: result.ballEvent.isWicket,
        title: result.ballEvent.tag || `${result.ballEvent.runsScored} runs`,
        description: result.ballEvent.commentaryText,
        timestamp: result.ballEvent.timestamp,
      };

      statefulCommentary = [commentaryItem, ...statefulCommentary];

      return {
        match: result.updatedMatch,
        scorecard: result.updatedScorecard,
        commentaryItem,
      };
    }
  },

  async getPlayerProfile(playerId: string): Promise<Player> {
    try {
      const response = await apiClient.get<Player>(`/players/${playerId}`);
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockPlayers[playerId] || mockPlayers['p_kohli'];
    }
  },

  async getTournamentStandings(group?: 'A' | 'B'): Promise<TournamentStanding[]> {
    try {
      const response = await apiClient.get<TournamentStanding[]>('/tournament/standings', {
        params: group ? { group } : undefined,
      });
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!group) return mockTournamentStandings;
      return mockTournamentStandings.filter((s) => s.group === group);
    }
  },

  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const response = await apiClient.get<NotificationItem[]>('/notifications');
      return response.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockNotifications;
    }
  },
};

export default cricketApi;
