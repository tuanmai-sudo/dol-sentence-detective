# Clippy's Writing Mission

A teacher-led DOL classroom game for building ten sentences into a paragraph,
then connecting them with linking words.

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
