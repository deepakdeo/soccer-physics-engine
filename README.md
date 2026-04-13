# Soccer Physics Engine

Physics-first soccer analytics for tactical intelligence, biomechanical load
monitoring, and player movement insight.

Layman version: take the x/y coordinates of every player and the ball, turn that
movement into velocity, pressure, spacing, and tactical context, then surface the
result as coach-facing recommendations, load flags, and player profiles.

## Status

The repository now includes:

- a tested Python analytics stack across physics, tactical, recommendation, load,
  evaluation, and reporting layers
- a FastAPI service with typed request and response schemas
- a React dashboard scaffold with D3 pitch visualization and Recharts panels
- Docker packaging and AWS deployment templates

The AWS deployment workflow is intentionally template-only until real AWS resources
and GitHub secrets are configured.

## Why physics first?

Most soccer analytics projects start at the event level: passes, shots, carries, and
aggregated counts. This project starts one layer lower.

1. Raw tracking coordinates are smoothed.
2. Smoothed positions become velocity, acceleration, and jerk.
3. Those kinematic signals drive pitch control, passing lane quality, pressure, shape,
   transitions, and player workload proxies.
4. Tactical models, recommendations, unified reports, and the dashboard all reuse the
   same physical representation instead of building separate feature silos.

That makes the system easier to reason about: tactical intelligence and biomechanical
monitoring come from the same motion model rather than from disconnected pipelines.

## Architecture

```text
Metrica / StatsBomb data
        |
        v
Kloppy loaders -> Pandera validation -> Polars frames
        |
        v
Physics engine
  - smoothing
  - velocity / acceleration / jerk
  - pitch control
  - passing lanes
  - spatial pressure
        |
        +--> Tactical layer
        |      phases, shape, formations, pressing, transitions,
        |      territory, overloads, vulnerability, possessions
        |
        +--> Player interaction graph
        |      node features, edge features, temporal graph snapshots
        |
        +--> Load layer
        |      high-intensity distance, decels, CoD load,
        |      asymmetry, fatigue, sprint and work-rate summaries
        |
        +--> Player intelligence
               off-ball runs, space creation, role detection,
               heat maps, pass-network context
        |
        v
Models + recommendation engine
  - tactical state score
  - expected threat baseline
  - single-player recommendations
  - multi-player coordinated search
  - explanation text
        |
        v
Unified reports + evaluation layer
        |
        v
FastAPI service -> Docker -> AWS templates
        |
        v
React dashboard
  - Match Analysis
  - Load Monitor
  - Player Intelligence
```

## Feature Overview

### Physics engine

- Position smoothing with Savitzky-Golay filtering
- Velocity, acceleration, and jerk from smoothed trajectories
- Velocity-aware pitch control surfaces
- Interception-aware passing lane scoring
- Pressure and local spatial density helpers

### Tactical intelligence

- Phase-of-play classification
- Team compactness, width, depth, and defensive line metrics
- Formation inference from average positions
- Pressing intensity, triggers, counter-press speed, and effectiveness
- Transition detection and defensive recovery timing
- Territorial dominance and possession-chain analysis
- Overload detection and defensive vulnerability checks
- Set-piece positioning support
- Sequence similarity search for tactically related moments

### Graph and modeling layer

- Frame-level interaction graph construction
- Node and edge feature extraction
- Composite tactical state scorer
- Expected-threat baseline model
- Counterfactual single-player recommendation search
- Greedy multi-player coordinated optimization
- Plain-language explanation generation

### Player intelligence

- Off-ball run classification
- Space-creation attribution
- Role detection from movement profile
- Heat-map generation
- Pass-network summaries
- Progressive-pass identification

### Biomechanical load monitoring

- High-intensity distance
- Sharp deceleration event counting
- Change-of-direction load
- Left/right asymmetry summaries
- Within-match fatigue curves
- Sprint profile summaries
- In-possession vs out-of-possession work rate
- Percentile-based load flags

### Evaluation

- Outcome correlation checks
- Counterfactual recommendation validation
- Perturbation stability under spatial noise
- Tactical case-study validation helpers

### Pose research prototype

- Research notebook placeholder for skeletal keypoint extraction
- Joint-angle derivation
- Stride metrics and asymmetry exploration

This pose work is intentionally isolated to a notebook path. It is not wired into
the API or dashboard.

## Tech Stack

| Area | Tools | Why they are here |
|------|-------|-------------------|
| Data loading | Kloppy, pandas, Polars, Pandera | Standardized provider ingestion, validation, and fast compute-friendly tables |
| Core computation | NumPy, SciPy | Vector math, signal processing, geometry, and spatial analysis |
| Graph and ML | NetworkX, scikit-learn, PyTorch, PyTorch Geometric, MLflow | Prototype-friendly graph logic now, room for learned graph models later |
| Service layer | FastAPI, Pydantic, Uvicorn | Typed API contracts and a clean service boundary for the dashboard |
| Frontend | React, TypeScript, Vite, Tailwind, D3, Recharts | Fast dashboard development plus custom pitch rendering |
| Packaging and infra | Docker, GitHub Actions, AWS templates | Reproducible builds and a clear deployment path |
| Quality | pytest, ruff, mypy, uv | Tests, linting, type safety, and consistent dependency management |
| Research extension | MediaPipe, OpenCV | Optional pose notebook workflow only |

