# Data README

This repository is structured for provider data in `data/raw/` and pipeline outputs in
`data/processed/`. Real data files are expected to be tracked with DVC rather than
committed to Git.

## Directory Layout

```text
data/
├── raw/
│   └── metrica/
│       ├── Sample_Game_1_RawTrackingData_Home_Team.csv
│       ├── Sample_Game_1_RawTrackingData_Away_Team.csv
│       ├── Sample_Game_1_RawEventsData.csv
│       ├── Sample_Game_2_RawTrackingData_Home_Team.csv
│       ├── Sample_Game_2_RawTrackingData_Away_Team.csv
│       └── Sample_Game_2_RawEventsData.csv
└── processed/
    ├── tracking/
    ├── tactical/
    ├── load/
    ├── reports/
    └── search/
```

## Sources

### Metrica Sports open sample data

- synchronized tracking for players and the ball
- event feed for passes, shots, tackles, and related match actions
- tracking cadence assumed by the project: `25 fps`

### StatsBomb open data

- intended as a secondary event source and future extension point
- not required for the current deterministic demo-backed API flow

## Tracking Dictionary

The normalized long-form tracking schema used by `src/io/metrica_loader.py` and
validated by `src/io/schemas.py` expects these fields:

| Column | Type | Unit | Meaning |
|--------|------|------|---------|
| `frame_id` | integer | frame index | Tracking frame number |
| `timestamp` | float | seconds | Match-clock time for the frame |
| `player_id` | string | identifier | Canonical player identifier such as `home_4` |
| `team` | string | label | `home` or `away` |
| `x` | float | meters | Pitch length coordinate from own goal line toward opponent goal |
| `y` | float | meters | Pitch width coordinate from left touchline toward right touchline |
| `ball_x` | float | meters | Ball x-position when available |
| `ball_y` | float | meters | Ball y-position when available |

## Coordinate Conventions

- Metrica normalized coordinates are converted to meters on load.
- Pitch dimensions are fixed at `105m x 68m`.
- `x = 0` is the own goal line.
- `x = 105` is the opponent goal line.
- `y = 0` is the left touchline.
- `y = 68` is the right touchline.

## Processed Outputs

The repository is set up for these output categories:

- `processed/tracking/` for validated long-form tracking tables
- `processed/tactical/` for tactical summaries and similarity features
- `processed/load/` for biomechanical monitoring summaries
- `processed/reports/` for unified player, match, and team reports
- `processed/search/` for sequence retrieval artifacts

## Data Handling Rules

- Raw files are never modified in place.
- Provider files are loaded through Kloppy where possible.
- Validation happens before downstream physics or tactical computation.
- Processed derivatives should be written under `data/processed/`.
- Large artifacts should be DVC-tracked and excluded from Git history.
