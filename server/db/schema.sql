-- ==============================================================================
-- CRICKET SCORING APP - SUPABASE POSTGRESQL SCHEMA
-- Matches the ER Diagram with 11 Tables, Foreign Keys, Indexes & Triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    user_code TEXT UNIQUE NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLAYER STATS TABLE
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matches INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    strike_rate NUMERIC(6, 2) DEFAULT 0.00,
    wickets INTEGER DEFAULT 0,
    overs NUMERIC(5, 1) DEFAULT 0.0,
    runs_conceded INTEGER DEFAULT 0,
    economy NUMERIC(5, 2) DEFAULT 0.00,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_stats UNIQUE(user_id)
);

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TEAM PLAYERS TABLE
CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'batsman', -- 'batsman', 'bowler', 'allrounder', 'wicketkeeper'
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_team_player UNIQUE(team_id, user_id)
);

-- 5. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    match_type TEXT DEFAULT 'T20',
    overs INTEGER DEFAULT 20,
    start_date DATE,
    end_date DATE,
    banner_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TOURNAMENT TEAMS TABLE
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tournament_team UNIQUE(tournament_id, team_id)
);

-- 7. POINTS TABLE
CREATE TABLE IF NOT EXISTS points_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    nrr NUMERIC(6, 3) DEFAULT 0.000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tournament_points UNIQUE(tournament_id, team_id)
);

-- 8. MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    match_type TEXT DEFAULT 'T20',
    overs INTEGER DEFAULT 20,
    venue TEXT,
    start_time TIMESTAMPTZ,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'live', 'completed'
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. INNINGS TABLE
CREATE TABLE IF NOT EXISTS innings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    inning_no INTEGER NOT NULL CHECK (inning_no IN (1, 2)),
    batting_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    overs NUMERIC(5, 1) DEFAULT 0.0,
    extras INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_match_inning UNIQUE(match_id, inning_no)
);

-- 10. BALL EVENTS TABLE
CREATE TABLE IF NOT EXISTS ball_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inning_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
    over INTEGER NOT NULL,
    ball INTEGER NOT NULL,
    batsman_id UUID REFERENCES users(id) ON DELETE SET NULL,
    bowler_id UUID REFERENCES users(id) ON DELETE SET NULL,
    non_striker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    runs_scored INTEGER DEFAULT 0,
    extra_type TEXT, -- 'wide', 'no_ball', 'bye', 'leg_bye', null
    is_wicket BOOLEAN DEFAULT false,
    wicket_type TEXT, -- 'bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', null
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. MATCH COMMENTS (COMMENTARY)
CREATE TABLE IF NOT EXISTS match_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    ball_event_id UUID REFERENCES ball_events(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_team_players_user_id ON team_players(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_points_table_tournament_id ON points_table(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_innings_match_id ON innings(match_id);
CREATE INDEX IF NOT EXISTS idx_ball_events_inning_id ON ball_events(inning_id);
CREATE INDEX IF NOT EXISTS idx_ball_events_over_ball ON ball_events(inning_id, over, ball);
CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON match_comments(match_id);

-- ==============================================================================
-- AUTOMATED UPDATED_AT TRIGGER FUNCTION
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
