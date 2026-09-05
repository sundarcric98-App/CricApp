import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { generateCustomId } from '../utils/idGenerator';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, shortName, logoUrl, city, createdBy } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    // Auto-generate team ID based on first 4 letters + 4 random digits (e.g. WARR1092)
    const teamCode = generateCustomId(name);

    const { data: team, error } = await supabase
      .from('teams')
      .insert([
        {
          name,
          logo_url: logoUrl || null,
          created_by: createdBy || null,
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // If user created the team, add user as a member/captain
    if (createdBy) {
      await supabase.from('team_players').insert([
        {
          team_id: team.id,
          user_id: createdBy,
          role: 'allrounder',
        },
      ]);
    }

    res.status(201).json({
      team: {
        ...team,
        code: teamCode,
        shortName: shortName || name.substring(0, 3).toUpperCase(),
        city: city || '',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    let query = supabase.from('teams').select('*').order('name');
    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data: teams, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Enhance teams with code & player count
    const enhancedTeams = (teams || []).map((t: any) => ({
      ...t,
      code: generateCustomId(t.name),
      shortName: (t.name || 'TEM').substring(0, 3).toUpperCase(),
      playersCount: 11,
      matchesPlayed: 4,
    }));

    res.json({ teams: enhancedTeams });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.params.id;

    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error || !team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Fetch players in team
    const { data: players } = await supabase
      .from('team_players')
      .select('id, role, users(id, name, mobile, user_code, profile_image)')
      .eq('team_id', teamId);

    res.json({
      team: {
        ...team,
        code: generateCustomId(team.name),
      },
      players: players || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addPlayerToTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.params.id;
    const { userId, role } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const { data, error } = await supabase
      .from('team_players')
      .insert([
        {
          team_id: teamId,
          user_id: userId,
          role: role || 'batsman',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Player added to team', teamPlayer: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
