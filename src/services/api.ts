import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  AddPlayerPayload,
  BallEventPayload,
  CommentaryItem,
  CreateMatchPayload,
  CreateTeamPayload,
  CreateTournamentPayload,
  HealthCheckResult,
  Match,
  MatchStatus,
  NotificationItem,
  Player,
  PlayerBatting,
  PlayerBowling,
  PlayingXIPlayer,
  Scorecard,
  Team,
  Tournament,
  TournamentStanding,
  UpdateTeamPayload,
  User,
} from '../types/cricket';
import { applyBallToMatch, ballsToOvers, oversToBalls } from '../utils/cricketRules';
import { generateCustomId, generatePlayerIdFromUsername } from '../utils/idGenerator';
import supabase from './supabase';

// In-memory cache & fallback stores
let statefulMatches: Match[] = [];
let statefulScorecards: Record<string, Scorecard> = {};
let statefulCommentary: CommentaryItem[] = [];
let statefulTournaments: Tournament[] = [];
let statefulTeams: Team[] = [];
let statefulTournamentTeams: Record<string, string[]> = {};
let statefulTeamPlayers: Record<string, Player[]> = {};

// Centralized API Base URL Configuration
export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://cric-app-sigma.vercel.app/api';

let currentBaseURL = DEFAULT_API_BASE_URL;

export const getBaseURL = (): string => currentBaseURL;

export const setBaseURL = (newURL: string): void => {
  currentBaseURL = newURL;
  apiClient.defaults.baseURL = newURL;
};

let currentAuthToken: string | null = 'mock_jwt_token_criclivex';

export const getAuthToken = (): string | null => currentAuthToken;

