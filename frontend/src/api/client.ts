import {
  demoAnalyzeSequence,
  demoHealth,
  demoLoadReport,
  demoMatchReport,
  demoModelInfo,
  demoPlayerProfile,
  demoSearchSequences,
} from "@/data/demo";
import type {
  AnalyzeSequenceResponse,
  HealthResponse,
  LoadReportResponse,
  MatchReportResponse,
  ModelInfoResponse,
  PlayerProfileResponse,
  SearchSequencesResponse,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

interface AnalyzeSequencePayload {
  dataset: string;
  match_id: string;
  start_time_s: number;
  end_time_s: number;
  focus_team: string;
  focus_player_id?: string;
  mode: string;
}

interface SearchSequencesPayload {
  dataset: string;
  match_id: string;
  reference_time_s: number;
  similarity_threshold: number;
}

interface LoadReportPayload {
  dataset: string;
  match_id: string;
  player_id?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchJson<T>(
  path: string,
  init: RequestInit,
  fallback: () => T,
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    await delay(120);
    return fallback();
  }
}

export class SoccerPhysicsClient {
  async analyzeSequence(payload: AnalyzeSequencePayload): Promise<AnalyzeSequenceResponse> {
    return fetchJson(
      "/analyze-sequence",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      () => demoAnalyzeSequence,
    );
  }

  async getMatchReport(matchId: string): Promise<MatchReportResponse> {
    return fetchJson(
      "/match-report",
      {
        method: "POST",
        body: JSON.stringify({ dataset: "metrica", match_id: matchId }),
      },
      () => demoMatchReport,
    );
  }

  async getLoadReport(payload: LoadReportPayload): Promise<LoadReportResponse> {
    return fetchJson(
      "/load-report",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      () => demoLoadReport,
    );
  }

  async searchSequences(payload: SearchSequencesPayload): Promise<SearchSequencesResponse> {
    return fetchJson(
      "/search-sequences",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      () => demoSearchSequences,
    );
  }

  async getPlayerProfile(playerId: string): Promise<PlayerProfileResponse> {
    return fetchJson(
      `/player-profile/${playerId}`,
      {
        method: "GET",
      },
      () => demoPlayerProfile,
    );
  }

  async getHealth(): Promise<HealthResponse> {
    return fetchJson(
      "/health",
      {
        method: "GET",
      },
      () => demoHealth,
    );
  }

  async getModelInfo(): Promise<ModelInfoResponse> {
    return fetchJson(
      "/model-info",
      {
        method: "GET",
      },
      () => demoModelInfo,
    );
  }
}

export const soccerPhysicsClient = new SoccerPhysicsClient();
