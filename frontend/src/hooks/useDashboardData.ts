import { startTransition, useEffect, useState } from "react";

import { soccerPhysicsClient } from "@/api/client";
import { demoDashboardData } from "@/data/demo";
import type { DashboardData } from "@/types";

interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const [selectedPlayerId, setSelectedPlayerId] = useState("home_4");
  const [selectedWindow, setSelectedWindow] = useState(18);
  const [state, setState] = useState<DashboardState>({
    data: demoDashboardData,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard(): Promise<void> {
      try {
        const [health, modelInfo, analyzeSequence, matchReport, loadReport, searchSequences, playerProfile] =
          await Promise.all([
            soccerPhysicsClient.getHealth(),
            soccerPhysicsClient.getModelInfo(),
            soccerPhysicsClient.analyzeSequence({
              dataset: "metrica",
              match_id: "sample_game_1",
              start_time_s: Math.max(0, selectedWindow - 6),
              end_time_s: selectedWindow,
              focus_team: "home",
              focus_player_id: selectedPlayerId,
              mode: "single",
            }),
            soccerPhysicsClient.getMatchReport("sample_game_1"),
            soccerPhysicsClient.getLoadReport({
              dataset: "metrica",
              match_id: "sample_game_1",
            }),
            soccerPhysicsClient.searchSequences({
              dataset: "metrica",
              match_id: "sample_game_1",
              reference_time_s: selectedWindow,
              similarity_threshold: 0.75,
            }),
            soccerPhysicsClient.getPlayerProfile(selectedPlayerId),
          ]);

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setState({
            loading: false,
            error: null,
            data: {
              ...demoDashboardData,
              health,
              modelInfo,
              analyzeSequence,
              matchReport,
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
            data: demoDashboardData,
          });
        });
      }
    }

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, [selectedPlayerId, selectedWindow]);

  return {
    ...state,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedWindow,
    setSelectedWindow,
  };
}