## Repository Layout

```text
src/         Python analytics and API packages
tests/       End-to-end and module-level validation
frontend/    React dashboard
configs/     Runtime and deployment configuration
infra/       AWS architecture and workflow templates
data/        DVC-oriented raw and processed data structure
notebooks/   Exploration, demos, and research notebooks
```

## Screenshots

The dashboard screenshot slots are reserved in `assets/demo_screenshots/`.

| View | Planned file | Status |
|------|--------------|--------|
| Match Analysis | `assets/demo_screenshots/match-analysis.png` | Placeholder |
| Load Monitor | `assets/demo_screenshots/load-monitor.png` | Placeholder |
| Player Intelligence | `assets/demo_screenshots/player-intelligence.png` | Placeholder |

See [assets/demo_screenshots/README.md](assets/demo_screenshots/README.md) for the
placeholder manifest.

## Local Setup

### Backend

```bash
uv sync --extra dev
uv run pytest tests/ -v
uv run ruff check src/ tests/
uv run mypy src/
uv run python -m uvicorn src.api.main:app --reload
```

The API serves demo-backed deterministic data out of the box, so it is usable
without downloading the full open datasets first.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend calls `VITE_API_BASE_URL` if provided. If the backend is unavailable,
the client falls back to local demo payloads so the dashboard still renders.

Example:

```bash
cd frontend
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

## Docker

Build and run the API container:

```bash
docker build -t soccer-physics-engine:latest .
docker run --rm -p 8000:8000 soccer-physics-engine:latest
```

Then visit:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/health`

## AWS Deployment Notes

This repository includes AWS deployment templates under `infra/` and GitHub Actions
workflows under `.github/workflows/`.

What is present now:

- ECS task definition template
- API Gateway template
- CloudWatch alarms template
- CI workflow
- deploy workflow scaffold

What is not present in the repository:

- live AWS resources
- GitHub Actions secrets
- OIDC trust configuration
- deployed ECR/ECS/API Gateway infrastructure

Do not expect the deploy workflow to succeed until those pieces exist.

## API Summary

### `GET /health`

Simple liveness and version check.

```bash
curl http://127.0.0.1:8000/health
```

```json
{
  "status": "ok",
  "app_name": "soccer-physics-engine",
  "version": "0.1.0"
}
```

### `POST /analyze-sequence`

Returns tactical state, recommendations, a load snapshot, and the phase label for a
sequence window.

```bash
curl -X POST http://127.0.0.1:8000/analyze-sequence \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "metrica",
    "match_id": "sample_game_1",
    "start_time_s": 12,
    "end_time_s": 18,
    "focus_team": "home",
    "focus_player_id": "home_4",
    "mode": "single"
  }'
```

```json
{
  "state_score": 0.67,
  "pitch_control": 0.61,
  "predicted_improvement": 0.07,
  "phase_classification": "chance_creation",
  "confidence": 0.83,
  "recommendations": [
    {
      "player_id": "home_4",
      "dx": 3.8,
      "dy": 2.5,
      "improvement": 0.07,
      "confidence": 0.83,
      "explanation": "Move forward and wider to stretch the back line and create a stronger switch angle."
    }
  ],
  "load_snapshot": {
    "player_id": "home_4",
    "high_intensity_distance": 348.0,
    "sharp_deceleration_events": 9,
    "change_of_direction_load": 42.0,
    "load_flags": ["hi_distance"]
  }
}
```

### Other endpoints

- `POST /match-report` for match-level tactical and load summaries
- `POST /load-report` for biomechanical monitoring profiles
- `POST /search-sequences` for nearest-neighbor tactical retrieval
- `GET /player-profile/{player_id}` for role, run type, heat-map, and off-ball value
- `GET /model-info` for model surfaces exposed by the API

## Evaluation Summary

Current evaluation is repository-level and deterministic rather than a published
benchmark on a labeled competition dataset.

What is in place:

- automated outcome-correlation checks
- counterfactual validation that recommendations improve the modeled state
- perturbation-stability checks under positional noise
- tactical case-study validation helpers

Current verification baseline:

- `108` pytest cases passing
- `ruff` lint clean on `src/` and `tests/`
- `mypy` clean on `src/`

What is not claimed yet:

- production-calibrated outcome models on a large held-out match bank
- medically validated injury prediction
- a settled movement-efficiency metric

Movement efficiency should be treated as an experimental composite for comparison and
hypothesis generation, not as a final truth.

## Data

See [data/README.md](data/README.md) for the data layout and tracking dictionary.

The current repository expects:

- Metrica sample tracking and event data under `data/raw/metrica/`
- processed outputs under `data/processed/`
- DVC, not Git, to manage real data artifacts

All spatial calculations use meters on a `105 x 68` pitch.

## Roadmap

- Replace demo-backed API dependencies with real processed match stores
- Add more real-match evaluation and calibration
- Extend the graph layer toward learned graph models
- Add richer event-data fusion from StatsBomb
- Capture dashboard screenshots and short demo assets
- Expand the pose research notebook into a multimodal prototype
- Wire real AWS resources into the existing deployment templates

## Acknowledgments

- Metrica Sports open sample data
- StatsBomb open data
- Kloppy for standardized sports-data loading
- The open-source Python and frontend tooling used throughout the stack
