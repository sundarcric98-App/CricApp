import { Request, Response } from 'express';
import supabase from '../config/supabase';

export const createMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId, teamAId, teamBId, matchType, overs, venue, startTime, createdBy } =
      req.body;

    if (!teamAId || !teamBId) {
      res.status(400).json({ error: 'Both Team A and Team B IDs are required' });
      return;
    }

    const { data: match, error } = await supabase
      .from('matches')
      .insert([
        {
          tournament_id: tournamentId || null,
          team_a_id: teamAId,
          team_b_id: teamBId,
          match_type: matchType || 'T20',
          overs: overs || 20,
          venue: venue || 'Cricket Stadium',
          start_time: startTime || new Date().toISOString(),
          status: 'upcoming',
          created_by: createdBy || null,
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Initialize 1st Innings
    await supabase.from('innings').insert([
      {
        match_id: match.id,
        inning_no: 1,
        batting_team_id: teamAId,
      },
    ]);

    res.status(201).json({ match });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('matches')
      .select(
        `id, tournament_id, match_type, overs, venue, start_time, status, winner_team_id,
         teamA:team_a_id(id, name, logo_url),
         teamB:team_b_id(id, name, logo_url),
         tournaments(id, name),
         innings(id, inning_no, batting_team_id, runs, wickets, overs, extras)`
      )
      .order('start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data: matches, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Format matches for mobile client
    const formattedMatches = (matches || []).map((m: any) => {
      const teamA = Array.isArray(m.teamA) ? m.teamA[0] : m.teamA;
      const teamB = Array.isArray(m.teamB) ? m.teamB[0] : m.teamB;
      const tournament = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;

      const inn1 = m.innings?.find((i: any) => i.inning_no === 1);
      const inn2 = m.innings?.find((i: any) => i.inning_no === 2);
      const activeInnings = inn2 || inn1;

      return {
        id: m.id,
        title: `${teamA?.name?.substring(0, 3)?.toUpperCase() || 'T1'} vs ${teamB?.name?.substring(0, 3)?.toUpperCase() || 'T2'}`,
        seriesName: tournament?.name || 'Premier League 2025',
        matchNumber: m.match_type || 'Match',
        venue: m.venue || 'Stadium',
        city: (m.venue || '').split(',')[1]?.trim() || 'City',
        status: m.status,
        format: m.match_type || 'T20',
        currentInnings: inn2 ? 2 : 1,
        toss: 'Toss completed',
        tossWinner: teamA?.name || 'Team A',
        decision: 'bat',
        team1: {
          id: teamA?.id,
          name: teamA?.name,
          shortName: teamA?.name?.substring(0, 3)?.toUpperCase() || 'T1',
          logo: teamA?.logo_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
          score: inn1?.runs || 0,
          wickets: inn1?.wickets || 0,
          overs: Number(inn1?.overs || 0),
          maxOvers: m.overs || 20,
        },
        team2: {
          id: teamB?.id,
          name: teamB?.name,
          shortName: teamB?.name?.substring(0, 3)?.toUpperCase() || 'T2',
          logo: teamB?.logo_url || 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80',
          score: inn2?.runs || 0,
          wickets: inn2?.wickets || 0,
          overs: Number(inn2?.overs || 0),
          maxOvers: m.overs || 20,
        },
        battingTeamId: activeInnings?.batting_team_id || teamA?.id,
        bowlingTeamId: activeInnings?.batting_team_id === teamA?.id ? teamB?.id : teamA?.id,
        target: inn1?.runs ? inn1.runs + 1 : undefined,
        equation: inn2?.runs ? `Need ${Math.max(0, (inn1?.runs || 0) + 1 - inn2.runs)} runs` : undefined,
        crr: Number(activeInnings?.overs) > 0 ? Number(((activeInnings?.runs || 0) / Number(activeInnings?.overs)).toFixed(2)) : 0,
        recentBalls: ['1', '2', '0', '4', 'W', '6', '1', '1'],
        activeBatters: {
          striker: {
            playerId: 'p1',
            name: 'V. Kohli',
            shortName: 'V Kohli',
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
            shortName: 'G Maxwell',
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
          shortName: 'J Bumrah',
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
        startTime: m.start_time,
      };
    });

    res.json(formattedMatches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id;

    const { data: match, error } = await supabase
      .from('matches')
      .select(
        `id, tournament_id, match_type, overs, venue, start_time, status, winner_team_id,
         teamA:team_a_id(id, name, logo_url),
         teamB:team_b_id(id, name, logo_url),
         tournaments(id, name),
         innings(id, inning_no, batting_team_id, runs, wickets, overs, extras)`
      )
      .eq('id', matchId)
      .single();

    if (error || !match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const m: any = match;
    const teamA = Array.isArray(m.teamA) ? m.teamA[0] : m.teamA;
    const teamB = Array.isArray(m.teamB) ? m.teamB[0] : m.teamB;
    const tournament = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;

    const inn1 = m.innings?.find((i: any) => i.inning_no === 1);
    const inn2 = m.innings?.find((i: any) => i.inning_no === 2);
    const activeInnings = inn2 || inn1;

    const formattedMatch = {
      id: m.id,
      title: `${teamA?.name?.substring(0, 3)?.toUpperCase() || 'T1'} vs ${teamB?.name?.substring(0, 3)?.toUpperCase() || 'T2'}`,
      seriesName: tournament?.name || 'Premier League 2025',
      matchNumber: m.match_type || 'Match',
      venue: m.venue || 'Stadium',
      city: (m.venue || '').split(',')[1]?.trim() || 'City',
      status: m.status,
      format: m.match_type || 'T20',
      currentInnings: inn2 ? 2 : 1,
      toss: 'Toss completed',
      tossWinner: teamA?.name,
      decision: 'bat',
      team1: {
        id: teamA?.id,
        name: teamA?.name,
        shortName: teamA?.name?.substring(0, 3)?.toUpperCase() || 'T1',
        logo: teamA?.logo_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
        score: inn1?.runs || 0,
        wickets: inn1?.wickets || 0,
        overs: Number(inn1?.overs || 0),
        maxOvers: m.overs || 20,
      },
      team2: {
        id: teamB?.id,
        name: teamB?.name,
        shortName: teamB?.name?.substring(0, 3)?.toUpperCase() || 'T2',
        logo: teamB?.logo_url || 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80',
        score: inn2?.runs || 0,
        wickets: inn2?.wickets || 0,
        overs: Number(inn2?.overs || 0),
        maxOvers: m.overs || 20,
      },
      battingTeamId: activeInnings?.batting_team_id || teamA?.id,
      bowlingTeamId: activeInnings?.batting_team_id === teamA?.id ? teamB?.id : teamA?.id,
      target: inn1?.runs ? inn1.runs + 1 : undefined,
      equation: inn2?.runs ? `Need ${Math.max(0, (inn1?.runs || 0) + 1 - inn2.runs)} runs in 10 balls` : undefined,
      crr: Number(activeInnings?.overs) > 0 ? Number(((activeInnings?.runs || 0) / Number(activeInnings?.overs)).toFixed(2)) : 0,
      rrr: 12.5,
      recentBalls: ['1', '2', '0', '4', 'W', '6', '1', '1'],
      activeBatters: {
        striker: {
          playerId: 'p1',
          name: 'V. Kohli',
          shortName: 'V Kohli',
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
          shortName: 'G Maxwell',
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
        shortName: 'J Bumrah',
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
      startTime: match.start_time,
    };

    res.json(formattedMatch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getScorecard = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id;

    const { data: innings, error } = await supabase
      .from('innings')
      .select(
        `id, inning_no, batting_team_id, runs, wickets, overs, extras,
         teams(id, name, logo_url)`
      )
      .eq('match_id', matchId)
      .order('inning_no');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const inn1 = innings?.find((i: any) => i.inning_no === 1);
    const inn2 = innings?.find((i: any) => i.inning_no === 2);

    res.json({
      matchId,
      innings1: inn1 || {},
      innings2: inn2 || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCommentary = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id;

    const { data: comments, error } = await supabase
      .from('match_comments')
      .select('id, match_id, ball_event_id, comment, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const formatted = (comments || []).map((c: any) => ({
      id: c.id,
      matchId: c.match_id,
      over: '18.2',
      bowlerName: 'J. Bumrah',
      strikerName: 'V. Kohli',
      runs: 1,
      ballType: 'run',
      isBoundary: false,
      isWicket: false,
      title: '1 run',
      description: c.comment,
      timestamp: c.created_at,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
