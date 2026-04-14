# How to use Soccer Physics Engine

## What you need

- This tool analyzes player tracking data — the x,y position of every player on the pitch, captured 25 times per second by stadium cameras.
- Most professional leagues and federations already collect this data through providers like Second Spectrum, Hawkeye, or Stats Perform.
- The tool comes with two sample matches so you can try it immediately without your own data.

## Getting started

1. Open the dashboard.
   If you are running locally, start the frontend with `cd frontend && npm run dev` and open `http://localhost:5173`.
   If you have deployed it, open your live dashboard URL instead.
2. You'll see three tabs at the top: Match Analysis, Load Monitor, Player Intelligence.

## Match Analysis — "What happened tactically?"

- The pitch view shows all 22 players at a specific moment. Green dots are the home team, orange dots are the away team. The shaded areas show which team controls which space, like a territory map.
- The timeline bar below the pitch is color-coded by tactical phase: dark green = building from the back, teal = progressing up the pitch, orange = creating chances, red = pressing after losing the ball, blue = transitioning.
- Click any phase segment to jump to that moment.
- The Recommendations panel tells you which players should have moved differently and why. For example: "Player 7 should move 4 meters wider — this opens a passing lane and stretches the defensive line."
- The Pressing Report shows how effectively the team pressed: PPDA (lower = more aggressive pressing), counter-press speed (how quickly the team reacts after losing the ball), and pressing effectiveness (what percentage of presses actually won the ball back).
- The Formation View shows what shape each team was actually playing, which may differ from the announced lineup.

## Load Monitor — "Who needs rest?"

- The Player Load Table shows every player's physical output: high-intensity distance (meters covered above sprinting speed), sharp decelerations (hard braking events that stress joints), and change-of-direction load.
- Players flagged as `MONITOR` or `FLAGGED` have accumulated more physical stress than typical. This does not mean they are injured. It means they deserve closer attention from medical and performance staff.
- Fatigue Curves show how each player's physical output changes over the match. A steep decline after 60 minutes suggests the player is tiring.
- The Asymmetry View compares left-side vs right-side deceleration. A large imbalance, especially above 20%, may indicate the player is favoring one side.

## Player Intelligence — "Who's creating value?"

- Select a player from the dropdown to see their movement profile.
- Role shows what position the player actually played based on their movement, not just their listed position.
- Off-ball Value measures how much the player helps the team even when they do not have the ball — through runs that create space, pulling defenders out of position, or providing passing options.
- Movement Efficiency compares how much tactical value a player creates relative to their physical cost. A high-efficiency player creates space through smart positioning rather than endless sprinting. This is an experimental metric for comparison, not a definitive score.
- Run Classification breaks down the types of off-ball runs: overlaps (running past a teammate on the outside), diagonals (cutting across the defense), stretching (sprinting to pull defenders deep), support (moving closer to receive a short pass), dropping (coming back toward your own goal to collect the ball).

## How to use your own data

1. Export tracking data from your provider, such as Second Spectrum, Hawkeye, or Stats Perform, as CSV or JSON.
2. Place the files in the `data/raw/` folder.
3. Add a data loader for your provider's format in `src/io/`, or use an existing Kloppy-supported format.
4. The full analysis pipeline then runs automatically on your data.

## Glossary

- Pitch control: which team can reach each area of the pitch first, considering player positions and velocities.
- PPDA: Passes Per Defensive Action — measures pressing intensity. Lower means more aggressive pressing.
- Phase of play: the tactical moment — build-up (playing from the back), progression (moving up the pitch), chance creation (creating shooting opportunities), pressing (trying to win the ball back), transition (switching between attack and defense).
- Expected threat: how dangerous the current ball position is, considering all player positions.
- State score: a 0-100% summary of how favorable the current tactical situation is for the team.
