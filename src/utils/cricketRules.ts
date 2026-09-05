import { BallEvent, BallEventPayload, BallType, Match, Scorecard } from '../types/cricket';

/**
 * Converts legal balls count to cricket overs notation string (e.g., 110 -> 18.2)
 */
export function ballsToOvers(legalBalls: number): number {
  const completedOvers = Math.floor(legalBalls / 6);
  const remainingBalls = legalBalls % 6;
  return Number(`${completedOvers}.${remainingBalls}`);
}

/**
 * Converts overs float notation (e.g., 18.2) to total legal balls count (e.g., 110)
 */
export function oversToBalls(overs: number): number {
  const [completedOvers, balls] = overs.toString().split('.').map(Number);
  return (completedOvers || 0) * 6 + (balls || 0);
}

/**
 * Calculates current run rate (CRR)
 */
export function calculateCRR(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

/**
 * Calculates required run rate (RRR)
 */
export function calculateRRR(target: number, currentRuns: number, remainingBalls: number): number {
  if (remainingBalls <= 0) return 0;
  const runsNeeded = target - currentRuns;
  if (runsNeeded <= 0) return 0;
  const remainingOvers = remainingBalls / 6;
  return Number((runsNeeded / remainingOvers).toFixed(2));
}

/**
 * Calculates batting strike rate
 */
export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Number(((runs / balls) * 100).toFixed(1));
}

/**
 * Calculates bowling economy
 */
export function calculateEconomy(runsConceded: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runsConceded / overs).toFixed(2));
}

/**
 * Generates commentary description for a ball event
 */
export function generateBallCommentary(
  bowlerName: string,
  strikerName: string,
  ballType: BallType,
  runs: number,
  isExtra: boolean,
  isWicket: boolean,
  wicketType?: string
): { title: string; description: string } {
  if (isWicket) {
    const titles = [
      'OUT! Massive Breakthrough!',
      'WICKET! Clean Bowled!',
      'CAUGHT! In the Air and Taken!',
      'LBW! Umpire raises the finger!',
    ];
    const chosenTitle = titles[Math.floor(Math.random() * titles.length)];
    const desc = `${bowlerName} strikes! ${strikerName} departs after a fighting knock. Full and straight delivery, mistimed completely.`;
    return { title: chosenTitle, description: desc };
  }

  if (ballType === 'boundary6') {
    return {
      title: 'SIX! Out of the Stadium!',
      description: `${bowlerName} pitches it in the slot, ${strikerName} clears the front leg and smokes it high and handsome deep over mid-wicket into the upper tier!`,
    };
  }

  if (ballType === 'boundary4') {
    return {
      title: 'FOUR! Smashed to the fence!',
      description: `Short and wide from ${bowlerName}, ${strikerName} rocks back and cuts it past backward point with surgical precision. Rapid outfield takes it to the boundary!`,
    };
  }

  if (ballType === 'wide') {
    return {
      title: 'Wide delivery called',
      description: `${bowlerName} slips this one way outside the off stump tramline. Umpire signals wide. 1 extra run added.`,
    };
  }

  if (ballType === 'noBall') {
    return {
      title: 'NO BALL! Free Hit upcoming!',
      description: `${bowlerName} oversteps the crease line. Umpire signals no-ball. 1 run added and next ball is a Free Hit!`,
    };
  }

  if (runs === 0) {
    return {
      title: 'Dot ball. Good length delivery',
      description: `${bowlerName} hits the deck hard around off stump. ${strikerName} defends solidly onto the pitch with no chance of a run.`,
    };
  }

  if (runs === 1) {
    return {
      title: '1 run taken',
      description: `${bowlerName} delivers on middle stump, ${strikerName} nudges it gently into the gap at deep mid-wicket for a quick single to rotate the strike.`,
    };
  }

  if (runs === 2) {
    return {
      title: '2 runs, excellent running',
      description: `Pushed into the vacant deep cover region. Superb running between the wickets by ${strikerName} to comfortably convert one into two.`,
    };
  }

  if (runs === 3) {
    return {
      title: '3 runs scored',
      description: `Driven through extra cover. Great fielding effort near the boundary rope saves a run. Three taken.`,
    };
  }

  return {
    title: `${runs} runs`,
    description: `Worked off the pads into the deep by ${strikerName} for ${runs} runs.`,
  };
}

