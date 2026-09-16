-- ==============================================================================
-- CRICLIVEX CRICKET SCORING APP - COMPLETE POSTGRESQL / SUPABASE SCHEMA
-- Supports: Tournaments, Teams, Playing XI, Matches, Toss, Live Scoring Engine,
-- Ball-by-Ball Events, Scorecard, Points Table with Auto NRR & Player Stats
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- CLEAN RESET (Drops previous partial/outdated tables if re-running)
-- ==============================================================================
DROP TABLE IF EXISTS match_comments CASCADE;
DROP TABLE IF EXISTS ball_events CASCADE;
DROP TABLE IF EXISTS innings CASCADE;
DROP TABLE IF EXISTS match_playing_xi CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS points_table CASCADE;
DROP TABLE IF EXISTS tournament_teams CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    user_code TEXT UNIQUE NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLAYER STATS TABLE (Career Aggregates)
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matches INTEGER DEFAULT 0,
    innings INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    strike_rate NUMERIC(6, 2) DEFAULT 0.00,
    batting_avg NUMERIC(6, 2) DEFAULT 0.00,
    wickets INTEGER DEFAULT 0,
    overs NUMERIC(6, 1) DEFAULT 0.0,
    maidens INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    economy NUMERIC(5, 2) DEFAULT 0.00,
    best_bowling TEXT DEFAULT '0/0',
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_stats UNIQUE(user_id)
);

-- 3. TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    logo_url TEXT,
    city TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TEAM PLAYERS TABLE (Squad Roster)
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT DEFAULT 'batsman', -- 'batsman', 'bowler', 'allrounder', 'wicketkeeper'
    batting_style TEXT DEFAULT 'Right-hand bat', -- 'Right-hand bat', 'Left-hand bat'
    bowling_style TEXT DEFAULT 'Right-arm fast', -- 'Right-arm fast', 'Right-arm spin', 'Left-arm fast', 'Left-arm spin', 'None'
    jersey_number INTEGER,
    is_captain BOOLEAN DEFAULT false,
    is_wicketkeeper BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_team_player UNIQUE(team_id, user_id)
);

-- 5. TOURNAMENTS TABLE
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
    club_name TEXT,
    city TEXT,
    location TEXT,
    season TEXT DEFAULT '2026',
    format TEXT DEFAULT 'T20', -- 'T20', 'ODI', 'CUSTOM'
    match_type TEXT DEFAULT 'T20',
    overs INTEGER DEFAULT 20,
    max_teams INTEGER DEFAULT 8,
    ball_type TEXT DEFAULT 'Leather Ball', -- 'Leather Ball', 'Tennis Ball', 'Tape Ball'
    win_points INTEGER DEFAULT 2,
    tie_points INTEGER DEFAULT 1,
    loss_points INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    banner_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TOURNAMENT TEAMS TABLE (Participating Teams in Tournament)
CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    group_name TEXT DEFAULT 'A', -- 'A', 'B', etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tournament_team UNIQUE(tournament_id, team_id)
);

-- 7. POINTS TABLE (Standings with automated NRR calculation)
CREATE TABLE points_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    no_results INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    overs_faced NUMERIC(6, 1) DEFAULT 0.0,
    runs_conceded INTEGER DEFAULT 0,
    overs_bowled NUMERIC(6, 1) DEFAULT 0.0,
    nrr NUMERIC(7, 3) DEFAULT 0.000,
    recent_form TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tournament_points UNIQUE(tournament_id, team_id)
);

-- 8. MATCHES TABLE
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    match_type TEXT DEFAULT 'T20',
    overs INTEGER DEFAULT 20,
    venue TEXT,
    city TEXT,
    start_time TIMESTAMPTZ,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'live', 'completed', 'abandoned'
    
    -- Toss Information
    toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    toss_decision TEXT, -- 'bat', 'bowl'
    
    -- Results & Awards
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    result_description TEXT,
    man_of_the_match_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MATCH PLAYING XI TABLE
