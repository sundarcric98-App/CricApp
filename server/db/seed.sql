-- ==============================================================================
-- CRICLIVEX - SUPABASE SEED DATA
-- Sample data to test Users, Teams, Tournaments, Matches, Innings, Ball Events
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO users (id, mobile, name, pin_hash, user_code, profile_image)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '9876543210', 'Virat Kohli', '$2a$10$X87y1y3xM5dZpIeF7Xn0geF1t7a5E9kI8qO7.jE1kI8qO7', 'VK18', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80'),
    ('22222222-2222-2222-2222-222222222222', '9876543211', 'Rohit Sharma', '$2a$10$X87y1y3xM5dZpIeF7Xn0geF1t7a5E9kI8qO7.jE1kI8qO7', 'RS45', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80'),
    ('33333333-3333-3333-3333-333333333333', '9876543212', 'Jasprit Bumrah', '$2a$10$X87y1y3xM5dZpIeF7Xn0geF1t7a5E9kI8qO7.jE1kI8qO7', 'JB93', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80'),
    ('44444444-4444-4444-4444-444444444444', '9876543213', 'Glenn Maxwell', '$2a$10$X87y1y3xM5dZpIeF7Xn0geF1t7a5E9kI8qO7.jE1kI8qO7', 'GM32', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80'),
    ('55555555-5555-5555-5555-555555555555', '9876543214', 'Suryakumar Yadav', '$2a$10$X87y1y3xM5dZpIeF7Xn0geF1t7a5E9kI8qO7.jE1kI8qO7', 'SKY63', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&q=80')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PLAYER STATS
INSERT INTO player_stats (user_id, matches, runs, balls_faced, fours, sixes, strike_rate, wickets, overs, runs_conceded, economy, catches, stumpings)
VALUES
    ('11111111-1111-1111-1111-111111111111', 252, 8004, 6068, 704, 260, 131.90, 4, 28.4, 252, 8.80, 114, 0),
    ('22222222-2222-2222-2222-222222222222', 245, 6628, 5060, 599, 280, 130.98, 15, 68.2, 545, 7.98, 98, 0),
    ('33333333-3333-3333-3333-333333333333', 133, 69, 70, 6, 2, 98.57, 165, 510.0, 3723, 7.30, 24, 0),
    ('44444444-4444-4444-4444-444444444444', 134, 2771, 1765, 230, 158, 157.00, 37, 168.0, 1380, 8.21, 52, 0),
    ('55555555-5555-5555-5555-555555555555', 150, 3594, 2470, 378, 135, 145.50, 0, 0.0, 0, 0.00, 68, 0)
ON CONFLICT (user_id) DO NOTHING;

-- 3. SEED TEAMS
INSERT INTO teams (id, name, logo_url, created_by)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bengaluru Royals', 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80', '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mumbai Warriors', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80', '22222222-2222-2222-2222-222222222222'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Chennai Kings', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80', '11111111-1111-1111-1111-111111111111'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Kolkata Knights', 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED TEAM PLAYERS
INSERT INTO team_players (team_id, user_id, role)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'batsman'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'allrounder'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'batsman'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'bowler'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'batsman')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 5. SEED TOURNAMENTS
INSERT INTO tournaments (id, name, location, match_type, overs, start_date, end_date, banner_url, created_by)
VALUES
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'T20 Premier League 2025', 'India', 'T20', 20, '2025-04-01', '2025-05-30', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED TOURNAMENT TEAMS & POINTS TABLE
INSERT INTO tournament_teams (tournament_id, team_id)
VALUES
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
ON CONFLICT (tournament_id, team_id) DO NOTHING;

INSERT INTO points_table (tournament_id, team_id, matches, wins, losses, ties, points, nrr)
VALUES
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 14, 10, 4, 0, 20, 0.892),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 14, 9, 5, 0, 18, 0.640),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 14, 8, 5, 1, 17, 0.415),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 14, 8, 6, 0, 16, 0.320)
ON CONFLICT (tournament_id, team_id) DO NOTHING;

-- 7. SEED MATCHES
INSERT INTO matches (id, tournament_id, team_a_id, team_b_id, match_type, overs, venue, start_time, status, created_by)
VALUES
    ('m1111111-1111-1111-1111-111111111111', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'T20', 20, 'Wankhede Stadium, Mumbai', now(), 'live', '11111111-1111-1111-1111-111111111111'),
    ('m2222222-2222-2222-2222-222222222222', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'T20', 20, 'M. A. Chidambaram Stadium, Chennai', now() + interval '2 hours', 'upcoming', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED INNINGS (For live match m1111111-1111-1111-1111-111111111111)
INSERT INTO innings (id, match_id, inning_no, batting_team_id, runs, wickets, overs, extras)
VALUES
    ('i1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 1, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 178, 4, 20.0, 10),
    ('i2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 145, 3, 18.2, 8)
ON CONFLICT (match_id, inning_no) DO NOTHING;

-- 9. SEED BALL EVENTS
INSERT INTO ball_events (id, inning_id, over, ball, batsman_id, bowler_id, non_striker_id, runs_scored, extra_type, is_wicket, wicket_type)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'i2222222-2222-2222-2222-222222222222', 18, 1, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 1, null, false, null),
    ('b2222222-2222-2222-2222-222222222222', 'i2222222-2222-2222-2222-222222222222', 18, 2, '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1, null, false, null)
ON CONFLICT (id) DO NOTHING;

-- 10. SEED MATCH COMMENTS (COMMENTARY)
INSERT INTO match_comments (id, match_id, ball_event_id, comment)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Back of a length delivery angling in tightly, tapped deftly toward backward point. Quick single taken.'),
    ('c2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'Yorker on middle stump! Dug out safely to deep mid-wicket for a single. Rotates the strike cleanly.')
ON CONFLICT (id) DO NOTHING;
