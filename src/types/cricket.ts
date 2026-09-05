export type MatchStatus = 'live' | 'upcoming' | 'completed';
export type MatchFormat = 'T20' | 'ODI' | 'TEST';
export type PlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
export type BallType = 'dot' | 'run' | 'boundary4' | 'boundary6' | 'wicket' | 'wide' | 'noBall' | 'bye' | 'legBye';
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket';

export interface User {
  id: string;
  name: string;
  mobile: string;
  userCode: string; // e.g. SUND4821
  profileImage?: string;
  createdAt?: string;
}

export interface PlayerBatting {
  playerId: string;
  name: string;
  shortName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isStriker: boolean;
  isNonStriker: boolean;
  isOut: boolean;
  dismissalInfo?: string;
}

export interface PlayerBowling {
  playerId: string;
  name: string;
  shortName: string;
  overs: number; // e.g. 3.2
  oversInBalls: number; // e.g. 20
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number;
  wides: number;
  noBalls: number;
  isCurrentBowler: boolean;
}

export interface PlayerCareerStats {
  matches: number;
  runs: number;
  average: number;
  strikeRate: number;
  highestScore: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  economy: number;
  bestBowling: string;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
  teamId: string;
  role: PlayerRole;
  battingStyle: string;
  bowlingStyle: string;
  country: string;
  jerseyNumber?: number;
  careerStats: PlayerCareerStats;
  recentInnings: {
    match: string;
    runs: number;
    balls: number;
    isOut: boolean;
    date: string;
  }[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string; // e.g. WARR1092
  logoUrl?: string;
  city?: string;
  playersCount?: number;
  matchesPlayed?: number;
  createdBy?: string;
}

export interface Tournament {
  id: string;
  name: string;
  code: string; // e.g. MADA8391
  clubName?: string;
  city?: string;
  season?: string;
  ballType?: 'Leather Ball' | 'Tennis Ball' | string;
  startDate?: string;
  endDate?: string;
  bannerUrl?: string;
  winnerTeam?: string;
  totalTeams?: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  createdBy?: string;
}

export interface CreateTournamentPayload {
  name: string;
  clubName?: string;
  city?: string;
  season?: string;
  startDate?: string;
  endDate?: string;
  ballType: string;
  bannerUrl?: string;
  createdBy?: string;
}

export interface CreateTeamPayload {
  name: string;
  shortName?: string;
  city?: string;
  logoUrl?: string;
  createdBy?: string;
}

export interface TeamInnings {
  teamId: string;
  teamName: string;
  shortName: string;
  score: number;
  wickets: number;
  overs: number; // e.g. 18.2
  legalBalls: number; // e.g. 110
  maxOvers: number;
  runRate: number;
  batting: PlayerBatting[];
  bowling: PlayerBowling[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  fallOfWickets: {
    wicketNumber: number;
    score: number;
    over: number;
    playerName: string;
  }[];
}

export interface BallEvent {
  id: string;
  matchId: string;
  innings: 1 | 2;
  overNumber: number;
  ballInOver: number;
  displayOver: string;
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  nonStrikerName: string;
  bowlerId: string;
  bowlerName: string;
  runsScored: number;
  extraRuns: number;
  totalRuns: number;
  isLegal: boolean;
  ballType: BallType;
  isBoundary: boolean;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  dismissedPlayerName?: string;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  commentaryText: string;
  tag?: string;
  timestamp: string;
}

export interface CommentaryItem {
  id: string;
  matchId: string;
  over: string;
  bowlerName: string;
  strikerName: string;
  runs: number;
  ballType: BallType;
  isBoundary: boolean;
  isWicket: boolean;
  title: string;
  description: string;
  timestamp: string;
}

export interface Match {
  id: string;
  title: string;
  seriesName: string;
  matchNumber: string;
  venue: string;
  city: string;
  status: MatchStatus;
  format: MatchFormat;
  currentInnings: 1 | 2;
  toss: string;
  tossWinner: string;
  decision: 'bat' | 'bowl';
  team1: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
    wickets: number;
    overs: number;
    maxOvers: number;
  };
  team2: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
    wickets: number;
    overs: number;
    maxOvers: number;
  };
  battingTeamId: string;
  bowlingTeamId: string;
  target?: number;
  equation?: string;
  crr: number;
  rrr?: number;
  recentBalls: string[];
  activeBatters: {
    striker: PlayerBatting;
    nonStriker: PlayerBatting;
  };
  activeBowler: PlayerBowling;
  result?: string;
  startTime: string;
  tournamentGroup?: string;
}

export interface Scorecard {
  matchId: string;
  innings1: TeamInnings;
  innings2?: TeamInnings;
}

export interface TournamentStanding {
  rank: number;
  teamId: string;
  teamName: string;
  shortName: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  nrr: string;
  recentForm: ('W' | 'L' | 'N')[];
  group: 'A' | 'B';
  qualified: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'wicket' | 'boundary' | 'milestone' | 'match_status';
  matchId: string;
  timestamp: string;
  isRead: boolean;
}

export interface BallEventPayload {
  matchId: string;
  ballType: BallType;
  runs: number;
  isExtra?: boolean;
  extraType?: 'wide' | 'noBall' | 'bye' | 'legBye';
  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  commentary?: string;
}
