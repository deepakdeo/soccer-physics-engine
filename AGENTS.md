# AGENTS.md — Soccer Physics Engine

## Project Overview

This is a cloud-deployed, physics-based soccer analytics platform. It processes player tracking data (x,y positions at 25fps for 22 players + ball) to extract tactical intelligence, biomechanical load monitoring, and player movement insights.

**Read BUILD_PLAN.md before starting any work.** It contains the complete feature set (42 features), tech stack, repository structure, API design, and phased build plan.

**Read build_journal.md at the start of every session** to understand what has been built so far. Update it after completing each phase.

---

## Development Rules

### Code Style
- Python 3.12+
- Use type hints on ALL function signatures and return types
- Use docstrings (Google style) on all public functions and classes
- Max line length: 100 characters
- Use `ruff` for formatting and linting (config in pyproject.toml)
- Use `mypy` for type checking (strict mode)
- Import order: stdlib → third-party → local (ruff handles this)

### Architecture Rules
- Every module in `src/` must have an `__init__.py` that exports its public API
- Every public function must have a corresponding test in `tests/`
- No circular imports between `src/` subpackages
- Data flows one direction: io → physics → tactical/graph/load → models → recommend → unified → api
- Never import from `api/` in any other package
- Never import from `notebooks/` in `src/`

### Physics Computation Rules
- All position data must be smoothed (Savitzky-Golay) before differentiation
- Velocity = first derivative of smoothed position (finite differences)
- Acceleration = second derivative (finite differences on velocity, NOT second-order on position)
- Jerk = third derivative (finite differences on acceleration)
- All spatial computations use meters as the unit (Metrica data is already normalized 0-1; convert to pitch dimensions: 105m × 68m)
- Pitch coordinates: x = length (0 = own goal line, 105 = opponent goal line), y = width (0 = left touchline, 68 = right touchline)

### Data Handling Rules
- Load tracking data via Kloppy (`kloppy.load_metrica_tracking_data()`)
- Validate all loaded data with Pandera schemas before processing
- Convert pandas DataFrames to Polars for compute-heavy operations
- Never modify raw data files — always write processed data to `data/processed/`
- Use DVC to track data files (do not commit data to git)

### Testing Rules
- Use pytest with fixtures for common test data
- Test physics functions against known analytical solutions (e.g., constant velocity → zero acceleration)
- Test spatial functions with hand-computed examples
- Test API endpoints with FastAPI TestClient
- Target: every file in `src/` has a corresponding test file
- Run tests with: `uv run pytest tests/ -v`

### Naming Conventions
- Files: snake_case (e.g., `pitch_control.py`)
- Classes: PascalCase (e.g., `PitchControlModel`)
- Functions: snake_case (e.g., `compute_velocity`)
- Constants: UPPER_SNAKE_CASE (e.g., `PITCH_LENGTH_M = 105.0`)
- Type aliases: PascalCase (e.g., `PlayerFrame = dict[str, float]`)

### Framing Rules (CRITICAL)
- NEVER use "injury risk model" or "injury prediction" — use "biomechanical load monitoring" and "load flags"
- NEVER present the movement efficiency metric as settled — always frame as "experimental composite"
- Function names use engineering language, NOT physics metaphors: `velocity_weighted_influence_field()` not `gravitational_influence()`
- Docstrings can reference the physics analogy for clarity

---

## Package Management

Use `uv` for all package management:
```bash
uv init                          # Initialize project
uv add <package>                 # Add dependency
uv add --dev <package>           # Add dev dependency
uv run pytest                    # Run tests
uv run python -m src.api.main    # Run API
uv run ruff check src/ tests/    # Lint
uv run mypy src/                 # Type check
```

---

## Key Dependencies

```toml
[project]
dependencies = [
    "kloppy>=3.15",
    "polars>=1.0",
    "pandas>=2.0",
    "pandera>=0.20",
    "numpy>=1.26",
    "scipy>=1.12",
    "scikit-learn>=1.4",
    "networkx>=3.2",
    "torch>=2.2",
    "torch-geometric>=2.5",
    "mlflow>=2.10",
    "fastapi>=0.110",
    "pydantic>=2.6",
    "uvicorn>=0.27",
    "matplotlib>=3.8",
    "mplsoccer>=1.2",
    "plotly>=5.18",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.3",
    "mypy>=1.8",
    "httpx>=0.27",
]
pose = [
    "mediapipe>=0.10",
    "opencv-python>=4.9",
]
```

---

## Build Journal Protocol

Update `build_journal.md` at these trigger points:
1. **Phase completion** — what was built, what works end-to-end
2. **New file created** — path, purpose, input/output flow
3. **Design decision** — what was decided and why
4. **Dependency added** — package name and rationale
5. **Architecture change** — what shifted from the plan and why

Format:
```markdown
### Phase N: [Title] — [YYYY-MM-DD]

**What was built:**
- `src/module/file.py` — [purpose]. Takes [input] from [source], produces [output] for [consumer].

**Why this approach:**
[1-3 sentences on reasoning]

**Key decisions:**
- Chose X over Y because [reason]
```

---

## Quick Commands

```bash
# Development
uv run pytest tests/ -v                    # Run all tests
uv run ruff check src/ tests/              # Lint
uv run ruff format src/ tests/             # Format
uv run mypy src/                           # Type check
uv run python -m uvicorn src.api.main:app --reload  # Run API locally

# Docker
docker build -t spe:latest .              # Build image
docker run -p 8000:8000 spe:latest        # Run container

# Data
uv run python -c "from src.io.metrica_loader import load_match; load_match('sample_game_1')"
```

---

## Phase Execution Order

Follow BUILD_PLAN.md phases in order. Each phase depends on the previous one.

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

Do NOT skip phases. Do NOT start a later phase before completing tests for the current phase.

After each phase:
1. Run `uv run pytest tests/ -v` — all tests must pass
2. Run `uv run ruff check src/` — no lint errors
3. Run `uv run mypy src/` — no type errors
4. Update build_journal.md
5. Git commit with message: `feat: complete phase N — [description]`