/**
 * Applies a ball event to the active match and returns updated match and scorecard state
 */
export function applyBallToMatch(
  currentMatch: Match,
  currentScorecard: Scorecard | null,
  payload: BallEventPayload
): {
  updatedMatch: Match;
  updatedScorecard: Scorecard;
  ballEvent: BallEvent;
  isOverFinished: boolean;
} {
  const isWide = payload.ballType === 'wide';
  const isNoBall = payload.ballType === 'noBall';
  const isBye = payload.ballType === 'bye';
  const isLegBye = payload.ballType === 'legBye';
  const isExtra = isWide || isNoBall || isBye || isLegBye || Boolean(payload.isExtra);
  const isLegal = !isWide && !isNoBall;
  const isWicket = Boolean(payload.isWicket || payload.ballType === 'wicket');
  const isFour = payload.ballType === 'boundary4' || payload.runs === 4;
  const isSix = payload.ballType === 'boundary6' || payload.runs === 6;
  const isBoundary = isFour || isSix;

  const batRuns = isWide ? 0 : (isBye || isLegBye) ? 0 : payload.runs;
  const extraRuns = (isWide || isNoBall) ? (payload.runs > 0 ? payload.runs : 1) : (isBye || isLegBye ? payload.runs : 0);
  const totalRuns = isWide || isNoBall ? (1 + (payload.runs > 1 ? payload.runs - 1 : 0)) : (payload.runs + extraRuns);

  // Active batting team
  const isTeam1Batting = currentMatch.battingTeamId === currentMatch.team1.id;
  const battingTeam = isTeam1Batting ? { ...currentMatch.team1 } : { ...currentMatch.team2 };
  const bowlingTeam = isTeam1Batting ? { ...currentMatch.team2 } : { ...currentMatch.team1 };

  // Current legal balls count
  const prevLegalBalls = oversToBalls(battingTeam.overs);
  const newLegalBalls = isLegal ? prevLegalBalls + 1 : prevLegalBalls;
  const newOvers = ballsToOvers(newLegalBalls);
  const isOverFinished = isLegal && newLegalBalls % 6 === 0;

  // New team scores
  const newTeamScore = battingTeam.score + totalRuns;
  const newTeamWickets = isWicket ? battingTeam.wickets + 1 : battingTeam.wickets;

  battingTeam.score = newTeamScore;
  battingTeam.wickets = newTeamWickets;
  battingTeam.overs = newOvers;

  // Active striker & non-striker
  let striker = { ...currentMatch.activeBatters.striker };
  let nonStriker = { ...currentMatch.activeBatters.nonStriker };

  // Update striker stats
  striker.runs += batRuns;
  if (isLegal || isNoBall) {
    striker.balls += 1;
  }
  if (isFour) striker.fours += 1;
  if (isSix) striker.sixes += 1;
  striker.strikeRate = calculateStrikeRate(striker.runs, striker.balls);

  if (isWicket) {
    striker.isOut = true;
    striker.dismissalInfo = `c & b ${currentMatch.activeBowler.name}`;
  }

  // Active Bowler stats
  const bowler = { ...currentMatch.activeBowler };
  bowler.runs += (isBye || isLegBye) ? 0 : totalRuns;
  if (isLegal) {
    bowler.oversInBalls += 1;
    bowler.overs = ballsToOvers(bowler.oversInBalls);
  }
  if (isWicket) bowler.wickets += 1;
  if (isWide) bowler.wides += 1;
  if (isNoBall) bowler.noBalls += 1;
  if (totalRuns === 0 && isLegal) bowler.dots += 1;
  bowler.economy = calculateEconomy(bowler.runs, bowler.oversInBalls);

  // Strike rotation logic:
  // Runs rotation: odd runs off bat rotate strike
  const shouldRotateForRuns = batRuns % 2 === 1;
  // Over rotation: end of over rotates strike
  let nextStriker = striker;
  let nextNonStriker = nonStriker;

  if (shouldRotateForRuns) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
    nextStriker.isStriker = true;
    nextStriker.isNonStriker = false;
    nextNonStriker.isStriker = false;
    nextNonStriker.isNonStriker = true;
  }

  if (isOverFinished) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
    nextStriker.isStriker = true;
    nextStriker.isNonStriker = false;
    nextNonStriker.isStriker = false;
    nextNonStriker.isNonStriker = true;
  }

  // Recent balls bubble strip
  const ballBadgeLabel = isWicket ? 'W' : isWide ? 'Wd' : isNoBall ? 'Nb' : String(totalRuns);
  const updatedRecentBalls = [...currentMatch.recentBalls.slice(-7), ballBadgeLabel];

  // Commentary generation
  const commentaryInfo = generateBallCommentary(
    bowler.name,
    striker.name,
    payload.ballType,
    payload.runs,
    isExtra,
    isWicket,
    payload.wicketType
  );

  const displayOverStr = `${Math.floor(newLegalBalls / 6)}.${newLegalBalls % 6 === 0 ? 6 : newLegalBalls % 6}`;

  const ballEvent: BallEvent = {
    id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    matchId: currentMatch.id,
    innings: currentMatch.currentInnings,
    overNumber: Math.floor(newLegalBalls / 6),
    ballInOver: newLegalBalls % 6 === 0 ? 6 : newLegalBalls % 6,
    displayOver: displayOverStr,
    strikerId: striker.playerId,
    strikerName: striker.name,
    nonStrikerId: nonStriker.playerId,
    nonStrikerName: nonStriker.name,
    bowlerId: bowler.playerId,
    bowlerName: bowler.name,
    runsScored: batRuns,
    extraRuns,
    totalRuns,
    isLegal,
    ballType: payload.ballType,
    isBoundary,
    isFour,
    isSix,
    isWicket,
    wicketType: payload.wicketType,
    dismissedPlayerId: isWicket ? striker.playerId : undefined,
    dismissedPlayerName: isWicket ? striker.name : undefined,
    isWide,
    isNoBall,
    isBye,
    isLegBye,
    commentaryText: commentaryInfo.description,
    tag: commentaryInfo.title,
    timestamp: new Date().toISOString(),
  };

  // Run equations
  const crr = calculateCRR(newTeamScore, newLegalBalls);
  let rrr = currentMatch.rrr;
  let equation = currentMatch.equation;

  if (currentMatch.currentInnings === 2 && currentMatch.target) {
    const runsNeeded = currentMatch.target - newTeamScore;
    const maxBalls = (battingTeam.maxOvers || 20) * 6;
    const remainingBalls = Math.max(0, maxBalls - newLegalBalls);
    rrr = calculateRRR(currentMatch.target, newTeamScore, remainingBalls);
    if (runsNeeded <= 0) {
      equation = `${battingTeam.shortName} won by ${10 - newTeamWickets} wickets`;
    } else {
      equation = `Need ${runsNeeded} runs in ${remainingBalls} balls`;
    }
  }

  const updatedMatch: Match = {
    ...currentMatch,
    team1: isTeam1Batting ? battingTeam : bowlingTeam,
    team2: isTeam1Batting ? bowlingTeam : battingTeam,
    crr,
    rrr,
    equation,
    recentBalls: updatedRecentBalls,
    activeBatters: {
      striker: nextStriker,
      nonStriker: nextNonStriker,
    },
    activeBowler: bowler,
  };

  // Update Scorecard structure
  const updatedScorecard: Scorecard = currentScorecard
    ? { ...currentScorecard }
    : {
        matchId: currentMatch.id,
        innings1: {
          teamId: currentMatch.team1.id,
          teamName: currentMatch.team1.name,
          shortName: currentMatch.team1.shortName,
          score: currentMatch.team1.score,
          wickets: currentMatch.team1.wickets,
          overs: currentMatch.team1.overs,
          legalBalls: oversToBalls(currentMatch.team1.overs),
          maxOvers: 20,
          runRate: 8.9,
          batting: [striker, nonStriker],
          bowling: [bowler],
          extras: { wides: 4, noBalls: 1, byes: 0, legByes: 2, penalty: 0, total: 7 },
          fallOfWickets: [],
        },
      };

  return {
    updatedMatch,
    updatedScorecard,
    ballEvent,
    isOverFinished,
  };
}