CREATE TABLE match_playing_xi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL, -- references team_players or users
    player_name TEXT NOT NULL,
    role TEXT DEFAULT 'batsman',
    is_captain BOOLEAN DEFAULT false,
    is_wicketkeeper BOOLEAN DEFAULT false,
    batting_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_match_team_player UNIQUE(match_id, team_id, player_id)
);

-- 10. INNINGS TABLE
CREATE TABLE innings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    inning_no INTEGER NOT NULL CHECK (inning_no IN (1, 2)),
    batting_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    bowling_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    overs NUMERIC(5, 1) DEFAULT 0.0,
    extras INTEGER DEFAULT 0,
    wides INTEGER DEFAULT 0,
    no_balls INTEGER DEFAULT 0,
    byes INTEGER DEFAULT 0,
    leg_byes INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_match_inning UNIQUE(match_id, inning_no)
);

-- 11. BALL EVENTS TABLE (Detailed Ball-by-Ball)
CREATE TABLE ball_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inning_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
    over INTEGER NOT NULL,
    ball INTEGER NOT NULL,
    batsman_id UUID,
    bowler_id UUID,
    non_striker_id UUID,
    runs_scored INTEGER DEFAULT 0,
    extra_type TEXT, -- 'wide', 'no_ball', 'bye', 'leg_bye', null
    extra_runs INTEGER DEFAULT 0,
    is_wicket BOOLEAN DEFAULT false,
    wicket_type TEXT, -- 'bowled', 'caught', 'run_out', 'lbw', 'stumped', 'hit_wicket', 'retired_hurt', null
    dismissed_player_id UUID,
    fielder_id UUID,
    is_boundary_four BOOLEAN DEFAULT false,
    is_boundary_six BOOLEAN DEFAULT false,
    commentary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. MATCH COMMENTS (COMMENTARY TIMELINE)
CREATE TABLE match_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    ball_event_id UUID REFERENCES ball_events(id) ON DELETE CASCADE,
    over_text TEXT DEFAULT '0.0', -- e.g. "12.3"
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_code ON tournaments(code);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_points_table_tournament_id ON points_table(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_playing_xi_match_id ON match_playing_xi(match_id);
CREATE INDEX IF NOT EXISTS idx_innings_match_id ON innings(match_id);
CREATE INDEX IF NOT EXISTS idx_ball_events_inning_id ON ball_events(inning_id);
CREATE INDEX IF NOT EXISTS idx_ball_events_over_ball ON ball_events(inning_id, over, ball);
CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON match_comments(match_id);

-- ==============================================================================
-- AUTOMATED NRR & UPDATED_AT PROCEDURES
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE OR REPLACE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE OR REPLACE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE OR REPLACE TRIGGER update_points_table_updated_at BEFORE UPDATE ON points_table FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE OR REPLACE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate Net Run Rate (NRR):
-- NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
CREATE OR REPLACE FUNCTION calculate_nrr(
    p_runs_scored NUMERIC,
    p_overs_faced NUMERIC,
    p_runs_conceded NUMERIC,
    p_overs_bowled NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_for_rate NUMERIC := 0.0;
    v_against_rate NUMERIC := 0.0;
    v_faced_decimal NUMERIC;
    v_bowled_decimal NUMERIC;
BEGIN
    -- Convert e.g. 19.3 overs to 19 + 3/6 = 19.5
    v_faced_decimal := FLOOR(p_overs_faced) + (p_overs_faced - FLOOR(p_overs_faced)) * 10 / 6;
    v_bowled_decimal := FLOOR(p_overs_bowled) + (p_overs_bowled - FLOOR(p_overs_bowled)) * 10 / 6;

    IF v_faced_decimal > 0 THEN
        v_for_rate := p_runs_scored / v_faced_decimal;
    END IF;

    IF v_bowled_decimal > 0 THEN
        v_against_rate := p_runs_conceded / v_bowled_decimal;
    END IF;

    RETURN ROUND(v_for_rate - v_against_rate, 3);
END;
$$ LANGUAGE plpgsql;

-- Enable Supabase Realtime for live match scoring tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches, innings, ball_events, match_comments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
