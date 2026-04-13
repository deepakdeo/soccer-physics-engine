# Soccer Physics Engine — Definitive Build Plan (v2)

## Mission

Build a cloud-deployed, physics-based soccer analytics platform that extracts tactical intelligence, biomechanical load monitoring, and player movement insights from tracking data — covering all three pillars of the U.S. Soccer Data Scientist role.

**Layman version:** "It watches where every player moves on the field and tells coaches what tactical patterns are working, which players are creating hidden value, who's at physical risk, and what movement would improve the team's next play."

---

## Data Sources

### Primary: Metrica Sports Open Data
- Two complete sample matches with synchronized tracking (x,y at 25fps for 22 players + ball) and event data (passes, shots, tackles with timestamps)
- ~2.5 million position records per match
- GitHub: https://github.com/metrica-sports/sample-data
- Loaded via Kloppy: https://kloppy.pysport.org/

### Secondary: StatsBomb Open Data
- Event data, lineups, 360 freeze-frame data for hundreds of matches
- GitHub: https://github.com/statsbomb/open-data

---

## Complete Feature Set (42 features)

### A. Physics Engine Layer (foundation — everything else depends on this)

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| A1 | Position smoothing | Savitzky-Golay filter on raw tracking positions | SciPy signal | ~30 |
| A2 | Velocity computation | First derivative of smoothed position | NumPy finite diff | ~20 |
| A3 | Acceleration computation | Second derivative of smoothed position | NumPy finite diff | ~20 |
| A4 | Jerk computation | Third derivative — biomechanically meaningful | NumPy finite diff | ~20 |
| A5 | Pitch control model | Velocity-weighted spatial influence fields per player | SciPy Voronoi + KDTree | ~150 |
| A6 | Passing lane computation | Ray-casting from ball carrier to teammates with interception check | NumPy geometry | ~120 |
| A7 | Spatial density / pressure | Count of opponents within distance threshold, closing speed | KDTree queries | ~60 |

### B. Tactical Intelligence Layer

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| B1 | Phase-of-play detection | Classify each frame: build-up, progression, chance creation, pressing, counter-pressing, defensive recovery, transition, set piece | Rule-based classifier on spatial features | ~200 |
| B2 | Team compactness | Convex hull area of 10 outfield players per team | SciPy ConvexHull | ~30 |
| B3 | Team width and depth | Lateral spread (max x - min x) and front-to-back stretch | NumPy min/max | ~20 |
| B4 | Defensive line height | Average y-position of the back 4, tracked over time | NumPy mean with clustering | ~40 |
| B5 | Inter-line distance | Gap between defense centroid and midfield centroid | NumPy clustering + diff | ~40 |
| B6 | Formation detection | Cluster player average positions to detect 4-3-3 vs 4-2-3-1 etc. | scikit-learn KMeans | ~100 |
| B7 | Pressing intensity (PPDA) | Passes allowed per defensive action in opponent half | Event data aggregation | ~40 |
| B8 | Pressing trigger detection | Moment of coordinated distance-closing on ball carrier | Velocity + distance thresholds | ~80 |
| B9 | Counter-press speed | Time for 3+ players to close within 5m after turnover | Event + tracking fusion | ~60 |
| B10 | Pressing effectiveness | % of presses winning ball back within 5 seconds | Event + tracking fusion | ~50 |
| B11 | Transition detection | Detect defensive-to-offensive and offensive-to-defensive transitions | Possession change + tracking | ~80 |
| B12 | Transition speed | Time for team to get N players ahead of ball after winning it | Tracking aggregation | ~50 |
| B13 | Defensive shape recovery | Time to reform compact block after losing possession | Compactness time series | ~50 |
| B14 | Territorial dominance | % time ball in each third, per team | Ball position binning | ~20 |
| B15 | Support distance | Average distance of nearest 2-3 teammates to ball carrier | KDTree per frame | ~30 |
| B16 | Overload detection | Zones where one team has numerical superiority | Grid-based player counting | ~80 |
| B17 | Defensive vulnerability | Gaps between defenders, exposed flanks, unmarked runners | Spatial gap analysis | ~100 |
| B18 | Pass network | Who passes to whom, frequency, direction | Event data aggregation | ~50 |
| B19 | Progressive passes | Passes moving ball 10m+ toward goal | Event data filtering | ~20 |
| B20 | Possession chain analysis | How possessions develop, where they start/end, classification | Event + tracking fusion | ~100 |
| B21 | Dangerous possession detection | Possessions entering penalty area or creating shots | Event filtering + tracking | ~40 |
| B22 | Set piece positioning | Marking assignments + spatial gaps at corners/free kicks | Tracking at event timestamps | ~100 |
| B23 | Sequence similarity search | Find tactically similar moments across matches using feature vectors | Cosine similarity on graph features | ~200 |

