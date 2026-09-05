export interface DbUser {
  id: string;
  mobile: string;
  name: string;
  pin_hash: string;
  user_code: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface DbPlayerStats {
  id: string;
  user_id: string;
  matches: number;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  wickets: number;
  overs: number;
  runs_conceded: number;
  economy: number;
  catches: number;
  stumpings: number;
  created_at: string;
  updated_at: string;
}

export interface DbTeam {
  id: string;
  name: string;
  logo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeamPlayer {
  id: string;
  team_id: string;
  user_id: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  created_at: string;
}

export interface DbTournament {
  id: string;
  name: string;
  location?: string;
  match_type: string;
  overs: number;
  start_date?: string;
  end_date?: string;
  banner_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string;
  created_at: string;
}

export interface DbPointsTable {
  id: string;
  tournament_id: string;
  team_id: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  nrr: number;
  created_at: string;
  updated_at: string;
}

export interface DbMatch {
  id: string;
  tournament_id?: string;
  team_a_id: string;
  team_b_id: string;
  match_type: string;
  overs: number;
  venue?: string;
  start_time?: string;
  status: 'upcoming' | 'live' | 'completed';
  winner_team_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbInning {
  id: string;
  match_id: string;
  inning_no: 1 | 2;
  batting_team_id: string;
  runs: number;
  wickets: number;
  overs: number;
  extras: number;
  created_at: string;
}

export interface DbBallEvent {
  id: string;
  inning_id: string;
  over: number;
  ball: number;
  batsman_id?: string;
  bowler_id?: string;
  non_striker_id?: string;
  runs_scored: number;
  extra_type?: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | null;
  is_wicket: boolean;
  wicket_type?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | null;
  created_at: string;
}

export interface DbMatchComment {
  id: string;
  match_id: string;
  ball_event_id?: string;
  comment: string;
  created_at: string;
}

export interface BallInputPayload {
  matchId: string;
  inningNo: 1 | 2;
  over: number;
  ball: number;
  batsmanId?: string;
  bowlerId?: string;
  nonStrikerId?: string;
  runsScored: number;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | null;
  isWicket: boolean;
  wicketType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | null;
  commentaryText?: string;
}
