# Codex CLI Launch Prompts

## How to use these prompts

Feed one phase prompt at a time to Codex CLI. Wait for completion and verify before moving to the next phase.

Before starting Phase 1, make sure these files are in your project directory:
- `AGENTS.md` (Codex instructions)
- `BUILD_PLAN.md` (complete project plan)
- `build_journal.md` (dev provenance tracking)

---

## Phase 1 Prompt

```
Read AGENTS.md and BUILD_PLAN.md carefully before doing anything.

Execute Phase 1: Foundation (Days 1-3) from BUILD_PLAN.md.

Step by step:

1. Initialize the project with `uv init` and create `pyproject.toml` with ALL dependencies listed in AGENTS.md. Set the project name to "soccer-physics-engine" and the package name to "spe". Set Python version to >=3.12.

2. Create the complete directory structure from BUILD_PLAN.md — every folder under src/, tests/, configs/, data/, notebooks/, frontend/, infra/, assets/. Add __init__.py to every Python package directory.

3. Create configuration files:
   - `.gitignore` (Python, Node, data files, .env, build_journal.md, __pycache__, .mypy_cache, .ruff_cache, mlflow artifacts, *.egg-info, dist/, data/raw/, data/processed/)
   - `ruff` config in pyproject.toml (line-length=100, target Python 3.12, isort compatible)
   - `mypy` config in pyproject.toml (strict=true, ignore_missing_imports=true)
   - `pytest` config in pyproject.toml (testpaths=["tests"])
   - `.env.example` with placeholder AWS credentials and config paths

4. Create `src/utils/constants.py` with:
   - PITCH_LENGTH_M = 105.0
   - PITCH_WIDTH_M = 68.0
   - TRACKING_FPS = 25
   - HIGH_INTENSITY_THRESHOLD_MS = 5.5
   - SHARP_DECEL_THRESHOLD_MS2 = -3.0
   - SMOOTHING_WINDOW = 7
   - SMOOTHING_POLYORDER = 2

5. Create `src/utils/config.py` — YAML config loading with dataclass-based config objects.

6. Create `src/io/metrica_loader.py`:
   - Function `load_tracking_data(match_id: str) -> pl.DataFrame` that uses Kloppy to load Metrica tracking data, converts to Polars DataFrame with columns: frame_id, timestamp, player_id, team, x, y, ball_x, ball_y
   - Normalize coordinates to meters (multiply by PITCH_LENGTH_M and PITCH_WIDTH_M)
   - Handle both "sample_game_1" and "sample_game_2"

7. Create `src/io/schemas.py`:
   - Pandera DataFrameSchema for tracking data: frame_id (int), timestamp (float >= 0), player_id (str), team (str, isin ["home", "away"]), x (float, 0-105), y (float, 0-68)
   - Validation function that checks for NaN values and out-of-bounds coordinates

8. Create `src/physics/smoothing.py`:
   - Function `smooth_positions(positions: np.ndarray, window: int = 7, polyorder: int = 2) -> np.ndarray` using scipy.signal.savgol_filter
   - Handle edge cases: arrays shorter than window, NaN values

9. Create `src/physics/kinematics.py`:
   - `compute_velocity(positions: np.ndarray, dt: float) -> np.ndarray` — first derivative via finite differences
   - `compute_acceleration(velocity: np.ndarray, dt: float) -> np.ndarray` — first derivative of velocity
   - `compute_jerk(acceleration: np.ndarray, dt: float) -> np.ndarray` — first derivative of acceleration
   - `compute_speed(velocity: np.ndarray) -> np.ndarray` — magnitude of velocity vector
   - `compute_kinematic_profiles(x: np.ndarray, y: np.ndarray, fps: int = 25) -> dict` — full pipeline: smooth → velocity → acceleration → jerk → speed, returns dict with all arrays
   - All functions must handle 2D arrays (x, y components)

10. Create `src/physics/spatial.py`:
    - `compute_pressure(player_pos: np.ndarray, opponent_positions: np.ndarray, radius: float = 5.0) -> float` — count opponents within radius
    - `compute_nearest_teammates(player_pos: np.ndarray, team_positions: np.ndarray, k: int = 3) -> np.ndarray` — distances to k nearest teammates
    - `compute_distance_matrix(positions: np.ndarray) -> np.ndarray` — pairwise distances

11. Create tests:
    - `tests/test_kinematics.py`:
      - Test constant position → zero velocity, zero acceleration
      - Test constant velocity → zero acceleration
      - Test known linear motion: position = [0, 1, 2, 3, 4] → velocity = [1, 1, 1, 1] (approx)
      - Test compute_speed returns scalar magnitudes
    - `tests/test_spatial.py`:
      - Test pressure with known opponent positions
      - Test nearest teammates with hand-computed distances

12. Create `Makefile` with targets: dev, test, lint, typecheck, format, run-api, docker-build, docker-run

13. Update build_journal.md with Phase 1 completion entry following the format in AGENTS.md.

14. Git commit: "feat: complete phase 1 — foundation, data loading, kinematics"

IMPORTANT: Follow all rules in AGENTS.md, especially:
- Type hints on ALL function signatures
- Google-style docstrings on all public functions
- Unit coordinates must be meters (convert from Metrica 0-1 range)
- Smoothing MUST happen before differentiation
- Acceleration = derivative of velocity, NOT second derivative of position directly
```

