import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import cricketApi from '../services/api';
import {
  BallEventPayload,
  CommentaryItem,
  Match,
  MatchStatus,
  Player,
  Scorecard,
  TournamentStanding,
} from '../types/cricket';

interface MatchState {
  matches: Match[];
  selectedStatus: MatchStatus;
  currentMatch: Match | null;
  scorecard: Scorecard | null;
  commentary: CommentaryItem[];
  commentaryFilter: 'all' | 'boundary' | 'wicket' | 'key';
  tournamentStandings: TournamentStanding[];
  selectedGroup: 'all' | 'group-a' | 'group-b';
  selectedPlayer: Player | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const initialState: MatchState = {
  matches: [],
  selectedStatus: 'live',
  currentMatch: null,
  scorecard: null,
  commentary: [],
  commentaryFilter: 'all',
  tournamentStandings: [],
  selectedGroup: 'all',
  selectedPlayer: null,
  loading: false,
  refreshing: false,
  error: null,
};

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async (status: MatchStatus | undefined, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getMatches(status);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch matches');
    }
  }
);

export const fetchMatchDetails = createAsyncThunk(
  'matches/fetchMatchDetails',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const match = await cricketApi.getMatchById(matchId);
      const scorecard = await cricketApi.getScorecard(matchId);
      const commentary = await cricketApi.getCommentary(matchId);
      return { match, scorecard, commentary };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch match details');
    }
  }
);

export const fetchScorecard = createAsyncThunk(
  'matches/fetchScorecard',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getScorecard(matchId);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch scorecard');
    }
  }
);

export const fetchCommentary = createAsyncThunk(
  'matches/fetchCommentary',
  async ({ matchId, filter }: { matchId: string; filter?: string }, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getCommentary(matchId, filter);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch commentary');
    }
  }
);

export const fetchTournamentStandings = createAsyncThunk(
  'matches/fetchTournamentStandings',
  async (group: 'A' | 'B' | undefined, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getTournamentStandings(group);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch standings');
    }
  }
);

export const fetchPlayerProfile = createAsyncThunk(
  'matches/fetchPlayerProfile',
  async (playerId: string, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getPlayerProfile(playerId);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch player profile');
    }
  }
);

export const submitBallEvent = createAsyncThunk(
  'matches/submitBallEvent',
  async (
    { matchId, payload }: { matchId: string; payload: BallEventPayload },
    { rejectWithValue }
  ) => {
    try {
      const data = await cricketApi.postBallEvent(matchId, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to submit ball event');
    }
  }
);

export const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setSelectedStatus: (state, action: PayloadAction<MatchStatus>) => {
      state.selectedStatus = action.payload;
    },
    setCommentaryFilter: (state, action: PayloadAction<'all' | 'boundary' | 'wicket' | 'key'>) => {
      state.commentaryFilter = action.payload;
    },
    setSelectedGroup: (state, action: PayloadAction<'all' | 'group-a' | 'group-b'>) => {
      state.selectedGroup = action.payload;
    },
    handleRealtimeScoreUpdate: (
      state,
      action: PayloadAction<{ match: Match; commentaryItem?: CommentaryItem }>
    ) => {
      const updatedMatch = action.payload.match;
      const index = state.matches.findIndex((m) => m.id === updatedMatch.id);
      if (index !== -1) {
        state.matches[index] = updatedMatch;
      }
      if (state.currentMatch?.id === updatedMatch.id) {
        state.currentMatch = updatedMatch;
      }
      if (action.payload.commentaryItem) {
        state.commentary = [action.payload.commentaryItem, ...state.commentary];
      }
    },
    handleRealtimeMatchStatus: (
      state,
      action: PayloadAction<{ matchId: string; status: MatchStatus; result?: string }>
    ) => {
      const { matchId, status, result } = action.payload;
      const match = state.matches.find((m) => m.id === matchId);
      if (match) {
        match.status = status;
        if (result) match.result = result;
      }
      if (state.currentMatch?.id === matchId) {
        state.currentMatch.status = status;
        if (result) state.currentMatch.result = result;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchMatches
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchMatchDetails
    builder
      .addCase(fetchMatchDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatchDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload.match;
        state.scorecard = action.payload.scorecard;
        state.commentary = action.payload.commentary;
      })
      .addCase(fetchMatchDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchScorecard
    builder.addCase(fetchScorecard.fulfilled, (state, action) => {
      state.scorecard = action.payload;
    });

    // fetchCommentary
    builder.addCase(fetchCommentary.fulfilled, (state, action) => {
      state.commentary = action.payload;
    });

    // fetchTournamentStandings
    builder.addCase(fetchTournamentStandings.fulfilled, (state, action) => {
      state.tournamentStandings = action.payload;
    });

    // fetchPlayerProfile
    builder.addCase(fetchPlayerProfile.fulfilled, (state, action) => {
      state.selectedPlayer = action.payload;
    });

    // submitBallEvent
    builder.addCase(submitBallEvent.fulfilled, (state, action) => {
      state.currentMatch = action.payload.match;
      state.scorecard = action.payload.scorecard;
      state.commentary = [action.payload.commentaryItem, ...state.commentary];

      const matchIndex = state.matches.findIndex((m) => m.id === action.payload.match.id);
      if (matchIndex !== -1) {
        state.matches[matchIndex] = action.payload.match;
      }
    });
  },
});

export const {
  setSelectedStatus,
  setCommentaryFilter,
  setSelectedGroup,
  handleRealtimeScoreUpdate,
  handleRealtimeMatchStatus,
} = matchSlice.actions;

export default matchSlice.reducer;
