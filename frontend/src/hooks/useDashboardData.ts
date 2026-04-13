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
  getDemoPhaseWindows,
} from "@/data/demoScenarios";
import type { DashboardData, PhaseWindow } from "@/types";

interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const [selectedMatchId, setSelectedMatchId] = useState(DEFAULT_MATCH_ID);
  const [selectedPlayerId, setSelectedPlayerId] = useState(getDefaultPlayerId(DEFAULT_MATCH_ID));
  const [selectedWindow, setSelectedWindow] = useState(getDefaultReferenceTime(DEFAULT_MATCH_ID));
  const [state, setState] = useState<DashboardState>({
    data: demoDashboardData,
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
      try {
        const [health, modelInfo, analyzeSequence, matchReport, loadReport, searchSequences, playerProfile] =
          await Promise.all([
            soccerPhysicsClient.getHealth(),
            soccerPhysicsClient.getModelInfo(),
            soccerPhysicsClient.analyzeSequence({
              dataset: "metrica",
              match_id: selectedMatchId,
              start_time_s: activePhaseWindow.startTimeS,
              end_time_s: activePhaseWindow.endTimeS,
              focus_team: "home",
              focus_player_id: selectedPlayerId,
              mode: "single",
            }),
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
            soccerPhysicsClient.getPlayerProfile(selectedPlayerId, selectedMatchId),
          ]);

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setState({
            loading: false,
            error: null,
            data: {
              ...demoSnapshot,
              health,
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
            data: demoSnapshot,
          });
        });
      }
    }

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, [activePhaseWindow.endTimeS, activePhaseWindow.startTimeS, selectedMatchId, selectedPlayerId]);

  function handleMatchChange(matchId: string): void {
    const nextWindow = getDefaultReferenceTime(matchId);
    setSelectedMatchId(matchId);
    setSelectedPlayerId(getDefaultPlayerId(matchId));
    setSelectedWindow(nextWindow);
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
    setSelectedPlayerId,
    selectedWindow,
    setSelectedWindow: handleWindowChange,
    setSelectedPhaseWindow: handlePhaseWindowChange,
  };
}
