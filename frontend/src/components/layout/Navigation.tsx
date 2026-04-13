import { Tabs } from "@/components/ui/tabs";
import type { TabKey } from "@/types";

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <Tabs
      activeTab={activeTab}
      onChange={onTabChange}
      items={[
        { key: "match-analysis", label: "Match Analysis" },
        { key: "load-monitor", label: "Load Monitor" },
        { key: "player-intelligence", label: "Player Intelligence" },
      ]}
    />
  );
}