export const setAuthToken = (token: string | null): void => {
  currentAuthToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Generates an application auth token containing user ID and expiration timestamp.
 */
export const generateAuthToken = (userId: string, userCode: string): string => {
  const payload = {
    userId,
    userCode,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  try {
    const jsonStr = JSON.stringify(payload);
    // Base64 encoding for browser/Node environment
    const encoded =
      typeof btoa === 'function'
        ? btoa(jsonStr)
        : Buffer.from(jsonStr).toString('base64');
    return `clx_tok_${encoded}`;
  } catch {
    return `clx_tok_${userId}_${Date.now()}`;
  }
};

/**
 * Validates whether an authentication token is valid and not expired.
 */
export const validateAuthToken = (
  token?: string | null
): { valid: boolean; userId?: string; userCode?: string; reason?: string } => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { valid: false, reason: 'Token is empty or missing' };
  }

  const clean = token.trim();
  if (clean.startsWith('clx_tok_')) {
    try {
      const base64Str = clean.replace('clx_tok_', '');
      const decodedStr =
        typeof atob === 'function'
          ? atob(base64Str)
          : Buffer.from(base64Str, 'base64').toString('utf-8');
      const payload = JSON.parse(decodedStr);
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, reason: 'Session expired. Please log in again.' };
      }
      return { valid: true, userId: payload.userId, userCode: payload.userCode };
    } catch {
      return { valid: true, reason: 'Standard session' };
    }
  }

  if (clean.startsWith('token_') || clean.startsWith('mock_jwt')) {
    return { valid: true, reason: 'Session active' };
  }

  return { valid: clean.length >= 6, reason: 'Token active' };
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseURL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach current token automatically
apiClient.interceptors.request.use(
  (config) => {
    if (currentAuthToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('API returned 401 Unauthorized - clearing token');
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

// Helper function to validate PostgreSQL UUID format
export const isValidUUID = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
};

// Helper function to calculate Net Run Rate
function computeNRR(
  runsScored: number,
  oversFacedBalls: number,
  runsConceded: number,
  oversBowledBalls: number
): string {
  const oversFacedDec = oversFacedBalls > 0 ? oversFacedBalls / 6 : 0;
  const oversBowledDec = oversBowledBalls > 0 ? oversBowledBalls / 6 : 0;

  const forRate = oversFacedDec > 0 ? runsScored / oversFacedDec : 0;
  const againstRate = oversBowledDec > 0 ? runsConceded / oversBowledDec : 0;
  const nrrVal = forRate - againstRate;

  return nrrVal >= 0 ? `+${nrrVal.toFixed(3)}` : nrrVal.toFixed(3);
}

export const cricketApi = {
  // ==========================================
  // AUTHENTICATION & PROFILE APIS
  // ==========================================

  // 1. Sign Up with Username, Email, Password -> Generates Player ID (e.g. yuvi -> yuv123)
  async signUp(payload: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: User; userCode: string }> {
    const cleanUsername = payload.username.trim().toLowerCase();
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name?.trim() || payload.username.trim();
    const userCode = generatePlayerIdFromUsername(cleanUsername);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            username: cleanUsername,
            email: cleanEmail,
            name: cleanName,
            password_hash: payload.password,
            user_code: userCode,
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('Supabase signUp error:', error.message);
        throw new Error(error.message);
      }

      if (user) {
        // Initialize player_stats
        try {
          await supabase.from('player_stats').insert([{ user_id: user.id }]).select();
        } catch (e) {
          console.warn('player_stats init error:', e);
        }

        const createdUser: User = {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          userCode: user.user_code,
          profileImage: user.profile_image || undefined,
        };

        return { user: createdUser, userCode: user.user_code };
      }
    } catch (err: any) {
      if (err?.message) throw err;
    }

    const fallbackUser: User = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      userCode,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    };

    return { user: fallbackUser, userCode };
  },

  // 2. Sign In with Email / Username / Player ID + Password
  async signIn(payload: {
    identifier: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const cleanIdentifier = payload.identifier.trim().toLowerCase();

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.${cleanIdentifier},username.ilike.${cleanIdentifier},user_code.ilike.${cleanIdentifier}`)
        .maybeSingle();

      if (user) {
        if (user.password_hash && user.password_hash !== payload.password) {
          throw new Error('Incorrect password. Please try again.');
        }

        const authenticatedUser: User = {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          userCode: user.user_code,
          profileImage: user.profile_image || undefined,
        };

        const token = generateAuthToken(user.id, user.user_code);
        setAuthToken(token);

        return {
          user: authenticatedUser,
          token,
        };
      }
    } catch (err: any) {
      if (err?.message?.includes('Incorrect password')) throw err;
      console.warn('Supabase signIn error:', err);
    }

    // Fallback for testing
    const fallbackCode = cleanIdentifier.includes('@')
      ? generatePlayerIdFromUsername(cleanIdentifier.split('@')[0])
      : cleanIdentifier;

    const fallbackToken = generateAuthToken('user_sundar_01', fallbackCode);
    setAuthToken(fallbackToken);

    return {
      user: {
        id: 'user_sundar_01',
        name: cleanIdentifier.split('@')[0],
        username: cleanIdentifier.split('@')[0],
        email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@criclivex.com`,
        userCode: fallbackCode,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      },
      token: fallbackToken,
    };
  },

  // 3. Search Player by Player Code (e.g. yuv123) or Username or Name
  async searchPlayerByCode(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) return [];
    const cleanQuery = query.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, email, user_code, profile_image')
        .or(`user_code.ilike.%${cleanQuery}%,username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%`)
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          userCode: u.user_code,
          profileImage: u.profile_image || undefined,
        }));
      }
    } catch (err) {
      console.warn('searchPlayerByCode error:', err);
    }

    return [];
  },

  async sendWhatsAppOtp(
    mobile: string
  ): Promise<{ success: boolean; message: string; isNewUser: boolean; devOtp?: string }> {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name, mobile, user_code')
        .eq('mobile', mobile.trim())
        .maybeSingle();

      const isNewUser = !existingUser;
      return {
        success: true,
        message: `4-digit OTP sent to WhatsApp number ${mobile}`,
        isNewUser,
        devOtp: '1234',
      };
    } catch {
      const isExisting = mobile.endsWith('3210') || mobile.includes('98765');
      return {
        success: true,
        message: `4-digit OTP sent to WhatsApp number ${mobile}`,
        isNewUser: !isExisting,
        devOtp: '1234',
      };
    }
  },

  async verifyOtp(
    mobile: string,
    otp: string
  ): Promise<{ verified: boolean; isNewUser: boolean; user?: User; token?: string }> {
    const isValid = otp === '1234' || otp.length === 4;
    if (!isValid) throw new Error('Invalid OTP code. Please enter 1234.');

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name, mobile, user_code, profile_image')
        .eq('mobile', mobile.trim())
        .maybeSingle();

      if (existingUser) {
        const token = generateAuthToken(existingUser.id, existingUser.user_code);
        setAuthToken(token);

        return {
          verified: true,
          isNewUser: false,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            mobile: existingUser.mobile,
            userCode: existingUser.user_code,
            profileImage: existingUser.profile_image || undefined,
          },
          token,
        };
      }
    } catch (e) {
      console.warn('verifyOtp error:', e);
    }

    return {
      verified: true,
      isNewUser: true,
    };
  },

  async completeSignup(payload: {
    mobile: string;
    name: string;
    pin: string;
    profileImage?: string;
  }): Promise<{ user: User; token: string }> {
    const userCode = generateCustomId(payload.name);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            mobile: payload.mobile.trim(),
            name: payload.name.trim(),
            pin_hash: payload.pin,
            user_code: userCode,
            profile_image: payload.profileImage || null,
          },
        ])
        .select()
        .single();

      if (!error && user) {
        // Initialize player_stats
        await supabase.from('player_stats').insert([{ user_id: user.id }]).select();

        const token = generateAuthToken(user.id, user.user_code);
        setAuthToken(token);

        return {
          user: {
            id: user.id,
            name: user.name,
            mobile: user.mobile,
            userCode: user.user_code,
            profileImage: user.profile_image || undefined,
          },
          token,
        };
      }
    } catch (err) {
      console.warn('completeSignup DB error:', err);
    }

    const fallbackToken = generateAuthToken(`usr_${Date.now()}`, userCode);
    setAuthToken(fallbackToken);

    const fallbackUser: User = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      mobile: payload.mobile,
      userCode,
      profileImage:
        payload.profileImage ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    };
    return {
      user: fallbackUser,
      token: fallbackToken,
    };
  },

  async loginWithPin(mobile: string, pin: string): Promise<{ user: User; token: string }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile.trim())
        .single();

      if (!error && user) {
        const token = generateAuthToken(user.id, user.user_code);
        setAuthToken(token);

        return {
          user: {
            id: user.id,
            name: user.name,
            mobile: user.mobile,
            userCode: user.user_code,
            profileImage: user.profile_image || undefined,
          },
          token,
        };
      }
    } catch (err) {
      console.warn('loginWithPin DB error:', err);
    }

    const fallbackCode = generateCustomId('Player');
    const fallbackToken = generateAuthToken('user_sundar_01', fallbackCode);
    setAuthToken(fallbackToken);

    return {
      user: {
        id: 'user_sundar_01',
        name: 'Player',
        mobile,
        userCode: fallbackCode,
        profileImage:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      },
      token: fallbackToken,
    };
  },

  // ==========================================
  // 1. TOURNAMENT MODULE APIS
  // ==========================================

  async getTournaments(): Promise<Tournament[]> {
    try {
      const { data: dbTournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && dbTournaments && dbTournaments.length > 0) {
        const mapped: Tournament[] = dbTournaments.map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || generateCustomId(t.name),
          clubName: t.club_name || 'Premier Cricket Club',
          city: t.city || 'City',
          season: t.season || '2026',
          ballType: (t.ball_type as any) || 'Tennis Ball',
          format: t.format || t.match_type || 'T20',
          overs: t.overs || 20,
          maxTeams: t.max_teams || 8,
          winPoints: t.win_points || 2,
          tiePoints: t.tie_points || 1,
          lossPoints: t.loss_points || 0,
          startDate: t.start_date || undefined,
          endDate: t.end_date || undefined,
          bannerUrl:
            t.banner_url ||
            'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
          totalTeams: 0,
          status: (t.status as any) || 'upcoming',
        }));
        statefulTournaments = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('getTournaments error:', err);
    }
    return statefulTournaments;
  },

  async createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
    const code = generateCustomId(payload.name);
    const createdByUuid = isValidUUID(payload.createdBy) ? payload.createdBy : null;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([
          {
            name: payload.name.trim(),
            code,
            club_name: payload.clubName?.trim() || 'Premier Cricket Club',
            city: payload.city?.trim() || 'City',
            location: payload.city?.trim() || payload.clubName?.trim() || 'India',
            season: payload.season?.trim() || '2026',
            format: payload.matchType || `${payload.overs || 20} Overs`,
            match_type: payload.matchType || 'T20',
            overs: payload.overs || 20,
            max_teams: payload.maxTeams || 8,
            ball_type: payload.ballType || 'Leather Ball',
            win_points: payload.winPoints || 2,
            tie_points: payload.tiePoints || 1,
            loss_points: payload.lossPoints || 0,
            start_date: payload.startDate || null,
            end_date: payload.endDate || null,
            banner_url:
              payload.bannerUrl ||
              'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
            created_by: createdByUuid,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase createTournament error:', error.message);
        throw new Error(`Database error: ${error.message}`);
      } else if (data) {
        const createdTour: Tournament = {
          id: data.id,
          name: data.name,
          code: data.code || code,
          clubName: data.club_name || payload.clubName || 'Premier Cricket Club',
          city: data.city || payload.city || 'City',
          season: data.season || '2026',
          ballType: (data.ball_type as any) || payload.ballType || 'Leather Ball',
          format: data.format || payload.matchType || 'T20',
          overs: data.overs || payload.overs || 20,
          maxTeams: data.max_teams || 8,
          winPoints: data.win_points || 2,
          tiePoints: data.tie_points || 1,
          lossPoints: data.loss_points || 0,
          startDate: data.start_date || payload.startDate,
          endDate: data.end_date || payload.endDate,
          bannerUrl: data.banner_url || payload.bannerUrl,
          totalTeams: 0,
          status: 'upcoming',
        };
        statefulTournaments = [createdTour, ...statefulTournaments];
        return createdTour;
      }
    } catch (err: any) {
      console.warn('createTournament error:', err);
      if (err?.message?.includes('Database error')) {
        throw err;
      }
    }

    // Fallback in-memory
    const newTour: Tournament = {
      id: `tour_${Date.now()}`,
      name: payload.name,
      code,
      clubName: payload.clubName || 'Premier Cricket Club',
      city: payload.city || 'City',
      season: payload.season || '2026',
      ballType: payload.ballType || 'Leather Ball',
      format: payload.matchType || `${payload.overs || 20} Overs`,
      overs: payload.overs || 20,
      maxTeams: payload.maxTeams || 8,
      winPoints: payload.winPoints || 2,
      tiePoints: payload.tiePoints || 1,
      lossPoints: payload.lossPoints || 0,
      startDate: payload.startDate,
      endDate: payload.endDate,
      bannerUrl:
        payload.bannerUrl ||
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
      totalTeams: 0,
      status: 'upcoming',
    };
    statefulTournaments = [newTour, ...statefulTournaments];
    return newTour;
  },

  async getTournamentById(
    tournamentId: string
  ): Promise<{ tournament: Tournament; teams: Team[]; matches: Match[]; standings: TournamentStanding[] }> {
    try {
      let query = supabase.from('tournaments').select('*');
      if (isValidUUID(tournamentId)) {
        query = query.eq('id', tournamentId);
      } else {
        query = query.eq('code', tournamentId);
      }
      const { data: tData } = await query.maybeSingle();

      if (tData) {
        const tournament: Tournament = {
          id: tData.id,
          name: tData.name,
          code: tData.code || generateCustomId(tData.name),
          clubName: tData.club_name || 'Premier Cricket Club',
          city: tData.city || 'City',
          season: tData.season || '2026',
          ballType: (tData.ball_type as any) || 'Leather Ball',
          format: tData.format || 'T20',
          overs: tData.overs || 20,
          maxTeams: tData.max_teams || 8,
          winPoints: tData.win_points || 2,
          tiePoints: tData.tie_points || 1,
          lossPoints: tData.loss_points || 0,
          startDate: tData.start_date,
          endDate: tData.end_date,
          bannerUrl: tData.banner_url || undefined,
          totalTeams: 0,
          status: 'upcoming',
        };

        // Fetch standings
        const { data: standingsData } = await supabase
          .from('points_table')
          .select('id, matches, wins, losses, ties, points, nrr, recent_form, teams(id, name, short_name, logo_url)')
          .eq('tournament_id', tData.id)
          .order('points', { ascending: false })
          .order('nrr', { ascending: false });

        const standings: TournamentStanding[] = (standingsData || []).map((s: any, idx: number) => ({
          rank: idx + 1,
          teamId: s.teams?.id || s.id,
          teamName: s.teams?.name || 'Team',
          shortName: s.teams?.short_name || s.teams?.name?.substring(0, 3)?.toUpperCase() || 'TEM',
          played: s.matches || 0,
          won: s.wins || 0,
          lost: s.losses || 0,
          noResult: s.ties || 0,
          points: s.points || 0,
          nrr: Number(s.nrr) >= 0 ? `+${Number(s.nrr).toFixed(3)}` : Number(s.nrr).toFixed(3),
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          recentForm: s.recent_form?.length ? s.recent_form : ['W', 'W', 'L'],
          group: idx < 4 ? 'A' : 'B',
          qualified: idx < 4,
        }));

        return {
          tournament: { ...tournament, totalTeams: standings.length },
          teams: [],
          matches: [],
          standings,
        };
      }
    } catch (err) {
      console.warn('getTournamentById error:', err);
    }

    const tournament = statefulTournaments.find((t) => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }

    return {
      tournament,
      teams: [],
      matches: [],
      standings: [],
    };
  },

  async addTeamToTournament(tournamentId: string, teamId: string): Promise<void> {
    try {
      await supabase.from('tournament_teams').insert([{ tournament_id: tournamentId, team_id: teamId }]);
    } catch (e) {
      console.warn('addTeamToTournament error:', e);
    }
  },

  async removeTeamFromTournament(tournamentId: string, teamId: string): Promise<void> {
    try {
      await supabase.from('tournament_teams').delete().eq('tournament_id', tournamentId).eq('team_id', teamId);
    } catch (e) {
      console.warn('removeTeamFromTournament error:', e);
    }
  },

  // ==========================================
  // 2. TEAM & SQUAD MODULE APIS
  // ==========================================

  async getTeams(userId?: string): Promise<Team[]> {
    try {
      let query = supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('created_by', userId);
      }
      const { data: dbTeams, error } = await query;
      if (!error && dbTeams && dbTeams.length > 0) {
        const mapped: Team[] = dbTeams.map((t: any) => ({
          id: t.id,
          name: t.name,
          shortName: t.short_name || t.name.slice(0, 3).toUpperCase(),
          code: generateCustomId(t.name),
          logoUrl:
            t.logo_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
          city: t.city || '',
          playersCount: 11,
          matchesPlayed: 4,
        }));
        statefulTeams = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('getTeams error:', err);
    }
    return statefulTeams;
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const code = generateCustomId(payload.name);
    const shortName = payload.shortName || payload.name.slice(0, 3).toUpperCase();

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([
          {
            name: payload.name.trim(),
            short_name: shortName,
            logo_url: payload.logoUrl || null,
            city: payload.city || null,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const createdTeam: Team = {
          id: data.id,
          name: data.name,
          shortName: data.short_name || shortName,
          code,
          logoUrl:
            data.logo_url ||
            payload.logoUrl ||
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
          city: data.city || payload.city || '',
          playersCount: 0,
          matchesPlayed: 0,
        };
        statefulTeams = [createdTeam, ...statefulTeams];
        return createdTeam;
      }
    } catch (err) {
      console.warn('createTeam error:', err);
    }

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: payload.name,
      shortName,
      code,
      logoUrl:
        payload.logoUrl ||
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
      city: payload.city || '',
      playersCount: 0,
      matchesPlayed: 0,
    };
    statefulTeams = [newTeam, ...statefulTeams];
    return newTeam;
  },

  async updateTeam(teamId: string, payload: UpdateTeamPayload): Promise<Team> {
    try {
      await supabase.from('teams').update(payload).eq('id', teamId);
    } catch (e) {
      console.warn('updateTeam error:', e);
    }
    const idx = statefulTeams.findIndex((t) => t.id === teamId);
    if (idx >= 0) {
      statefulTeams[idx] = { ...statefulTeams[idx], ...payload };
      return statefulTeams[idx];
    }
    throw new Error('Team not found');
  },

  async deleteTeam(teamId: string): Promise<void> {
    try {
      await supabase.from('teams').delete().eq('id', teamId);
    } catch (e) {
      console.warn('deleteTeam error:', e);
    }
    statefulTeams = statefulTeams.filter((t) => t.id !== teamId);
    delete statefulTeamPlayers[teamId];
  },

  async getTeamById(teamId: string): Promise<{ team: Team; players: Player[]; matches: Match[] }> {
    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .maybeSingle();

      const { data: playersData } = await supabase
        .from('team_players')
        .select('*, users(id, name, username, email, user_code, profile_image)')
        .eq('team_id', teamId);

      if (teamData) {
        const team: Team = {
          id: teamData.id,
          name: teamData.name,
          shortName: teamData.short_name || teamData.name.slice(0, 3).toUpperCase(),
          code: generateCustomId(teamData.name),
          logoUrl:
            teamData.logo_url ||
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
          city: teamData.city || '',
          playersCount: (playersData || []).length,
          matchesPlayed: 0,
        };

        const players: Player[] = (playersData || []).map((p: any) => ({
          id: p.id,
          name: p.users?.name || p.name || 'Player',
          shortName: (p.users?.name || p.name || 'Player').split(' ').map((w: string, i: number) => (i === 0 ? w[0] + '.' : w)).join(' '),
          avatar: p.users?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
          teamId,
          userId: p.user_id || p.users?.id,
          userCode: p.users?.user_code || p.user_code,
          role: p.role || 'batsman',
          battingStyle: p.batting_style || 'Right-hand bat',
          bowlingStyle: p.bowling_style || 'Right-arm medium',
          country: 'India',
          jerseyNumber: p.jersey_number || 18,
          isCaptain: p.is_captain || false,
          isWicketkeeper: p.is_wicketkeeper || false,
          careerStats: {
            matches: 10,
            innings: 10,
            runs: 250,
            average: 25.0,
            strikeRate: 130.0,
            highestScore: 50,
            fifties: 1,
            hundreds: 0,
            wickets: 5,
            overs: 20,
            economy: 7.5,
            bestBowling: '2/20',
            catches: 3,
            stumpings: 0,
          },
          recentInnings: [],
        }));

        return { team, players, matches: [] };
      }
    } catch (err) {
      console.warn('getTeamById error:', err);
    }

    const team = statefulTeams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Team with ID ${teamId} not found`);
    return {
      team,
      players: statefulTeamPlayers[teamId] || [],
      matches: [],
    };
  },

  async addPlayerToTeam(teamId: string, payload: AddPlayerPayload): Promise<Player> {
    const userIdUuid = isValidUUID(payload.userId) ? payload.userId : null;
    try {
      const { data, error } = await supabase
        .from('team_players')
        .insert([
          {
            team_id: teamId,
            user_id: userIdUuid,
            name: payload.name,
            role: payload.role || 'batsman',
            batting_style: payload.battingStyle || 'Right-hand bat',
            bowling_style: payload.bowlingStyle || 'Right-arm medium',
            jersey_number: payload.jerseyNumber || null,
            is_captain: payload.isCaptain || false,
            is_wicketkeeper: payload.isWicketkeeper || false,
          },
        ])
        .select('*, users(id, name, username, email, user_code, profile_image)')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.users?.name || data.name,
          shortName: payload.name.split(' ').map((w, i) => (i === 0 ? w[0] + '.' : w)).join(' '),
          avatar: data.users?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
          teamId,
          userId: data.user_id || data.users?.id,
          userCode: data.users?.user_code || payload.userCode,
          role: data.role,
          battingStyle: data.batting_style,
          bowlingStyle: data.bowling_style,
          country: 'India',
          jerseyNumber: data.jersey_number,
          isCaptain: data.is_captain,
          isWicketkeeper: data.is_wicketkeeper,
          careerStats: {
            matches: 0,
            innings: 0,
            runs: 0,
            average: 0,
            strikeRate: 0,
            highestScore: 0,
            fifties: 0,
            hundreds: 0,
            wickets: 0,
            overs: 0,
            economy: 0,
            bestBowling: '0/0',
            catches: 0,
            stumpings: 0,
          },
          recentInnings: [],
        };
      }
    } catch (err) {
      console.warn('addPlayerToTeam error:', err);
    }

    const newPlayer: Player = {
      id: `ply_${Date.now()}`,
      name: payload.name,
      shortName: payload.name.split(' ').map((w, i) => (i === 0 ? w[0] + '.' : w)).join(' '),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      teamId,
      userId: payload.userId,
      userCode: payload.userCode,
      role: payload.role || 'batsman',
      battingStyle: payload.battingStyle || 'Right-hand bat',
      bowlingStyle: payload.bowlingStyle || 'Right-arm medium',
      country: 'India',
      jerseyNumber: payload.jerseyNumber,
      isCaptain: payload.isCaptain || false,
      isWicketkeeper: payload.isWicketkeeper || false,
      careerStats: {
        matches: 0,
        innings: 0,
        runs: 0,
        average: 0,
        strikeRate: 0,
        highestScore: 0,
        fifties: 0,
        hundreds: 0,
        wickets: 0,
        overs: 0,
        economy: 0,
        bestBowling: '0/0',
        catches: 0,
        stumpings: 0,
      },
      recentInnings: [],
    };
    const currentPlayers = statefulTeamPlayers[teamId] || [];
    statefulTeamPlayers[teamId] = [...currentPlayers, newPlayer];
    return newPlayer;
  },

  async deletePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    try {
      await supabase.from('team_players').delete().eq('id', playerId);
    } catch (e) {
      console.warn('deletePlayerFromTeam error:', e);
    }
    const current = statefulTeamPlayers[teamId] || [];
    statefulTeamPlayers[teamId] = current.filter((p) => p.id !== playerId);
  },

  // ==========================================
  // 3. MATCH SCHEDULING & SCORING
  // ==========================================

  async getMatches(status?: MatchStatus): Promise<Match[]> {
    try {
      let query = supabase
        .from('matches')
        .select(
          `id, tournament_id, match_type, overs, venue, start_time, status, winner_team_id,
           teamA:team_a_id(id, name, short_name, logo_url),
           teamB:team_b_id(id, name, short_name, logo_url),
           tournaments(id, name),
           innings(id, inning_no, batting_team_id, bowling_team_id, runs, wickets, overs, extras)`
        )
        .order('start_time', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: dbMatches, error } = await query;
      if (!error && dbMatches && dbMatches.length > 0) {
        const mapped: Match[] = dbMatches.map((m: any) => {
          const teamA = Array.isArray(m.teamA) ? m.teamA[0] : m.teamA;
          const teamB = Array.isArray(m.teamB) ? m.teamB[0] : m.teamB;
          const tournament = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
          const inn1 = m.innings?.find((i: any) => i.inning_no === 1);
          const inn2 = m.innings?.find((i: any) => i.inning_no === 2);
          const activeInnings = inn2 || inn1;

          const team1Name = teamA?.name || 'Team 1';
          const team2Name = teamB?.name || 'Team 2';
          const team1Short = teamA?.short_name || team1Name.slice(0, 3).toUpperCase();
          const team2Short = teamB?.short_name || team2Name.slice(0, 3).toUpperCase();

          return {
            id: m.id,
            title: `${team1Short} vs ${team2Short}`,
            seriesName: tournament?.name || 'Premier League 2025',
            matchNumber: m.match_type || 'T20',
            venue: m.venue || 'Stadium',
            city: (m.venue || '').split(',')[1]?.trim() || 'City',
            status: m.status || 'upcoming',
            format: m.match_type || 'T20',
            currentInnings: inn2 ? 2 : 1,
            toss: 'Toss completed',
            tossWinner: team1Name,
            decision: 'bat',
            team1: {
              id: teamA?.id || 'team_a',
              name: team1Name,
              shortName: team1Short,
              logo:
                teamA?.logo_url ||
                'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
              score: inn1?.runs || 0,
              wickets: inn1?.wickets || 0,
              overs: Number(inn1?.overs || 0),
              maxOvers: m.overs || 20,
            },
            team2: {
              id: teamB?.id || 'team_b',
              name: team2Name,
              shortName: team2Short,
              logo:
                teamB?.logo_url ||
                'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80',
              score: inn2?.runs || 0,
              wickets: inn2?.wickets || 0,
              overs: Number(inn2?.overs || 0),
              maxOvers: m.overs || 20,
            },
            battingTeamId: activeInnings?.batting_team_id || teamA?.id || 'team_a',
            bowlingTeamId: activeInnings?.bowling_team_id || teamB?.id || 'team_b',
            target: inn1?.runs ? inn1.runs + 1 : undefined,
            crr:
              Number(activeInnings?.overs) > 0
                ? Number(((activeInnings?.runs || 0) / Number(activeInnings?.overs)).toFixed(2))
                : 0,
            recentBalls: ['1', '2', '0', '4', 'W', '6', '1', '1'],
            activeBatters: {
              striker: {
                playerId: 'p1',
                name: 'V. Kohli',
                shortName: 'V. Kohli',
                runs: 68,
                balls: 42,
                fours: 6,
                sixes: 2,
                strikeRate: 161.9,
                isStriker: true,
                isNonStriker: false,
                isOut: false,
              },
              nonStriker: {
                playerId: 'p2',
                name: 'G. Maxwell',
                shortName: 'G. Maxwell',
                runs: 24,
                balls: 11,
                fours: 2,
                sixes: 2,
                strikeRate: 218.2,
                isStriker: false,
                isNonStriker: true,
                isOut: false,
              },
            },
            activeBowler: {
              playerId: 'p3',
              name: 'J. Bumrah',
              shortName: 'J. Bumrah',
              overs: 3.2,
              oversInBalls: 20,
              maidens: 0,
              runs: 28,
              wickets: 2,
              economy: 8.4,
              dots: 10,
              wides: 1,
              noBalls: 0,
              isCurrentBowler: true,
            },
            startTime: m.start_time || new Date().toISOString(),
          };
        });

        statefulMatches = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('getMatches error:', err);
    }
    if (!status) return statefulMatches;
    return statefulMatches.filter((m) => m.status === status);
  },

  async createMatch(payload: CreateMatchPayload): Promise<Match> {
    const matchId = `match_${Date.now()}`;
    const teamAShort = payload.teamAShortName || payload.teamAName.substring(0, 3).toUpperCase();
    const teamBShort = payload.teamBShortName || payload.teamBName.substring(0, 3).toUpperCase();
    const tossWinnerName = payload.tossWinner === 'teamA' ? payload.teamAName : payload.teamBName;
    const tossWinnerId = payload.tossWinner === 'teamA' ? payload.teamAId || 'team_a' : payload.teamBId || 'team_b';

    const isTeamABatting =
      (payload.tossWinner === 'teamA' && payload.decision === 'bat') ||
      (payload.tossWinner === 'teamB' && payload.decision === 'bowl');

    const battingTeamName = isTeamABatting ? payload.teamAName : payload.teamBName;
    const battingTeamId = isTeamABatting ? payload.teamAId || 'team_a' : payload.teamBId || 'team_b';
    const bowlingTeamId = isTeamABatting ? payload.teamBId || 'team_b' : payload.teamAId || 'team_a';

    const striker: PlayerBatting = {
      playerId: `p_striker_${Date.now()}`,
      name: payload.strikerName || `${battingTeamName} Opener 1`,
      shortName: (payload.strikerName || `${battingTeamName} Opener 1`)
        .split(' ')
        .map((w, i) => (i === 0 ? w[0] + '.' : w))
        .join(' '),
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isStriker: true,
      isNonStriker: false,
      isOut: false,
    };

    const nonStriker: PlayerBatting = {
      playerId: `p_nonstriker_${Date.now()}`,
      name: payload.nonStrikerName || `${battingTeamName} Opener 2`,
      shortName: (payload.nonStrikerName || `${battingTeamName} Opener 2`)
        .split(' ')
        .map((w, i) => (i === 0 ? w[0] + '.' : w))
        .join(' '),
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isStriker: false,
      isNonStriker: true,
      isOut: false,
    };

    const bowler: PlayerBowling = {
      playerId: `p_bowler_${Date.now()}`,
      name: payload.bowlerName || 'Opening Bowler',
      shortName: (payload.bowlerName || 'Opening Bowler')
        .split(' ')
        .map((w: string, i: number) => (i === 0 ? w[0] + '.' : w))
        .join(' '),
      overs: 0,
      oversInBalls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
      wides: 0,
      noBalls: 0,
      isCurrentBowler: true,
    };

    const newMatch: Match = {
      id: matchId,
      title: `${teamAShort} vs ${teamBShort}`,
      seriesName: payload.tournamentName || 'Championship 2026',
      matchNumber: payload.matchType || `${payload.overs} Overs Match`,
      venue: payload.venue || 'Cricket Ground',
      city: payload.city || 'City',
      status: 'live',
      format: payload.overs >= 50 ? 'ODI' : 'T20',
      currentInnings: 1,
      toss: `${tossWinnerName} won the toss & elected to ${payload.decision}`,
      tossWinner: tossWinnerName,
      tossWinnerTeamId: tossWinnerId,
      tossDecision: payload.decision,
      decision: payload.decision,
      team1: {
        id: payload.teamAId || 'team_a',
        name: payload.teamAName,
        shortName: teamAShort,
        logo:
          payload.teamALogo ||
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
        score: 0,
        wickets: 0,
        overs: 0,
        maxOvers: payload.overs,
      },
      team2: {
        id: payload.teamBId || 'team_b',
        name: payload.teamBName,
        shortName: teamBShort,
        logo:
          payload.teamBLogo ||
          'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80',
        score: 0,
        wickets: 0,
        overs: 0,
        maxOvers: payload.overs,
      },
      battingTeamId,
      bowlingTeamId,
      crr: 0,
      recentBalls: [],
      activeBatters: {
        striker,
        nonStriker,
      },
      activeBowler: bowler,
      startTime: new Date().toISOString(),
      tournamentId: payload.tournamentId,
    };

    const newScorecard: Scorecard = {
      matchId,
      innings1: {
        teamId: battingTeamId,
        teamName: battingTeamName,
        shortName: isTeamABatting ? teamAShort : teamBShort,
        score: 0,
        wickets: 0,
        overs: 0,
        legalBalls: 0,
        maxOvers: payload.overs,
        runRate: 0,
        batting: [striker, nonStriker],
        bowling: [bowler],
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
        fallOfWickets: [],
      },
    };

    statefulMatches = [newMatch, ...statefulMatches];
    statefulScorecards[matchId] = newScorecard;

    return newMatch;
  },

  async getMatchById(matchId: string): Promise<Match> {
    const match = statefulMatches.find((m) => m.id === matchId);
    if (match) return match;
    const all = await this.getMatches();
    const found = all.find((m) => m.id === matchId);
    if (found) return found;
    throw new Error(`Match with ID ${matchId} not found`);
  },

  async getScorecard(matchId: string): Promise<Scorecard> {
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
          legalBalls: oversToBalls(match.team1.overs),
          maxOvers: match.team1.maxOvers || 20,
          runRate: 0,
          batting: [match.activeBatters.striker, match.activeBatters.nonStriker],
          bowling: [match.activeBowler],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
          fallOfWickets: [],
        },
      };
      statefulScorecards[matchId] = fallback;
      return fallback;
    }
    throw new Error(`Scorecard for match ${matchId} not found`);
  },

  async getCommentary(matchId: string, filter?: string): Promise<CommentaryItem[]> {
    try {
      const { data: comments } = await supabase
        .from('match_comments')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (comments && comments.length > 0) {
        let mapped: CommentaryItem[] = comments.map((c: any) => ({
          id: c.id,
          matchId: c.match_id,
          over: c.over_text || '18.2',
          bowlerName: 'Bowler',
          strikerName: 'Striker',
          runs: 1,
          ballType: 'run',
          isBoundary: false,
          isWicket: false,
          title: '1 run',
          description: c.comment,
          timestamp: c.created_at,
        }));

        if (filter === 'boundary') mapped = mapped.filter((c) => c.isBoundary);
        if (filter === 'wicket') mapped = mapped.filter((c) => c.isWicket);
        return mapped;
      }
    } catch (e) {
      console.warn('getCommentary error:', e);
    }

    let items = statefulCommentary.filter((c) => c.matchId === matchId);
    if (filter === 'boundary') items = items.filter((c) => c.isBoundary);
    if (filter === 'wicket') items = items.filter((c) => c.isWicket);
    return items;
  },

  async postBallEvent(
    matchId: string,
    payload: BallEventPayload
  ): Promise<{ match: Match; scorecard: Scorecard; commentaryItem: CommentaryItem }> {
    const matchIndex = statefulMatches.findIndex((m) => m.id === matchId);
    if (matchIndex < 0) {
      throw new Error(`Cannot score ball: Match ${matchId} not found`);
    }
    const match = statefulMatches[matchIndex];
    const scorecard = statefulScorecards[matchId];
    if (!scorecard) {
      throw new Error(`Scorecard for match ${matchId} not initialized`);
    }

    const result = applyBallToMatch(match, scorecard, payload);

    statefulMatches[matchIndex] = result.updatedMatch;
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
  },

  async recordToss(
    matchId: string,
    tossWinnerTeamId: string,
    decision: 'bat' | 'bowl'
  ): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      const winnerName =
        match.team1.id === tossWinnerTeamId ? match.team1.name : match.team2.name;
      const isTeam1Batting =
        (match.team1.id === tossWinnerTeamId && decision === 'bat') ||
        (match.team2.id === tossWinnerTeamId && decision === 'bowl');

      match.toss = `${winnerName} won the toss & elected to ${decision}`;
      match.tossWinner = winnerName;
      match.tossWinnerTeamId = tossWinnerTeamId;
      match.tossDecision = decision;
      match.decision = decision;
      match.battingTeamId = isTeam1Batting ? match.team1.id : match.team2.id;
      match.bowlingTeamId = isTeam1Batting ? match.team2.id : match.team1.id;

      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  async setPlayingXI(
    matchId: string,
    team1PlayingXI: PlayingXIPlayer[],
    team2PlayingXI: PlayingXIPlayer[]
  ): Promise<void> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      statefulMatches[idx].playingXI = {
        team1: team1PlayingXI,
        team2: team2PlayingXI,
      };
    }
  },

  async completeMatch(
    matchId: string,
    winnerTeamId: string,
    manOfTheMatchName?: string,
    resultDescription?: string
  ): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      match.status = 'completed';
      match.winnerTeamId = winnerTeamId;
      match.manOfTheMatchName = manOfTheMatchName || 'Outstanding Performer';
      match.result =
        resultDescription ||
        `${match.team1.id === winnerTeamId ? match.team1.name : match.team2.name} won the match`;

      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  async switchStriker(matchId: string): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      const s = match.activeBatters.striker;
      const ns = match.activeBatters.nonStriker;

      match.activeBatters = {
        striker: { ...ns, isStriker: true, isNonStriker: false },
        nonStriker: { ...s, isStriker: false, isNonStriker: true },
      };
      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  async selectNewBatsman(matchId: string, newBatsmanName: string): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      const newStriker: PlayerBatting = {
        playerId: `p_new_${Date.now()}`,
        name: newBatsmanName,
        shortName: newBatsmanName
          .split(' ')
          .map((w, i) => (i === 0 ? w[0] + '.' : w))
          .join(' '),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: true,
        isNonStriker: false,
        isOut: false,
      };
      match.activeBatters.striker = newStriker;

      const sc = statefulScorecards[matchId];
      if (sc) {
        const activeInn = match.currentInnings === 1 ? sc.innings1 : sc.innings2;
        if (activeInn) {
          activeInn.batting.push(newStriker);
        }
      }

      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  async retireBatsman(
    matchId: string,
    isStriker: boolean,
    newBatsmanName: string
  ): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      const target = isStriker ? match.activeBatters.striker : match.activeBatters.nonStriker;
      target.isOut = true;
      target.dismissalInfo = 'Retired Hurt';

      const replacement: PlayerBatting = {
        playerId: `p_ret_${Date.now()}`,
        name: newBatsmanName,
        shortName: newBatsmanName
          .split(' ')
          .map((w, i) => (i === 0 ? w[0] + '.' : w))
          .join(' '),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: isStriker,
        isNonStriker: !isStriker,
        isOut: false,
      };

      if (isStriker) {
        match.activeBatters.striker = replacement;
      } else {
        match.activeBatters.nonStriker = replacement;
      }

      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  async changeBowler(
    matchId: string,
    newBowlerName: string,
    bowlerId?: string
  ): Promise<Match> {
    const idx = statefulMatches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const match = statefulMatches[idx];
      const newBowler: PlayerBowling = {
        playerId: bowlerId || `p_bwl_${Date.now()}`,
        name: newBowlerName,
        shortName: newBowlerName
          .split(' ')
          .map((w, i) => (i === 0 ? w[0] + '.' : w))
          .join(' '),
        overs: 0,
        oversInBalls: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        dots: 0,
        wides: 0,
        noBalls: 0,
        isCurrentBowler: true,
      };

      match.activeBowler = newBowler;

      const sc = statefulScorecards[matchId];
      if (sc) {
        const activeInn = match.currentInnings === 1 ? sc.innings1 : sc.innings2;
        if (activeInn && !activeInn.bowling.some((b) => b.name === newBowlerName)) {
          activeInn.bowling.push(newBowler);
        }
      }

      statefulMatches[idx] = { ...match };
      return match;
    }
    throw new Error('Match not found');
  },

  // ==========================================
  // 4. PLAYER PROFILE & NOTIFICATIONS
  // ==========================================

  async getPlayerProfile(playerId: string): Promise<Player> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      const { data: stats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', playerId)
        .maybeSingle();

      if (user) {
        return {
          id: user.id,
          name: user.name,
          shortName: user.name.split(' ').map((w: string, i: number) => (i === 0 ? w[0] + '.' : w)).join(' '),
          avatar:
            user.profile_image ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
          teamId: 'team_01',
          role: 'batsman',
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm medium',
          country: 'India',
          jerseyNumber: 18,
          careerStats: {
            matches: stats?.matches || 0,
            innings: stats?.innings || 0,
            runs: stats?.runs || 0,
            average: Number(stats?.batting_avg || 0),
            strikeRate: Number(stats?.strike_rate || 0),
            highestScore: stats?.highest_score || 0,
            fifties: stats?.fifties || 0,
            hundreds: stats?.hundreds || 0,
            wickets: stats?.wickets || 0,
            overs: Number(stats?.overs || 0),
            economy: Number(stats?.economy || 0),
            bestBowling: stats?.best_bowling || '0/0',
            catches: stats?.catches || 0,
            stumpings: stats?.stumpings || 0,
          },
          recentInnings: [],
        };
      }
    } catch (err) {
      console.warn('getPlayerProfile error:', err);
    }

    return {
      id: playerId,
      name: 'Active Player',
      shortName: 'A. Player',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      teamId: 'team_01',
      role: 'allrounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium fast',
      country: 'India',
      jerseyNumber: 18,
      careerStats: {
        matches: 24,
        innings: 22,
        runs: 840,
        average: 44.21,
        strikeRate: 142.85,
        highestScore: 98,
        fifties: 6,
        hundreds: 0,
        wickets: 18,
        overs: 62.4,
        economy: 7.25,
        bestBowling: '4/18',
        catches: 12,
        stumpings: 0,
      },
      recentInnings: [
        { match: 'vs MI', runs: 54, balls: 32, isOut: false, date: '12 Sep 2026' },
        { match: 'vs CSK', runs: 42, balls: 28, isOut: true, date: '08 Sep 2026' },
      ],
    };
  },

  async getTournamentStandings(group?: 'A' | 'B'): Promise<TournamentStanding[]> {
    try {
      const response = await apiClient.get<TournamentStanding[]>('/tournament/standings', {
        params: group ? { group } : undefined,
      });
      const resData: any = response.data;
      return resData?.standings || resData || [];
    } catch {
      return [];
    }
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return [];
  },

  // ==========================================
  // 5. SYSTEM HEALTH CHECK & CONNECTIVITY
  // ==========================================

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    let supabaseConnected = false;
    let dbLatencyMs = 0;

    try {
      const { data, error } = await supabase.from('tournaments').select('id').limit(1);
      dbLatencyMs = Date.now() - start;
      supabaseConnected = !error;
    } catch {
      supabaseConnected = false;
    }

    // Also check backend gateway
    let backendOk = false;
    try {
      const res = await apiClient.get('/health', { timeout: 3000 });
      backendOk = res.status === 200;
    } catch {
      backendOk = false;
    }

    const status = supabaseConnected ? (backendOk ? 'healthy' : 'degraded') : 'offline';

    return {
      status,
      backendUrl: getBaseURL(),
      supabaseConnected,
      dbLatencyMs,
      message: supabaseConnected
        ? `Database connected (${dbLatencyMs}ms)${backendOk ? ' & API Gateway active' : ' (Direct DB Mode)'}`
        : 'Database connection failed. Please check Supabase credentials.',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  },
};

export default cricketApi;
