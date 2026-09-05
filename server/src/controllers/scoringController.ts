import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { broadcastScoreUpdate, broadcastWicketAlert } from '../socket/socketHandler';
import { BallInputPayload } from '../types';

export const recordBallEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      matchId,
      inningNo = 2,
      over,
      ball,
      batsmanId,
      bowlerId,
      nonStrikerId,
      runsScored = 0,
      extraType = null,
      isWicket = false,
      wicketType = null,
      commentaryText,
    }: BallInputPayload = req.body;

    if (!matchId) {
      res.status(400).json({ error: 'matchId is required' });
      return;
    }

    // 1. Find or create the active Inning
    let { data: inning } = await supabase
      .from('innings')
      .select('*')
      .eq('match_id', matchId)
      .eq('inning_no', inningNo)
      .single();

    if (!inning) {
      const { data: newInning } = await supabase
        .from('innings')
        .insert([
          {
            match_id: matchId,
            inning_no: inningNo,
            batting_team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            runs: 0,
            wickets: 0,
            overs: 0,
          },
        ])
        .select()
        .single();
      inning = newInning;
    }

    // 2. Insert Ball Event
    const { data: ballEvent, error: ballError } = await supabase
      .from('ball_events')
      .insert([
        {
          inning_id: inning.id,
          over,
          ball,
          batsman_id: batsmanId || null,
          bowler_id: bowlerId || null,
          non_striker_id: nonStrikerId || null,
          runs_scored: runsScored,
          extra_type: extraType || null,
          is_wicket: isWicket,
          wicket_type: wicketType || null,
        },
      ])
      .select()
      .single();

    if (ballError) {
      res.status(500).json({ error: ballError.message });
      return;
    }

    // 3. Update Innings Score & Overs
    const extraRuns = extraType ? (runsScored > 0 ? runsScored : 1) : 0;
    const totalRuns = runsScored + extraRuns;
    const newTotalRuns = (inning.runs || 0) + totalRuns;
    const newWickets = isWicket ? (inning.wickets || 0) + 1 : inning.wickets || 0;

    const isLegal = extraType !== 'wide' && extraType !== 'no_ball';
    const [currentOverNum, currentBallNum] = (inning.overs || 0).toString().split('.').map(Number);
    let totalLegalBalls = (currentOverNum || 0) * 6 + (currentBallNum || 0);
    if (isLegal) totalLegalBalls += 1;
    const newOvers = Number(`${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`);

    await supabase
      .from('innings')
      .update({
        runs: newTotalRuns,
        wickets: newWickets,
        overs: newOvers,
        extras: (inning.extras || 0) + extraRuns,
      })
      .eq('id', inning.id);

    // 4. Insert Match Commentary Comment
    const commentDesc =
      commentaryText ||
      (isWicket
        ? `WICKET! Dismissal (${wicketType || 'out'}). Big breakthrough!`
        : runsScored === 6
        ? 'SIX! Dispatched over the boundary rope!'
        : runsScored === 4
        ? 'FOUR! Smashed cleanly through the gap!'
        : `${runsScored} run${runsScored > 1 ? 's' : ''} scored.`);

    await supabase.from('match_comments').insert([
      {
        match_id: matchId,
        ball_event_id: ballEvent.id,
        comment: commentDesc,
      },
    ]);

    // 5. Update Player Stats (Batsman & Bowler) if IDs provided
    if (batsmanId) {
      const { data: bStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', batsmanId)
        .single();

      if (bStats) {
        await supabase
          .from('player_stats')
          .update({
            runs: bStats.runs + runsScored,
            balls_faced: isLegal ? bStats.balls_faced + 1 : bStats.balls_faced,
            fours: runsScored === 4 ? bStats.fours + 1 : bStats.fours,
            sixes: runsScored === 6 ? bStats.sixes + 1 : bStats.sixes,
          })
          .eq('user_id', batsmanId);
      }
    }

    if (bowlerId) {
      const { data: bwStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', bowlerId)
        .single();

      if (bwStats) {
        await supabase
          .from('player_stats')
          .update({
            runs_conceded: bwStats.runs_conceded + totalRuns,
            wickets: isWicket ? bwStats.wickets + 1 : bwStats.wickets,
          })
          .eq('user_id', bowlerId);
      }
    }

    // 6. Broadcast Real-time update via Socket.io
    const socketPayload = {
      matchId,
      inningNo,
      runs: newTotalRuns,
      wickets: newWickets,
      overs: newOvers,
      ballEvent,
      commentary: {
        id: ballEvent.id,
        over: `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6 === 0 ? 6 : totalLegalBalls % 6}`,
        description: commentDesc,
      },
    };

    broadcastScoreUpdate(matchId, socketPayload);

    if (isWicket) {
      broadcastWicketAlert(matchId, {
        matchId,
        score: `${newTotalRuns}/${newWickets}`,
        over: newOvers,
      });
    }

    res.status(201).json({
      message: 'Ball recorded successfully',
      ballEvent,
      updatedInnings: {
        runs: newTotalRuns,
        wickets: newWickets,
        overs: newOvers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const undoLastBall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      res.status(400).json({ error: 'matchId is required' });
      return;
    }

    // Find latest ball event
    const { data: innings } = await supabase
      .from('innings')
      .select('id, runs, wickets, overs')
      .eq('match_id', matchId)
      .order('inning_no', { ascending: false })
      .limit(1)
      .single();

    if (!innings) {
      res.status(404).json({ error: 'No innings found for this match' });
      return;
    }

    const { data: latestBall } = await supabase
      .from('ball_events')
      .select('*')
      .eq('inning_id', innings.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestBall) {
      res.status(404).json({ error: 'No balls to undo in this innings' });
      return;
    }

    // Delete latest ball event
    await supabase.from('ball_events').delete().eq('id', latestBall.id);

    // Rollback innings score
    const runsToRevert = latestBall.runs_scored + (latestBall.extra_type ? 1 : 0);
    const newRuns = Math.max(0, innings.runs - runsToRevert);
    const newWickets = latestBall.is_wicket ? Math.max(0, innings.wickets - 1) : innings.wickets;

    await supabase
      .from('innings')
      .update({
        runs: newRuns,
        wickets: newWickets,
      })
      .eq('id', innings.id);

    broadcastScoreUpdate(matchId, {
      matchId,
      runs: newRuns,
      wickets: newWickets,
      isUndo: true,
    });

    res.json({
      message: 'Ball event reverted successfully',
      revertedBall: latestBall,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
