import { useState } from "react";

import { Shell } from "@/components/layout/Shell";
import { LoadMonitor } from "@/pages/LoadMonitor";
import { MatchAnalysis } from "@/pages/MatchAnalysis";
import { PlayerIntelligence } from "@/pages/PlayerIntelligence";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { TabKey } from "@/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("match-analysis");
  const {
    data,
    isLiveData,
    loading,
    error,
    matchOptions,
    phaseWindows,
    activePhaseWindow,
    selectedMatchId,
    setSelectedMatchId,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedWindow,
    setSelectedWindow,
    setSelectedPhaseWindow,
  } = useDashboardData();

  return (
    <Shell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLiveData={isLiveData}
      loading={loading}
      error={error}
      matchOptions={matchOptions}
      selectedMatchId={selectedMatchId}
      onMatchChange={setSelectedMatchId}
    >
      {activeTab === "match-analysis" ? (
        <MatchAnalysis
          data={data}
          phaseWindows={phaseWindows}
          activePhaseWindow={activePhaseWindow}
          selectedWindow={selectedWindow}
          onWindowChange={setSelectedWindow}
          onPhaseWindowChange={setSelectedPhaseWindow}
        />
      ) : null}
      {activeTab === "load-monitor" ? <LoadMonitor data={data} /> : null}
      {activeTab === "player-intelligence" ? (
        <PlayerIntelligence
          data={data}
          selectedPlayerId={selectedPlayerId}
          onPlayerChange={setSelectedPlayerId}
        />
      ) : null}
    </Shell>
  );
}
