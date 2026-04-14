import { PitchCanvas } from "@/components/pitch/PitchCanvas";
import { InsightBox } from "@/components/shared/InsightBox";
import { MetricCard } from "@/components/shared/MetricCard";
import { TimelineScrubber } from "@/components/shared/TimelineScrubber";
import { FormationView } from "@/components/tactical/FormationView";
import { PassNetwork } from "@/components/tactical/PassNetwork";
import { PhaseTimeline } from "@/components/tactical/PhaseTimeline";
import { PossessionChains } from "@/components/tactical/PossessionChains";
import { PressingReport } from "@/components/tactical/PressingReport";
import { TransitionReport } from "@/components/tactical/TransitionReport";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatPercent, formatTimeWindowLabel } from "@/lib/utils";
import type { DashboardData, PhaseWindow, Recommendation } from "@/types";

interface MatchAnalysisProps {
  data: DashboardData;
  phaseWindows: PhaseWindow[];
  activePhaseWindow: PhaseWindow;
  selectedWindow: number;
  onWindowChange: (value: number) => void;
  onPhaseWindowChange: (window: PhaseWindow) => void;
}

function formatMovementCue(recommendation: Recommendation): string {
  const movementParts: string[] = [];

  if (Math.abs(recommendation.dx) >= 1) {
    movementParts.push(
      recommendation.dx > 0
        ? `step about ${Math.abs(recommendation.dx).toFixed(0)} meters higher`
        : `drop about ${Math.abs(recommendation.dx).toFixed(0)} meters deeper`,
    );
  }

  if (Math.abs(recommendation.dy) >= 1) {
    movementParts.push(
      `shift about ${Math.abs(recommendation.dy).toFixed(0)} meters toward the ${
        recommendation.dy > 0 ? "right" : "left"
      } side`,
    );
  }

  if (movementParts.length === 0) {
    return "make a small positional adjustment";
  }

  if (movementParts.length === 1) {
    return movementParts[0];
  }

  return `${movementParts[0]} and ${movementParts[1]}`;
}

function buildCoachRecommendation(recommendation: Recommendation): string {
  return `Suggestion for ${formatLabel(recommendation.player_id)}: ${formatMovementCue(
    recommendation,
  )}. Why? ${recommendation.explanation}`;
}

export function MatchAnalysis({
  data,
  phaseWindows,
  activePhaseWindow,
  selectedWindow,
  onWindowChange,
  onPhaseWindowChange,
}: MatchAnalysisProps) {
  const focusPlayerId = data.analyzeSequence.load_snapshot.player_id;
  const windowLabel = formatTimeWindowLabel(
    activePhaseWindow.startTimeS,
    activePhaseWindow.endTimeS,
    activePhaseWindow.phase,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4">
        <p className="text-sm text-[var(--muted)]">
          Tactical breakdown of the selected sequence — pitch state, recommendations, phases, pressing.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="State Score"
          value={formatPercent(data.analyzeSequence.state_score, 0)}
          helper="Quick summary of how strong this moment is for the team."
          tooltip="How favorable is this moment for the team? 100% = completely dominant, 0% = completely under pressure. Based on pitch control, passing options, and support shape."
          tone="accent"
        />
        <MetricCard
          label="Pitch Control"
          value={formatPercent(data.analyzeSequence.pitch_control, 0)}
          helper="Shows the home side's territorial edge in this frame."
          tooltip="What percentage of the pitch can the home team reach before the opponent? Think of it as territorial dominance — like a heat map of who owns which space."
          tone="success"
        />
        <MetricCard
          label="Predicted Gain"
          value={`+${formatPercent(data.analyzeSequence.predicted_improvement, 0)}`}
          helper="Best available improvement from one movement change."
          tooltip="If the recommended player movement is made, how much would the state score improve? +5% means the team's tactical situation gets moderately better."
          tone="warning"
        />
        <MetricCard
          label="Phase Class"
          value={formatLabel(data.analyzeSequence.phase_classification)}
          helper="Names the tactical situation in this time window."
          tooltip="What type of tactical moment is this? Build Up = playing from the back. Progression = moving up the pitch. Chance Creation = creating a shooting opportunity. Pressing = trying to win the ball back. Transition = switching between attack and defense."
          tone="neutral"
        />
        <MetricCard
          label="Confidence"
          value={formatPercent(data.analyzeSequence.confidence, 0)}
          helper="Indicates how stable the top recommendation looks."
          tooltip="How reliable is this recommendation? Higher = the model is more certain this movement would help."
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <PitchCanvas
          players={data.pitchPlayers}
          heatMap={data.pitchHeatMap}
          lanes={data.pitchPassingLanes}
          recommendations={data.pitchRecommendations}
          overloads={data.pitchOverloads}
          teamShape={data.teamShapeOverlay}
          selectedPlayerId={focusPlayerId}
          windowLabel={windowLabel}
        />
        <div className="space-y-6">
          <TimelineScrubber
            value={selectedWindow}
            activeWindow={activePhaseWindow}
            range={phaseWindows}
            onChange={onWindowChange}
          />
          <InsightBox
            kicker="Sequence Insight"
            title={formatLabel(data.analyzeSequence.phase_classification)}
          >
            {data.analyzeSequence.explanation}
          </InsightBox>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Counterfactual movement suggestions for the current snapshot.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-4">
              {data.analyzeSequence.recommendations.map((recommendation) => (
                <div
                  key={`${recommendation.player_id}-${recommendation.dx}-${recommendation.dy}`}
                  className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {formatLabel(recommendation.player_id)}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                        +{formatPercent(recommendation.improvement, 0)} expected gain
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {formatPercent(recommendation.confidence, 0)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-[var(--ink)]">
                    {buildCoachRecommendation(recommendation)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Predicted gain {formatPercent(recommendation.improvement, 0)} with{" "}
                    {formatPercent(recommendation.confidence, 0)} confidence.
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Similar Sequences</CardTitle>
                <CardDescription>
                  Nearest-neighbor retrieval from the sequence search endpoint.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {data.searchSequences.similar_sequences.map((sequence) => (
                <div
                  key={`${sequence.match_id}-${sequence.time}`}
                  className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-[var(--ink)]">
                      {sequence.match_id} at {sequence.time}s
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatPercent(sequence.similarity_score, 0)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatLabel(sequence.phase)} led to {formatLabel(sequence.outcome)}.
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <PhaseTimeline
          phases={data.matchReport.phase_summary}
          windows={phaseWindows}
          selectedWindowId={activePhaseWindow.id}
          onSelectWindow={onPhaseWindowChange}
        />
        <PressingReport report={data.matchReport.pressing_report} />
        <TransitionReport report={data.matchReport.transition_report} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <FormationView
          formationChanges={data.matchReport.formation_changes}
          teamShapeReport={data.matchReport.team_shape_report}
        />
        <PossessionChains chains={data.matchReport.possession_chains} />
      </section>

      <section>
        <PassNetwork players={data.pitchPlayers} lanes={data.pitchPassingLanes} />
      </section>
    </div>
  );
}