---

## Phase 2 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 2: Pitch Control + Passing (Days 4-5) from BUILD_PLAN.md.

1. Create `src/physics/pitch_control.py`:
   - `compute_player_influence(player_pos, player_vel, target_points, max_speed=8.0) -> np.ndarray` — time for player to reach each target point considering current velocity and direction
   - `compute_pitch_control(home_positions, home_velocities, away_positions, away_velocities, grid_resolution=50) -> np.ndarray` — for each point on a grid covering the pitch, compute which team controls it based on who can reach it first (weighted by velocity direction)
   - `compute_team_pitch_control_pct(pitch_control_grid) -> float` — percentage of pitch controlled by the home team
   - `compute_zone_control(pitch_control_grid, zones: list[tuple]) -> dict` — pitch control percentage in specific zones (defensive third, middle third, attacking third)

2. Create `src/physics/passing_lanes.py`:
   - `compute_pass_probability(passer_pos, receiver_pos, opponent_positions, opponent_velocities, ball_speed=15.0) -> float` — probability of successful pass considering opponent interception
   - `find_passing_options(ball_carrier_pos, team_positions, opponent_positions, opponent_velocities, min_probability=0.3) -> list[dict]` — all viable passing options with probability scores
   - `count_safe_passing_lanes(ball_carrier_pos, team_positions, opponent_positions, opponent_velocities, threshold=0.5) -> int` — number of high-probability passing options

3. Write tests:
   - `tests/test_pitch_control.py`: Test with known player positions, verify influence zones are reasonable, verify team control percentages sum to ~1.0
   - `tests/test_passing_lanes.py`: Test pass probability with no opponents (should be ~1.0), test with opponent directly in path (should be low), test edge cases

4. Update build_journal.md. Git commit: "feat: complete phase 2 — pitch control and passing lanes"
```

---

## Phase 3 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 3: Team Shape + Formation (Days 6-7) from BUILD_PLAN.md.

Build ALL of these files:
- src/tactical/team_shape.py (compactness via ConvexHull, width, depth, defensive line height, inter-line distance)
- src/tactical/formation.py (KMeans clustering on average positions to detect formations)
- src/tactical/territorial.py (ball territory %, possession chain extraction from events)
- src/tactical/overloads.py (grid-based numerical superiority detection)
- src/tactical/vulnerability.py (defensive gap detection, exposed flanks, unmarked runners)
- src/tactical/dangerous_possessions.py (possessions entering penalty area)

Write tests for team_shape and formation. Update build_journal.md.
Git commit: "feat: complete phase 3 — team shape, formation, territorial analysis"
```

---

## Phase 4 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 4: Phase Detection + Pressing + Transitions (Days 8-10) from BUILD_PLAN.md.

Build ALL of these files:
- src/tactical/phase_detector.py (rule-based classifier: build-up, progression, chance creation, pressing, counter-pressing, defensive recovery, transition, set piece)
- src/tactical/pressing.py (PPDA computation, pressing trigger detection, counter-press speed, pressing effectiveness %)
- src/tactical/transitions.py (transition detection from possession changes, transition speed, defensive shape recovery time)
- src/tactical/set_pieces.py (positioning analysis at corners/free kicks, marking assignment detection)

Write tests for phase_detector, pressing, and transitions. Update build_journal.md.
Git commit: "feat: complete phase 4 — phase detection, pressing, transitions"
```

---

## Phase 5 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 5: Graph Model + State Scoring (Days 11-13) from BUILD_PLAN.md.

Build ALL of these files:
- src/graph/build_graph.py (construct player interaction graph per frame)
- src/graph/node_features.py (12-dim feature vector: x, y, vx, vy, ax, ay, speed, team one-hot, has_ball, pressure, space)
- src/graph/edge_features.py (5-dim: distance, angle, closing_speed, passability, same_team)
- src/graph/temporal_graph.py (sequences of graph snapshots over time windows)
- src/graph/nx_prototype.py (NetworkX-based prototype for notebook exploration)
- src/models/state_scorer.py (composite tactical state score from pitch control, passing lanes, support, pressure, team shape)
- src/models/expected_threat.py (logistic regression: goal probability from ball position + spatial context)
- src/models/baseline.py (GradientBoostingClassifier: predict "does situation improve in next 3s?")
- src/models/train.py (training pipeline with MLflow experiment tracking)
- src/models/evaluate.py (evaluation metrics: AUC, precision, recall, calibration)
- src/models/registry.py (MLflow model registry interface)

Write tests for graph construction and state scorer. Update build_journal.md.
Git commit: "feat: complete phase 5 — graph model, state scoring, baseline ML"
```

