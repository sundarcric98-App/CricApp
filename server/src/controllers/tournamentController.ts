import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { generateCustomId } from '../utils/idGenerator';

export const createTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      clubName,
      city,
      season,
      location,
      matchType,
      overs,
      startDate,
      endDate,
      ballType,
      bannerUrl,
      createdBy,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Tournament name is required' });
      return;
    }

    // Auto-generate tournament ID based on first 4 letters + 4 random digits (e.g. MADA8391)
    const tournamentCode = generateCustomId(name);

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert([
        {
          name,
          location: city || location || (clubName ? `${clubName}, ${city || ''}` : null),
          match_type: matchType || 'T20',
          overs: overs || 20,
          start_date: startDate || null,
          end_date: endDate || null,
          banner_url: bannerUrl || null,
          created_by: createdBy || null,
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      tournament: {
        ...tournament,
        code: tournamentCode,
        clubName: clubName || 'Cricket Club',
        city: city || 'City',
        season: season || '2026',
        ballType: ballType || 'Leather Ball',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTournaments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Enhance tournaments with codes and ball types for app display
    const enhancedTournaments = (tournaments || []).map((t: any) => ({
      ...t,
      code: generateCustomId(t.name),
      ballType: t.ball_type || 'Tennis Ball',
      season: t.season || '2026',
    }));

    res.json({ tournaments: enhancedTournaments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTournamentStandings = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id;

    // Fetch points table with team details
    const { data: standings, error } = await supabase
      .from('points_table')
      .select('id, matches, wins, losses, ties, points, nrr, teams(id, name, logo_url)')
      .eq('tournament_id', tournamentId)
      .order('points', { ascending: false })
      .order('nrr', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Format for app
    const formatted = (standings || []).map((s: any, idx: number) => ({
      rank: idx + 1,
      teamId: s.teams?.id || s.id,
      teamName: s.teams?.name || 'Team',
      shortName: (s.teams?.name || 'TEM').substring(0, 3).toUpperCase(),
      played: s.matches,
      won: s.wins,
      lost: s.losses,
      noResult: s.ties,
      points: s.points,
      nrr: Number(s.nrr) >= 0 ? `+${Number(s.nrr).toFixed(3)}` : Number(s.nrr).toFixed(3),
      recentForm: ['W', 'W', 'L', 'W'],
      group: idx < 4 ? 'A' : 'B',
      qualified: idx < 4,
    }));

    res.json({ standings: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
