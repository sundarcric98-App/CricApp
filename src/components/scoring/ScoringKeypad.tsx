import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { BallType } from '../../types/cricket';
import ScoreButton from './ScoreButton';

interface ScoringKeypadProps {
  onScoreBall: (ballType: BallType, runs: number, isExtra?: boolean, isWicket?: boolean) => void;
  onUndo: () => void;
  onOpenWicketModal: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export const ScoringKeypad: React.FC<ScoringKeypadProps> = ({
  onScoreBall,
  onUndo,
  onOpenWicketModal,
  canUndo = true,
  disabled = false,
}) => {
  return (
    <View style={styles.keypadContainer}>
      {/* Row 1: Runs 0, 1, 2, 3 */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="0"
            subLabel="Dot"
            variant="run"
            onPress={() => onScoreBall('dot', 0)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="1"
            subLabel="Single"
            variant="run"
            onPress={() => onScoreBall('run', 1)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="2"
            subLabel="Double"
            variant="run"
            onPress={() => onScoreBall('run', 2)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="3"
            subLabel="Triple"
            variant="run"
            onPress={() => onScoreBall('run', 3)}
            disabled={disabled}
          />
        </View>
      </View>

      {/* Row 2: 4 (FOUR), 6 (SIX), OUT, WD (Wide) */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="4"
            subLabel="Boundary"
            variant="boundary"
            onPress={() => onScoreBall('boundary4', 4)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="6"
            subLabel="Maximum"
            variant="boundary"
            onPress={() => onScoreBall('boundary6', 6)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="OUT"
            subLabel="Wicket"
            variant="wicket"
            onPress={onOpenWicketModal}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="WD"
            subLabel="Wide (+1)"
            variant="extra"
            onPress={() => onScoreBall('wide', 1, true)}
            disabled={disabled}
          />
        </View>
      </View>

      {/* Row 3: NB (No Ball), LB (Leg Bye), BYE, UNDO */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="NB"
            subLabel="No Ball (+1)"
            variant="extra"
            onPress={() => onScoreBall('noBall', 1, true)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="LB"
            subLabel="Leg Bye (+1)"
            variant="action"
            onPress={() => onScoreBall('legBye', 1, true)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="BYE"
            subLabel="Bye (+1)"
            variant="action"
            onPress={() => onScoreBall('bye', 1, true)}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <TouchableOpacity
            style={[styles.undoButton, (!canUndo || disabled) && styles.undoDisabled]}
            onPress={onUndo}
            disabled={!canUndo || disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-undo" size={20} color={canUndo ? Colors.secondary : Colors.outline} />
            <Text style={[styles.undoText, { color: canUndo ? Colors.secondary : Colors.outline }]}>
              UNDO
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keypadContainer: {
    gap: 8,
    marginVertical: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonCell: {
    flex: 1,
  },
  undoButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 185, 95, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.3)',
    gap: 2,
  },
  undoDisabled: {
    backgroundColor: Colors.surfaceContainer,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  undoText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default ScoringKeypad;