### C. Player Interaction Graph Layer

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| C1 | Graph construction | Build player interaction graph per frame (22 nodes + ball) | NetworkX (prototype), PyG (prod) | ~150 |
| C2 | Node features | Position, velocity, acceleration, team, role, local pressure, local space | NumPy feature vectors | ~80 |
| C3 | Edge features | Distance, angle, passability, closing speed, same_team, support | NumPy pairwise computation | ~100 |
| C4 | Tactical state scorer | Composite score (0-1) from pitch control, passing lanes, support shape, pressure | Weighted combination → ML model | ~150 |
| C5 | Movement recommender | Generate candidate moves, score each, return best with explanation | Counterfactual simulation | ~250 |
| C6 | Multi-player coordinated reco | Greedy optimization of team shape (3-4 players simultaneously) | Iterative counterfactual | ~200 |
| C7 | Explanation engine | Generate plain-English descriptions of why recommendations help | Template-based NLG | ~100 |
| C8 | Expected threat model | Goal probability given ball position + all player positions | Logistic regression on spatial features | ~150 |

### D. Player Intelligence Layer

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| D1 | Off-ball run classification | Classify runs: diagonal, overlap, underlap, dropping, stretching | Direction vector analysis | ~120 |
| D2 | Space creation attribution | When space opens, attribute it to the player whose run caused it | Defender displacement tracking | ~150 |
| D3 | Player role detection | Infer actual role from movement patterns, not lineup | KMeans on heat map features | ~100 |
| D4 | Player heat maps | 2D kernel density of player positions across match | SciPy gaussian_kde | ~30 |

### E. Physical Load Layer

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| E1 | High-intensity distance | Cumulative distance above 5.5 m/s threshold | Velocity integration | ~20 |
| E2 | Sharp deceleration events | Braking events below -3 m/s² | Threshold detection | ~30 |
| E3 | Change-of-direction load | Angular velocity × linear velocity² at direction changes | Vector calculus | ~60 |
| E4 | L/R asymmetry | Left vs right deceleration intensity comparison | Directional filtering | ~60 |
| E5 | Within-match fatigue curves | Sprint speed, HI distance, accel count per 15-min window | Windowed aggregation | ~40 |
| E6 | Sprint profiles | Max speed, time to max speed, decel from max speed per player | Peak detection | ~50 |
| E7 | Work rate in/out of possession | Distance per minute split by possession state | Event-triggered segmentation | ~40 |
| E8 | Load monitoring flags | Flag players whose load exceeds within-match norms (NOT injury prediction) | Percentile-based thresholds | ~50 |

### F. Evaluation Framework

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| F1 | Outcome correlation | Does state score correlate with positive outcomes (successful pass, shot, territory gain)? | Event data cross-reference | ~100 |
| F2 | Counterfactual consistency | Do recommendations improve the state score under simulation? | Automated scoring check | ~60 |
| F3 | Case study validation | Manual review of 10 known tactical patterns | Notebook with documented cases | ~200 |
| F4 | Perturbation stability | Do recommendations hold under ±0.5m Gaussian noise? | Monte Carlo perturbation | ~80 |

### G. Pose Estimation (Research Notebook Only — NOT in API)

