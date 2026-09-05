import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Match, Scorecard } from '../types/cricket';

interface ScoringSnapshot {
  match: Match;
  scorecard: Scorecard;
}

interface ScoringState {
  activeMatchId: string | null;
  isSubmitting: boolean;
  showWicketModal: boolean;
  showBowlerModal: boolean;
  showBatterModal: boolean;
  selectedWicketType: string;
  undoStack: ScoringSnapshot[];
}

const initialState: ScoringState = {
  activeMatchId: null,
  isSubmitting: false,
  showWicketModal: false,
  showBowlerModal: false,
  showBatterModal: false,
  selectedWicketType: 'caught',
  undoStack: [],
};

export const scoringSlice = createSlice({
  name: 'scoring',
  initialState,
  reducers: {
    setActiveScoringMatch: (state, action: PayloadAction<string>) => {
      state.activeMatchId = action.payload;
    },
    pushUndoSnapshot: (state, action: PayloadAction<ScoringSnapshot>) => {
      state.undoStack.push(action.payload);
      // Keep max 20 snapshots in undo stack
      if (state.undoStack.length > 20) {
        state.undoStack.shift();
      }
    },
    popUndoSnapshot: (state) => {
      state.undoStack.pop();
    },
    clearUndoStack: (state) => {
      state.undoStack = [];
    },
    setShowWicketModal: (state, action: PayloadAction<boolean>) => {
      state.showWicketModal = action.payload;
    },
    setShowBowlerModal: (state, action: PayloadAction<boolean>) => {
      state.showBowlerModal = action.payload;
    },
    setShowBatterModal: (state, action: PayloadAction<boolean>) => {
      state.showBatterModal = action.payload;
    },
    setSelectedWicketType: (state, action: PayloadAction<string>) => {
      state.selectedWicketType = action.payload;
    },
    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
  },
});

export const {
  setActiveScoringMatch,
  pushUndoSnapshot,
  popUndoSnapshot,
  clearUndoStack,
  setShowWicketModal,
  setShowBowlerModal,
  setShowBatterModal,
  setSelectedWicketType,
  setIsSubmitting,
} = scoringSlice.actions;

export default scoringSlice.reducer;
