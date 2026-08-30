# DOL Sentence Detective

A self-paced B1 grammar game for identifying sentence components in ten fixed,
progressively harder English sentences. Instructions and feedback are in
Vietnamese; the learning content is in English.

## Local development

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Verification

```sh
npm test
npm run build
```

## DOL LMS integration

The LMS launches the game with `studentId`, `studentName`, `courseId`,
`assignmentId`, and `parentOrigin` query parameters. On completion the game
sends a top-level `DOL_LMS_RESULT` message containing the learner, accuracy on
a 100-point scale, duration, incorrect checks, and per-sentence details. No
build-time LMS origin is required.

The browser event `dol-game-complete` and
`window.DOLSentenceGame.getResults()` remain available for standalone use.

## Dokploy

- Service type: Application
- Provider: GitHub
- Branch: `main`
- Build type: Dockerfile
- Dockerfile path: `Dockerfile`
- Docker context: `.`
- Container port: `80`
- Health path: `/healthz`
- Build/start overrides: empty

The production image serves only the Vite `dist/` directory through Nginx.
After replacing a previous build strategy, perform one Clean Cache deployment.