| # | Feature | Description | Implementation | Lines |
|---|---------|-------------|----------------|-------|
| G1 | Skeletal keypoint extraction | MediaPipe Pose on sample video | MediaPipe pipeline | ~60 |
| G2 | Joint angles | Knee flexion, hip extension from keypoints | Coordinate geometry | ~40 |
| G3 | Stride metrics | Stride length, frequency, asymmetry | Peak detection on ankle keypoints | ~50 |

---

## Tech Stack

### Data Layer
- **Kloppy** — standardized tracking data loading
- **Polars** — fast tabular processing (convert from Kloppy's pandas output)
- **pandas** — interop where libraries require it
- **Pandera** — data validation schemas
- **DVC** — data versioning
- **AWS S3** — data + artifact storage

### Physics / Computation
- **NumPy** — vectorized numerical computation
- **SciPy** — signal processing (Savitzky-Golay), spatial (Voronoi, KDTree, ConvexHull)
- **NetworkX** — graph prototyping in notebooks only
- **PyTorch** — deep learning framework
- **PyTorch Geometric** — production graph neural networks

### ML / Experiment
- **scikit-learn** — baseline models (gradient boosting, KMeans, logistic regression)
- **MLflow** — experiment tracking + model registry
- **MediaPipe** — pose estimation (notebook only)

### API / Service
- **FastAPI** — API framework
- **Pydantic** — request/response validation
- **Uvicorn** — ASGI server
- **Docker** — containerization

### Frontend
- **React** + **TypeScript** — UI framework
- **Vite** — build tool
- **Tailwind CSS** — styling
- **shadcn/ui** — production UI components
- **D3.js** — custom soccer pitch visualization
- **Recharts** — standard charts

### AWS Deployment
- **ECR** — Docker image registry
- **ECS Fargate** — serverless container orchestration
- **API Gateway** — API front door with rate limiting
- **CloudWatch** — logs, metrics, alarms

### Quality / DevOps
- **pytest** — testing
- **ruff** — linting
- **mypy** — type checking
- **GitHub Actions** — CI/CD
- **uv** — package management
- **pyproject.toml** — project config (PEP 621)

### Visualization (Notebooks)
- **matplotlib** + **mplsoccer** — pitch plots
- **Plotly** — interactive charts

---

## API Endpoints

### `POST /analyze-sequence`
Primary endpoint. Tactical state + movement recommendations + load snapshot.
Input: dataset, match_id, start_time_s, end_time_s, focus_team, focus_player_id, mode
Output: state_score, pitch_control, recommendations[], predicted_improvement, explanation, load_snapshot, phase_classification, confidence

### `POST /match-report`
Full-match tactical and physical report.
Input: dataset, match_id
Output: phase_summary, possession_chains[], pressing_report, transition_report, team_shape_report, player_load_profiles[], fatigue_curves, formation_changes

### `POST /load-report`
Full-match biomechanical load report.
Input: dataset, match_id, player_id (optional)
Output: player_load_profiles[] with HI_distance, decel_events, CoD_load, asymmetry, fatigue_curve, load_flags

### `POST /search-sequences`
Find tactically similar moments across matches.
Input: dataset, match_id, reference_time_s, similarity_threshold
Output: similar_sequences[] with match_id, time, similarity_score, phase, outcome

### `GET /player-profile/{player_id}`
Player intelligence profile across analyzed matches.
Output: role_detected, run_types, space_creation_score, movement_efficiency, heat_map_data, off_ball_value

### `GET /health`
Service health check.

### `GET /model-info`
Model version, feature set, training metadata.

---

## Repository Structure

```
soccer-physics-engine/
├── AGENTS.md                       # Codex CLI instructions
├── BUILD_PLAN.md                   # This file
├── README.md
├── build_journal.md                # Dev provenance tracking (gitignored)
├── pyproject.toml
├── uv.lock
├── Dockerfile
├── Makefile
├── .env.example
│
├── configs/
│   ├── default.yaml
│   ├── model.yaml
│   ├── features.yaml               # Feature weights and thresholds
│   └── aws.yaml
│
├── data/
│   ├── raw/                        # Metrica/StatsBomb (DVC tracked)
│   ├── processed/                   # Computed features (DVC tracked)
│   └── README.md                    # Data dictionary
│
├── notebooks/
│   ├── 01_explore_metrica.ipynb
│   ├── 02_kinematics_demo.ipynb
│   ├── 03_pitch_control_demo.ipynb
│   ├── 04_team_shape_analysis.ipynb
│   ├── 05_graph_exploration.ipynb
│   ├── 06_pressing_analysis.ipynb
│   ├── 07_transition_analysis.ipynb
│   ├── 08_biomech_load_demo.ipynb
│   ├── 09_baseline_model.ipynb
│   ├── 10_evaluation_framework.ipynb
│   ├── 11_unified_report_demo.ipynb
│   └── 12_pose_prototype.ipynb      # Research notebook only
│
├── src/
│   ├── __init__.py
│   │
│   ├── io/
│   │   ├── __init__.py
│   │   ├── metrica_loader.py
│   │   ├── statsbomb_loader.py
│   │   ├── schemas.py               # Pandera validation
│   │   └── transforms.py            # pandas → Polars
│   │
│   ├── physics/
│   │   ├── __init__.py
│   │   ├── smoothing.py             # Savitzky-Golay filtering
│   │   ├── kinematics.py            # velocity, acceleration, jerk
│   │   ├── pitch_control.py         # Velocity-weighted Voronoi influence
│   │   ├── passing_lanes.py         # Ray-casting pass probability
│   │   └── spatial.py               # Pressure, density, nearest-neighbor
│   │
│   ├── tactical/
│   │   ├── __init__.py
│   │   ├── phase_detector.py        # Phase-of-play classification
│   │   ├── team_shape.py            # Compactness, width, depth, lines
│   │   ├── formation.py             # Formation detection via clustering
│   │   ├── pressing.py              # PPDA, triggers, effectiveness, counter-press
│   │   ├── transitions.py           # Transition detection, speed, recovery
│   │   ├── territorial.py           # Ball territory, possession chains
│   │   ├── set_pieces.py            # Corner/FK positioning analysis
│   │   ├── overloads.py             # Numerical superiority zones
│   │   ├── vulnerability.py         # Defensive gaps, exposed flanks
│   │   └── dangerous_possessions.py # Possessions reaching penalty area
│   │
│   ├── graph/
│   │   ├── __init__.py
│   │   ├── build_graph.py           # Player interaction graph per frame
│   │   ├── node_features.py         # Position, velocity, accel, team, etc.
│   │   ├── edge_features.py         # Distance, angle, passability, pressure
│   │   ├── temporal_graph.py        # Graph sequences over time windows
│   │   └── nx_prototype.py          # NetworkX prototype (notebooks only)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── state_scorer.py          # Tactical state scoring
│   │   ├── baseline.py              # scikit-learn gradient boosting
│   │   ├── expected_threat.py       # xT from position + context
│   │   ├── train.py                 # Training pipeline
│   │   ├── evaluate.py              # Evaluation metrics
│   │   └── registry.py              # MLflow interface
│   │
│   ├── recommend/
│   │   ├── __init__.py
│   │   ├── candidate_moves.py       # Generate movement options
│   │   ├── scorer.py                # Score candidates via state model
│   │   ├── multi_player.py          # Coordinated multi-player optimization
│   │   ├── explain.py               # Plain-English explanations
│   │   └── optimizer.py             # Select best movement(s)
│   │
│   ├── player_intel/
│   │   ├── __init__.py
│   │   ├── off_ball_runs.py         # Run classification
│   │   ├── space_creation.py        # Space creation attribution
│   │   ├── role_detection.py        # Role inference from movement
│   │   ├── heat_maps.py             # 2D kernel density
│   │   ├── pass_network.py          # Pass network analysis
│   │   └── progressive_passes.py    # Progressive pass identification
│   │
│   ├── load/
│   │   ├── __init__.py
│   │   ├── metrics.py               # HI distance, decel events, CoD load
│   │   ├── asymmetry.py             # L/R asymmetry detection
│   │   ├── fatigue.py               # Within-match fatigue curves
│   │   ├── sprint_profiles.py       # Max speed, acceleration profiles
│   │   ├── work_rate.py             # Distance per minute in/out of possession
│   │   └── flags.py                 # Load monitoring flags (NOT injury prediction)
│   │
│   ├── evaluation/
│   │   ├── __init__.py
│   │   ├── outcome_correlation.py   # State score vs positive outcomes
│   │   ├── counterfactual_check.py  # Do recos improve score?
│   │   ├── perturbation.py          # Stability under noise
│   │   └── case_studies.py          # Known tactical pattern validation
│   │
│   ├── search/
│   │   ├── __init__.py
│   │   └── similarity.py            # Sequence similarity search
│   │
│   ├── unified/
│   │   ├── __init__.py
│   │   ├── player_report.py         # Tactical + load + efficiency
│   │   ├── match_report.py          # Full match tactical report
│   │   └── team_report.py           # Team-level summary
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app
│   │   ├── routes.py                # Endpoint definitions
│   │   ├── schemas.py               # Pydantic models
│   │   ├── dependencies.py          # DI (model loading, data access)
│   │   └── middleware.py            # Logging, CORS, error handling
│   │
│   └── utils/
│       ├── __init__.py
│       ├── config.py                # YAML config loading
│       ├── logging.py               # Structured logging
│       └── constants.py             # Pitch dimensions, thresholds
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navigation.tsx
│       │   │   └── Shell.tsx
│       │   ├── pitch/
│       │   │   ├── PitchCanvas.tsx
│       │   │   ├── PlayerDots.tsx
│       │   │   ├── PitchControl.tsx
│       │   │   ├── PassingLanes.tsx
│       │   │   ├── Recommendations.tsx
│       │   │   ├── Overloads.tsx
│       │   │   └── TeamShape.tsx
│       │   ├── tactical/
│       │   │   ├── PhaseTimeline.tsx
│       │   │   ├── PressingReport.tsx
│       │   │   ├── TransitionReport.tsx
│       │   │   ├── FormationView.tsx
│       │   │   ├── PossessionChains.tsx
│       │   │   └── PassNetwork.tsx
│       │   ├── load/
│       │   │   ├── PlayerTable.tsx
│       │   │   ├── FatigueCurves.tsx
│       │   │   ├── DecelChart.tsx
│       │   │   └── AsymmetryView.tsx
│       │   ├── intelligence/
│       │   │   ├── EfficiencyScatter.tsx
│       │   │   ├── RoleMap.tsx
│       │   │   ├── RunClassification.tsx
│       │   │   └── PlayerComparison.tsx
│       │   └── shared/
│       │       ├── MetricCard.tsx
│       │       ├── RiskBadge.tsx
│       │       ├── InsightBox.tsx
│       │       └── TimelineScrubber.tsx
│       ├── pages/
│       │   ├── MatchAnalysis.tsx      # Primary tactical view
│       │   ├── LoadMonitor.tsx        # Physical load dashboard
│       │   └── PlayerIntelligence.tsx # Scout/analyst view
│       ├── hooks/
│       │   ├── useMatchData.ts
│       │   └── usePlayerProfile.ts
│       └── types/
│           └── index.ts
│
├── tests/
│   ├── test_kinematics.py
│   ├── test_pitch_control.py
│   ├── test_passing_lanes.py
│   ├── test_phase_detector.py
│   ├── test_team_shape.py
│   ├── test_pressing.py
│   ├── test_transitions.py
│   ├── test_graph_build.py
│   ├── test_state_scorer.py
│   ├── test_recommendation.py
│   ├── test_load_metrics.py
│   ├── test_evaluation.py
│   └── test_api.py
│
├── infra/
│   ├── architecture.md
│   ├── ecs-task-definition.json
│   ├── api-gateway.yaml
│   └── cloudwatch-alarms.yaml
│
├── assets/
│   ├── architecture_diagram.png
│   └── demo_screenshots/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .dvc/
│   └── config
├── .gitignore
└── .env.example
```

---

## Build Phases

### Phase 1: Foundation (Days 1-3)
**Goal:** Repo skeleton, data loading, kinematics working.

- Initialize repo with `uv init`, pyproject.toml with all dependencies
- Set up ruff, mypy, pytest configs
- Set up GitHub repo with CI workflow
- Initialize build_journal.md
- Download Metrica sample data
- Build `src/io/metrica_loader.py` using Kloppy
- Build `src/io/schemas.py` with Pandera validation
- Build `src/physics/smoothing.py` — Savitzky-Golay filter
- Build `src/physics/kinematics.py` — velocity, acceleration, jerk
- Build `src/physics/spatial.py` — pressure, density, nearest-neighbor
- Write tests for kinematics (verify against known trajectories)
- Create notebooks 01 and 02

**Deliverable:** Notebook showing kinematic profiles for all players.

### Phase 2: Pitch Control + Passing (Days 4-5)
**Goal:** Core spatial physics engine.

- Build `src/physics/pitch_control.py` — velocity-weighted Voronoi influence
- Build `src/physics/passing_lanes.py` — ray-casting pass probability
- Write tests for pitch control and passing lanes
- Create notebook 03

**Deliverable:** Pitch control heatmap visualization.

### Phase 3: Team Shape + Formation (Days 6-7)
**Goal:** Team-level tactical metrics.

- Build `src/tactical/team_shape.py` — compactness, width, depth, line height, inter-line distance
- Build `src/tactical/formation.py` — formation detection via KMeans
- Build `src/tactical/territorial.py` — ball territory, possession chains
- Build `src/tactical/overloads.py` — numerical superiority zones
- Build `src/tactical/vulnerability.py` — defensive gaps
- Build `src/tactical/dangerous_possessions.py`
- Write tests for team shape
- Create notebook 04

**Deliverable:** Team shape analysis over time.

### Phase 4: Phase Detection + Pressing + Transitions (Days 8-10)
**Goal:** Tactical intelligence features.

- Build `src/tactical/phase_detector.py` — classify every frame
- Build `src/tactical/pressing.py` — PPDA, triggers, effectiveness, counter-press
- Build `src/tactical/transitions.py` — detection, speed, defensive recovery
- Build `src/tactical/set_pieces.py` — positioning analysis
- Write tests for phase detection, pressing, transitions
- Create notebooks 06 and 07

**Deliverable:** Full pressing report and transition analysis.

### Phase 5: Graph Model + State Scoring (Days 11-13)
**Goal:** Player interaction graph and tactical state scoring.

- Build `src/graph/build_graph.py` — graph construction per frame
- Build `src/graph/node_features.py` and `src/graph/edge_features.py`
- Build `src/graph/temporal_graph.py` — sequences
- Build `src/graph/nx_prototype.py` — NetworkX exploration
- Build `src/models/state_scorer.py` — composite tactical state score
- Build `src/models/expected_threat.py` — xT from position + context
- Build `src/models/baseline.py` — gradient boosting classifier
- Build `src/models/train.py` — training pipeline with MLflow
- Write tests for graph and state scorer
- Create notebooks 05 and 09

**Deliverable:** Trained baseline model, state scorer working.

### Phase 6: Recommendation Engine (Days 14-16)
**Goal:** Movement recommendation system.

- Build `src/recommend/candidate_moves.py` — generate options
- Build `src/recommend/scorer.py` — score via state model
- Build `src/recommend/multi_player.py` — coordinated optimization
- Build `src/recommend/explain.py` — plain-English explanations
- Build `src/recommend/optimizer.py` — select best moves
- Build `src/search/similarity.py` — sequence similarity search
- Write tests for recommendations

**Deliverable:** Working recommendation engine with multi-player coordination.

### Phase 7: Player Intelligence + Load (Days 17-19)
**Goal:** Player-level insights and physical load.

- Build `src/player_intel/off_ball_runs.py` — run classification
- Build `src/player_intel/space_creation.py` — attribution
- Build `src/player_intel/role_detection.py` — role inference
- Build `src/player_intel/heat_maps.py` — KDE
- Build `src/player_intel/pass_network.py` — pass network
- Build `src/player_intel/progressive_passes.py`
- Build `src/load/metrics.py` — HI distance, decel events, CoD load
- Build `src/load/asymmetry.py` — L/R asymmetry
- Build `src/load/fatigue.py` — within-match fatigue curves
- Build `src/load/sprint_profiles.py` — sprint analysis
- Build `src/load/work_rate.py` — in/out of possession
- Build `src/load/flags.py` — load monitoring flags
- Write tests for load metrics and player intelligence
- Create notebooks 08 and 11

**Deliverable:** Complete player and load profiles.

### Phase 8: Evaluation Framework (Days 20-21)
**Goal:** Validate that the system produces good recommendations.

- Build `src/evaluation/outcome_correlation.py`
- Build `src/evaluation/counterfactual_check.py`
- Build `src/evaluation/perturbation.py`
- Build `src/evaluation/case_studies.py`
- Build `src/unified/player_report.py`
- Build `src/unified/match_report.py`
- Build `src/unified/team_report.py`
- Write tests for evaluation
- Create notebook 10

**Deliverable:** Evaluation results documented, unified reports working.

### Phase 9: API + Docker (Days 22-24)
**Goal:** Production API service.

- Build `src/api/schemas.py` — Pydantic models for all endpoints
- Build `src/api/dependencies.py` — model loading, data access
- Build `src/api/routes.py` — all 7 endpoints
- Build `src/api/main.py` — FastAPI app with middleware
- Write `tests/test_api.py`
- Write Dockerfile (multi-stage build)
- Write Makefile
- Test container locally

**Deliverable:** Dockerized API serving all endpoints.

### Phase 10: AWS Deployment (Days 25-27)
**Goal:** Live cloud deployment.

- Set up S3 bucket, upload data and model artifacts
- Push Docker image to ECR
- Deploy ECS Fargate service
- Configure API Gateway
- Set up CloudWatch logging and alarms
- Set up GitHub Actions deploy workflow
- Write `infra/architecture.md`
- End-to-end test

**Deliverable:** Live API on AWS with CI/CD.

### Phase 11: Frontend (Days 28-34)
**Goal:** Production React dashboard.

- Initialize Vite + React + TypeScript + Tailwind + shadcn/ui
- Build layout shell, navigation, shared components
- Build PitchCanvas (D3.js) — the centerpiece
- Build tactical view page (pitch + phases + pressing + recommendations)
- Build load monitor page (table + fatigue curves + charts)
- Build player intelligence page (scatter + roles + comparison)
- Connect to live backend
- Deploy frontend to Vercel
- Screenshots for README

**Deliverable:** Polished 3-view dashboard connected to live API.

### Phase 12: Polish + Documentation (Days 35-37)
**Goal:** Portfolio-ready presentation.

- Write comprehensive README with physics narrative
- Create architecture diagram
- Record demo or create animated screenshots
- Pose prototype notebook (12_pose_prototype.ipynb)
- Final code review, docstrings, type hints
- Tag v1.0.0 release
- LinkedIn post draft

**Deliverable:** Complete, portfolio-ready project.

---

## Naming Decisions

**Project name:** Soccer Physics Engine
**Repo name:** soccer-physics-engine
**Package name:** spe (for imports: `from spe.physics import kinematics`)

---

## Critical Framing Notes

1. **Load monitoring, NOT injury prediction.** Never use the phrase "injury risk model" or "injury prediction." Use "biomechanical load monitoring," "load flags," "risk proxies." We have no labeled injury data.

2. **Movement efficiency is experimental.** Frame as "an experimental composite metric for comparing movement intelligence — hypothesis-generating, not a final truth."

3. **Physics language in narrative, engineering language in code.** README says "gravitational influence modeling." Code says `velocity_weighted_influence_field()`.

4. **Pose is a research prototype.** One notebook. Not in the API. Not in the dashboard. Clearly labeled as "future multimodal extension."

5. **Evaluation is not optional.** Without the evaluation framework, the project is a clever demo. With it, it's research.
