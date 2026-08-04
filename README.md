# RRPathPlanner

A browser-based path planner and visualizer for [FTC RoadRunner](https://rr.brott.dev/) autonomous paths. Build splines on a field map, watch a physically-modeled robot drive them, and export ready-to-paste Java trajectory code.

**Live:** deployed on Vercel with a small Express/Groq backend for AI-assisted path import.

## Features

- **Visual path editor** — draw and drag spline waypoints directly on the FTC field image (`react-konva`), with tangent/constant/linear heading interpolation per segment
- **Motion simulation** — `MotionEngine.js` arc-length-parameterizes each spline and builds a drive-time profile under velocity/acceleration/friction constraints, so the playback scrubber reflects how the robot would actually move, not just geometric time
- **Java export** — generates a RoadRunner `Actions.runBlocking()` OpMode from the current path set, ready to paste into an FTC project
- **AI-assisted import** — paste existing RoadRunner Java code and an LLM (Groq, `llama-4-scout`) extracts the path back into editable segments, so you can reverse-engineer or tweak someone else's autonomous
- **Playback bar** — scrub through the simulated run, watch the robot's pose animate along the path in real time

## Stack

- React 19 + Vite, `react-konva` for the canvas
- `framer-motion` for UI transitions
- Express backend (`index.cjs`) handling the Groq API call, with a MongoDB-backed rate limiter (JWT cookie identifies the client, capped requests per token)
- Deployed as a Vercel serverless function (`api/groq/chat.js` mirrors the same handler for production)

## Project layout

| Path | Purpose |
|---|---|
| `src/components/Visualizer/` | The Konva canvas: field rendering, path drawing, live robot marker |
| `src/components/MotionEngine.js` | Spline math (cubic Bezier evaluation, arc-length sampling) and the trapezoidal-ish drive-time profile generator |
| `src/components/Menu/` | Path list, per-segment editing (waypoints, heading mode) |
| `src/components/PlaybackBar/` | Scrubber + play/pause controls |
| `src/components/ExportModal/` | Generates and displays the RoadRunner Java code for the current paths |
| `src/components/ImportModal/` | Sends pasted Java to `/api/groq/chat` and loads the returned path back into the editor |
| `index.cjs` | Local dev API server (Express) — same logic as `api/groq/chat.js`, used by `npm run dev` |
| `api/groq/chat.js` | Vercel serverless function for the Groq import feature |

## Setup

```bash
npm install
```

```bash
# .env
VITE_GROQ_API_KEY=your-groq-api-key
MONGODB_CONNECTION_STR=your-mongodb-password
JWT_SIGN_KEY=any-random-string
```

The Mongo connection string in `index.cjs` is hardcoded to a specific cluster/user (`tummalasaisrikar@yichangs-temu-storage...`); point `MONGODB_CONNECTION_STR` at that cluster's password, or edit the connection string in `index.cjs` to use your own cluster.

## Running locally

```bash
npm run dev
```

This runs `vite` (frontend, default port 5173) and `node index.cjs` (API server on port 3001) together via `concurrently`. The import feature needs the API server running to reach Groq.