---

## Phase 6 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 6: Recommendation Engine (Days 14-16) from BUILD_PLAN.md.

Build ALL of these files:
- src/recommend/candidate_moves.py (generate candidate movement options: shift each off-ball player ±2m, ±4m in 8 directions)
- src/recommend/scorer.py (score each candidate by recomputing state score with hypothetical position)
- src/recommend/multi_player.py (greedy multi-player optimization: find best move, fix it, find next best, iterate for 3-4 players)
- src/recommend/explain.py (template-based plain-English explanations: "Move wider because it creates N passing lanes and shifts pitch control by X%")
- src/recommend/optimizer.py (select top-k movements, rank by improvement, filter by minimum confidence)
- src/search/similarity.py (compute feature vectors for possession sequences, cosine similarity search across matches)

Write tests for recommendations. Update build_journal.md.
Git commit: "feat: complete phase 6 — recommendation engine with multi-player coordination"
```

---

## Phase 7 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 7: Player Intelligence + Load (Days 17-19) from BUILD_PLAN.md.

Build ALL player_intel files:
- src/player_intel/off_ball_runs.py (classify runs by direction vector: diagonal, overlap, underlap, dropping, stretching)
- src/player_intel/space_creation.py (track defender displacement caused by attacker runs)
- src/player_intel/role_detection.py (KMeans on heat map features to infer actual playing role)
- src/player_intel/heat_maps.py (2D gaussian_kde per player)
- src/player_intel/pass_network.py (pass frequency matrix, centrality per player)
- src/player_intel/progressive_passes.py (passes moving ball 10m+ toward goal)

Build ALL load files:
- src/load/metrics.py (HI distance, sharp decel event count, CoD load)
- src/load/asymmetry.py (L/R deceleration comparison)
- src/load/fatigue.py (physical output per 15-min window)
- src/load/sprint_profiles.py (max speed, acceleration profile per sprint)
- src/load/work_rate.py (distance/min in vs out of possession)
- src/load/flags.py (percentile-based load monitoring flags — NOT injury prediction)

Write tests for load metrics and off_ball_runs. Update build_journal.md.
Git commit: "feat: complete phase 7 — player intelligence and physical load monitoring"
```

---

## Phase 8 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 8: Evaluation Framework (Days 20-21) from BUILD_PLAN.md.

Build ALL evaluation files:
- src/evaluation/outcome_correlation.py (correlate state scores with positive outcomes in event data)
- src/evaluation/counterfactual_check.py (verify recommendations improve state score under simulation)
- src/evaluation/perturbation.py (add ±0.5m noise, check recommendation stability)
- src/evaluation/case_studies.py (10 known tactical patterns, verify recommendations pass smell test)

Build unified report files:
- src/unified/player_report.py (tactical value + load + efficiency composite)
- src/unified/match_report.py (full match: phases, pressing, transitions, possessions, shape)
- src/unified/team_report.py (team-level summary with per-player breakdown)

Write tests for evaluation. Update build_journal.md.
Git commit: "feat: complete phase 8 — evaluation framework and unified reports"
```

---

## Phase 9 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 9: API + Docker (Days 22-24) from BUILD_PLAN.md.

Build ALL api files:
- src/api/schemas.py (Pydantic models for ALL 7 endpoints defined in BUILD_PLAN.md)
- src/api/dependencies.py (dependency injection: model loading, data access, config)
- src/api/routes.py (implement ALL endpoints: POST /analyze-sequence, POST /match-report, POST /load-report, POST /search-sequences, GET /player-profile/{player_id}, GET /health, GET /model-info)
- src/api/main.py (FastAPI app with CORS middleware, structured logging, error handling)
- src/api/middleware.py (request logging, timing, error response formatting)

Write tests/test_api.py using FastAPI TestClient.

Create Dockerfile:
- Multi-stage build (builder stage for dependencies, runtime stage for production)
- Use python:3.12-slim as base
- Copy only necessary files
- Expose port 8000
- CMD: uvicorn src.api.main:app --host 0.0.0.0 --port 8000

Update Makefile with docker-build and docker-run targets.
Update build_journal.md.
Git commit: "feat: complete phase 9 — FastAPI service with Docker"
```

---

## Phase 10 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 10: AWS Deployment (Days 25-27) from BUILD_PLAN.md.

