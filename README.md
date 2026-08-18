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

## LMS completion event

The game does not collect student identity or store results on a server. On
completion it dispatches a browser event named `dol-game-complete`. The current
result is also available from `window.DOLSentenceGame.getResults()`.

When the game is embedded in an LMS, set `VITE_LMS_ORIGIN` to the exact LMS
origin at build time. The game will then send the same payload to its parent:

```js
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://YOUR-GAME-DOMAIN') return
  if (event.data?.type === 'DOL_GAME_COMPLETE') {
    // Map event.data.payload to the LMS result API.
  }
})
```

The adapter intentionally does not guess a SCORM, xAPI, or LTI contract. Add
that mapping after the company LMS is known.

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
