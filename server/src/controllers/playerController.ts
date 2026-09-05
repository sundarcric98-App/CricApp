import { Request, Response } from 'express';
import supabase from '../config/supabase';

export const getPlayerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.params.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, mobile, user_code, profile_image')
      .eq('id', playerId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', playerId)
      .single();

    const formattedPlayer = {
      id: user.id,
      name: user.name,
      shortName: user.name,
      avatar: user.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      teamId: 'team_blr',
      role: 'batsman',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      country: 'India',
      jerseyNumber: 18,
      careerStats: {
        matches: stats?.matches || 252,
        runs: stats?.runs || 8004,
        average: 38.6,
        strikeRate: stats?.strike_rate || 131.9,
        highestScore: 113,
        fifties: 55,
        hundreds: 8,
        wickets: stats?.wickets || 4,
        economy: stats?.economy || 8.8,
        bestBowling: '2/25',
      },
      recentInnings: [
        { match: 'vs MUM', runs: 68, balls: 42, isOut: false, date: '2025-05-24' },
        { match: 'vs CHE', runs: 47, balls: 29, isOut: true, date: '2025-05-18' },
        { match: 'vs DEL', runs: 92, balls: 54, isOut: false, date: '2025-05-12' },
      ],
    };

    res.json(formattedPlayer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