Create infrastructure files:
- infra/architecture.md (document the full deployment architecture with text diagram)
- infra/ecs-task-definition.json (ECS Fargate task definition for the API container)
- infra/api-gateway.yaml (API Gateway configuration)
- infra/cloudwatch-alarms.yaml (CloudWatch alarm definitions for error rates, latency)

Create CI/CD workflows:
- .github/workflows/ci.yml (on push: install deps, lint, type check, run tests)
- .github/workflows/deploy.yml (on merge to main: build Docker image, push to ECR, update ECS service)

Create configs/aws.yaml with placeholder values for all AWS resource ARNs.

Update build_journal.md.
Git commit: "feat: complete phase 10 — AWS infrastructure and CI/CD"
```

---

## Phase 11 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 11: Frontend (Days 28-34) from BUILD_PLAN.md.

Initialize the frontend:
- cd frontend && npm create vite@latest . -- --template react-ts
- npm install tailwindcss @tailwindcss/vite d3 recharts @types/d3
- Set up Tailwind CSS with Vite plugin
- Install shadcn/ui components: card, tabs, table, badge, button, select, slider

Build the layout:
- src/components/layout/Navigation.tsx (3 tabs: Match Analysis, Load Monitor, Player Intelligence)
- src/components/layout/Shell.tsx (app shell with navigation)
- src/api/client.ts (typed fetch wrapper for all FastAPI endpoints)
- src/types/index.ts (TypeScript types matching Pydantic schemas)

Build shared components:
- src/components/shared/MetricCard.tsx
- src/components/shared/RiskBadge.tsx (green/amber/red)
- src/components/shared/InsightBox.tsx
- src/components/shared/TimelineScrubber.tsx

Build the pitch visualization (D3.js):
- src/components/pitch/PitchCanvas.tsx (green field, white lines, goals, penalty boxes, center circle)
- src/components/pitch/PlayerDots.tsx (positioned from tracking data, color by team)
- src/components/pitch/PitchControl.tsx (heatmap overlay)
- src/components/pitch/PassingLanes.tsx (dotted lines with opacity = probability)
- src/components/pitch/Recommendations.tsx (movement arrows)
- src/components/pitch/Overloads.tsx (highlighted zones)
- src/components/pitch/TeamShape.tsx (convex hull, formation lines)

Build tactical components:
- src/components/tactical/PhaseTimeline.tsx (color-coded phase bar across match time)
- src/components/tactical/PressingReport.tsx (PPDA chart, pressing events)
- src/components/tactical/TransitionReport.tsx
- src/components/tactical/FormationView.tsx
- src/components/tactical/PossessionChains.tsx
- src/components/tactical/PassNetwork.tsx

Build load components:
- src/components/load/PlayerTable.tsx (sortable with risk badges)
- src/components/load/FatigueCurves.tsx (Recharts line chart)
- src/components/load/DecelChart.tsx (bar chart)
- src/components/load/AsymmetryView.tsx

Build intelligence components:
- src/components/intelligence/EfficiencyScatter.tsx
- src/components/intelligence/RoleMap.tsx
- src/components/intelligence/RunClassification.tsx
- src/components/intelligence/PlayerComparison.tsx

Assemble pages:
- src/pages/MatchAnalysis.tsx
- src/pages/LoadMonitor.tsx
- src/pages/PlayerIntelligence.tsx

Update build_journal.md.
Git commit: "feat: complete phase 11 — React dashboard with D3 pitch visualization"
```

---

## Phase 12 Prompt

```
Read AGENTS.md, BUILD_PLAN.md, and build_journal.md before starting.

Execute Phase 12: Polish + Documentation (Days 35-37) from BUILD_PLAN.md.

1. Write a comprehensive README.md with:
   - Project title, one-line mission, layman explanation
   - The physics narrative (trajectory modeling → soccer analytics)
   - Architecture diagram (text-based)
   - Feature overview (42 features grouped by layer)
   - Tech stack table with rationale
   - Screenshots section (placeholder for now)
   - Setup instructions (local dev, Docker, AWS)
   - API documentation summary with example requests/responses
   - Evaluation results summary
   - Future roadmap (GNN, video/pose integration, more matches)
   - Acknowledgments (Metrica Sports, StatsBomb, Kloppy)

2. Add docstrings to any public functions missing them.

3. Ensure all tests pass: `uv run pytest tests/ -v`

4. Ensure lint clean: `uv run ruff check src/ tests/`

5. Ensure types clean: `uv run mypy src/`

6. Create data/README.md with data dictionary.

7. Create configs/default.yaml with sensible defaults for all configurable parameters.

8. Finalize build_journal.md with Key Decisions & Reflections section.

9. Git commit: "feat: complete phase 12 — documentation and polish"
10. Git tag: v1.0.0
```
