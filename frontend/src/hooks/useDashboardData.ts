import { startTransition, useEffect, useState } from "react";

import { soccerPhysicsClient } from "@/api/client";
import {
  DEFAULT_MATCH_ID,
  MATCH_OPTIONS,
  demoDashboardData,
  getActivePhaseWindow,
  getDefaultPlayerId,
  getDefaultReferenceTime,
  getDemoDashboardData,
  getDemoPlayerProfile,
  getDemoPhaseWindows,
} from "@/data/demoScenarios";
import type { DashboardData, PhaseWindow } from "@/types";

interface DashboardState {
  data: DashboardData;
  isLiveData: boolean;
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const [selectedMatchId, setSelectedMatchId] = useState(DEFAULT_MATCH_ID);
  const [selectedPlayerId, setSelectedPlayerIdState] = useState(
    getDefaultPlayerId(DEFAULT_MATCH_ID),
  );
  const [hasExplicitPlayerSelection, setHasExplicitPlayerSelection] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(getDefaultReferenceTime(DEFAULT_MATCH_ID));
  const [state, setState] = useState<DashboardState>({
    data: demoDashboardData,
    isLiveData: false,
    loading: true,
    error: null,
  });
  const phaseWindows = getDemoPhaseWindows(selectedMatchId);
  const activePhaseWindow = getActivePhaseWindow(selectedMatchId, selectedWindow);

  useEffect(() => {
    let isCancelled = false;
    const demoSnapshot = getDemoDashboardData(selectedMatchId, activePhaseWindow.endTimeS, selectedPlayerId);

    startTransition(() => {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        data: demoSnapshot,
      }));
    });

    async function loadDashboard(): Promise<void> {
      const healthStatus = await soccerPhysicsClient.getHealthStatus();

      try {
        const [modelInfo, matchReport, loadReport, searchSequences] =
          await Promise.all([
            soccerPhysicsClient.getModelInfo(),
            soccerPhysicsClient.getMatchReport(selectedMatchId, activePhaseWindow.endTimeS),
            soccerPhysicsClient.getLoadReport({
              dataset: "metrica",
              match_id: selectedMatchId,
            }),
            soccerPhysicsClient.searchSequences({
              dataset: "metrica",
              match_id: selectedMatchId,
              reference_time_s: activePhaseWindow.endTimeS,
              similarity_threshold: 0.75,
            }),
          ]);

        const livePlayerIds = loadReport.player_load_profiles.map((profile) => profile.player_id);
        const selectedPlayerIsAvailable = livePlayerIds.includes(selectedPlayerId);
        const resolvedPlayerId = selectedPlayerIsAvailable
          ? selectedPlayerId
          : livePlayerIds[0] ?? selectedPlayerId;

        const analyzeSequence = await soccerPhysicsClient.analyzeSequence({
          dataset: "metrica",
          match_id: selectedMatchId,
          start_time_s: activePhaseWindow.startTimeS,
          end_time_s: activePhaseWindow.endTimeS,
          focus_team: "home",
          focus_player_id:
            hasExplicitPlayerSelection && selectedPlayerIsAvailable
              ? selectedPlayerId
              : undefined,
          mode: "single",
        });

        let playerProfile = getDemoPlayerProfile(selectedMatchId, resolvedPlayerId);
        try {
          playerProfile = await soccerPhysicsClient.getPlayerProfile(
            resolvedPlayerId,
            selectedMatchId,
          );
        } catch {
          playerProfile = getDemoPlayerProfile(selectedMatchId, resolvedPlayerId);
        }

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          if (!hasExplicitPlayerSelection && resolvedPlayerId !== selectedPlayerId) {
            setSelectedPlayerIdState(resolvedPlayerId);
          }

          setState({
            loading: false,
            error: null,
            isLiveData: healthStatus.isLive,
            data: {
              ...demoSnapshot,
              health: healthStatus.data,
              modelInfo,
              analyzeSequence,
              matchReport: {
                ...demoSnapshot.matchReport,
                match_id: matchReport.match_id,
                phase_summary: matchReport.phase_summary,
                fatigue_curves: matchReport.fatigue_curves,
                player_load_profiles: loadReport.player_load_profiles,
              },
              loadReport,
              searchSequences,
              playerProfile,
            },
          });
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown dashboard load failure.";
        startTransition(() => {
          setState({
            loading: false,
            error: message,
            isLiveData: healthStatus.isLive,
            data: demoSnapshot,
          });
        });
      }
    }

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, [
    activePhaseWindow.endTimeS,
    activePhaseWindow.startTimeS,
    hasExplicitPlayerSelection,
    selectedMatchId,
    selectedPlayerId,
  ]);

  function handleMatchChange(matchId: string): void {
    const nextWindow = getDefaultReferenceTime(matchId);
    setSelectedMatchId(matchId);
    setSelectedPlayerIdState(getDefaultPlayerId(matchId));
    setHasExplicitPlayerSelection(false);
    setSelectedWindow(nextWindow);
  }

  function handlePlayerChange(playerId: string): void {
    setSelectedPlayerIdState(playerId);
    setHasExplicitPlayerSelection(true);
  }

  function handleWindowChange(value: number): void {
    setSelectedWindow(value);
  }

  function handlePhaseWindowChange(window: PhaseWindow): void {
    setSelectedWindow(window.endTimeS);
  }

  return {
    ...state,
    matchOptions: MATCH_OPTIONS,
    phaseWindows,
    activePhaseWindow,
    selectedMatchId,
    setSelectedMatchId: handleMatchChange,
    selectedPlayerId,
    setSelectedPlayerId: handlePlayerChange,
    selectedWindow,
    setSelectedWindow: handleWindowChange,
    setSelectedPhaseWindow: handlePhaseWindowChange,
  };
}
