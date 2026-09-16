import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { BallType } from '../../types/cricket';
import ScoreButton from './ScoreButton';

interface ScoringKeypadProps {
  onScoreBall: (ballType: BallType, runs: number, isExtra?: boolean, isWicket?: boolean) => void;
  onUndo: () => void;
  onOpenWicketModal: () => void;
  onSwapStrike: () => void;
  onEndOver: () => void;
  onRetireBatsman: () => void;
  onSelectNewBatsman: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

type ExtraModalType = 'noBall' | 'wide' | 'legBye' | 'bye' | null;

export const ScoringKeypad: React.FC<ScoringKeypadProps> = ({
  onScoreBall,
  onUndo,
  onOpenWicketModal,
  onSwapStrike,
  onEndOver,
  onRetireBatsman,
  onSelectNewBatsman,
  canUndo = true,
  disabled = false,
}) => {
  const [activeExtraModal, setActiveExtraModal] = useState<ExtraModalType>(null);

  const handleSelectNoBallRuns = (batRuns: number) => {
    setActiveExtraModal(null);
    onScoreBall('noBall', batRuns, true);
  };

  const handleSelectWideRuns = (extraRuns: number) => {
    setActiveExtraModal(null);
    onScoreBall('wide', extraRuns, true);
  };

  const handleSelectByeRuns = (runs: number) => {
    setActiveExtraModal(null);
    onScoreBall('bye', runs, true);
  };

  const handleSelectLegByeRuns = (runs: number) => {
    setActiveExtraModal(null);
    onScoreBall('legBye', runs, true);
  };

  return (
    <View style={styles.keypadContainer}>
      {/* Action Utility Bar: Swap Strike, End Over, Retire, New Batsman */}
      <View style={styles.actionUtilityRow}>
        <TouchableOpacity
          style={styles.utilityActionBtn}
          onPress={onSwapStrike}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={15} color={Colors.primary} />
          <Text style={styles.utilityActionText}>Swap Strike</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityActionBtn}
          onPress={onEndOver}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle-outline" size={15} color="#4EDEAF" />
          <Text style={styles.utilityActionText}>End Over</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityActionBtn}
          onPress={onRetireBatsman}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="exit-outline" size={15} color="#FFB95F" />
          <Text style={styles.utilityActionText}>Retire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityActionBtn}
          onPress={onSelectNewBatsman}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={15} color="#38BDF8" />
          <Text style={styles.utilityActionText}>New Bat</Text>
        </TouchableOpacity>
      </View>

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

      {/* Row 2: 4 (FOUR), 5, 6 (SIX), OUT */}
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
            label="5"
            subLabel="5 Runs"
            variant="run"
            onPress={() => onScoreBall('run', 5)}
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
      </View>

      {/* Row 3: WD (Wide), NB (No Ball), LB (Leg Bye), BYE, UNDO */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="WD"
            subLabel="Wide"
            variant="extra"
            onPress={() => setActiveExtraModal('wide')}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="NB"
            subLabel="No Ball"
            variant="extra"
            onPress={() => setActiveExtraModal('noBall')}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="LB"
            subLabel="Leg Bye"
            variant="action"
            onPress={() => setActiveExtraModal('legBye')}
            disabled={disabled}
          />
        </View>
        <View style={styles.buttonCell}>
          <ScoreButton
            label="BYE"
            subLabel="Bye"
            variant="action"
            onPress={() => setActiveExtraModal('bye')}
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
            <Ionicons name="arrow-undo" size={18} color={canUndo ? Colors.secondary : Colors.outline} />
            <Text style={[styles.undoText, { color: canUndo ? Colors.secondary : Colors.outline }]}>
              UNDO
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Extras Selection Modal */}
      <Modal
        visible={activeExtraModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveExtraModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.extraModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {activeExtraModal === 'noBall'
                  ? 'NO BALL - Runs Off Bat'
                  : activeExtraModal === 'wide'
                  ? 'WIDE DELIVERY - Extra Runs'
                  : activeExtraModal === 'legBye'
                  ? 'LEG BYE - Runs Scored'
                  : 'BYE - Runs Scored'}
              </Text>
              <TouchableOpacity onPress={() => setActiveExtraModal(null)}>
                <Ionicons name="close-circle" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* No Ball Options */}
            {activeExtraModal === 'noBall' && (
              <View style={styles.extraGrid}>
                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectNoBallRuns(0)}
                >
                  <Text style={styles.extraOptionNumber}>0</Text>
                  <Text style={styles.extraOptionSub}>NB (1 run total)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectNoBallRuns(1)}
                >
                  <Text style={styles.extraOptionNumber}>1</Text>
                  <Text style={styles.extraOptionSub}>NB + 1 run (2 total)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectNoBallRuns(2)}
                >
                  <Text style={styles.extraOptionNumber}>2</Text>
                  <Text style={styles.extraOptionSub}>NB + 2 runs (3 total)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectNoBallRuns(3)}
                >
                  <Text style={styles.extraOptionNumber}>3</Text>
                  <Text style={styles.extraOptionSub}>NB + 3 runs (4 total)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.extraOptionBtn, styles.extraOptionHighlight]}
                  onPress={() => handleSelectNoBallRuns(4)}
                >
                  <Text style={[styles.extraOptionNumber, { color: '#4EDEAF' }]}>4</Text>
                  <Text style={[styles.extraOptionSub, { color: '#4EDEAF' }]}>
                    NB + FOUR (5 total)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.extraOptionBtn, styles.extraOptionHighlight]}
                  onPress={() => handleSelectNoBallRuns(6)}
                >
                  <Text style={[styles.extraOptionNumber, { color: '#FFB95F' }]}>6</Text>
                  <Text style={[styles.extraOptionSub, { color: '#FFB95F' }]}>
                    NB + SIX (7 total)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Wide Options */}
            {activeExtraModal === 'wide' && (
              <View style={styles.extraGrid}>
                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectWideRuns(1)}
                >
                  <Text style={styles.extraOptionNumber}>1</Text>
                  <Text style={styles.extraOptionSub}>Standard Wide (1 run)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectWideRuns(2)}
                >
                  <Text style={styles.extraOptionNumber}>2</Text>
                  <Text style={styles.extraOptionSub}>Wide + 1 Bye (2 runs)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extraOptionBtn}
                  onPress={() => handleSelectWideRuns(3)}
                >
                  <Text style={styles.extraOptionNumber}>3</Text>
                  <Text style={styles.extraOptionSub}>Wide + 2 Byes (3 runs)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.extraOptionBtn, styles.extraOptionHighlight]}
                  onPress={() => handleSelectWideRuns(5)}
                >
                  <Text style={[styles.extraOptionNumber, { color: '#4EDEAF' }]}>5</Text>
                  <Text style={[styles.extraOptionSub, { color: '#4EDEAF' }]}>
                    Wide + 4 Byes (5 runs)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Leg-Bye Options */}
            {activeExtraModal === 'legBye' && (
              <View style={styles.extraGrid}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.extraOptionBtn}
                    onPress={() => handleSelectLegByeRuns(num)}
                  >
                    <Text style={styles.extraOptionNumber}>{num}</Text>
                    <Text style={styles.extraOptionSub}>
                      {num} {num === 1 ? 'Leg-Bye' : 'Leg-Byes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bye Options */}
            {activeExtraModal === 'bye' && (
              <View style={styles.extraGrid}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.extraOptionBtn}
                    onPress={() => handleSelectByeRuns(num)}
                  >
                    <Text style={styles.extraOptionNumber}>{num}</Text>
                    <Text style={styles.extraOptionSub}>
                      {num} {num === 1 ? 'Bye' : 'Byes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  keypadContainer: {
    gap: 8,
    marginVertical: 6,
  },
  actionUtilityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  utilityActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  utilityActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  extraModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  extraOptionBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  extraOptionHighlight: {
    borderColor: 'rgba(78, 222, 163, 0.4)',
    backgroundColor: 'rgba(78, 222, 163, 0.08)',
  },
  extraOptionNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  extraOptionSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginTop: 3,
    textAlign: 'center',
  },
});

export default ScoringKeypad;
