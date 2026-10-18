# AVP Frontend

The AVP frontend is the browser application for the Academic Venture Pipeline. It presents the public product experience, authentication and onboarding flows, analyst technology discovery, maintainer uploads, administrator tools, analyst reviews, and credibility/rewards views.

The application is built with **Next.js 16 App Router**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Motion**. It communicates with the FastAPI backend in `../backend`.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment configuration](#environment-configuration)
- [Install dependencies](#install-dependencies)
- [Run locally](#run-locally)
- [Run with the backend](#run-with-the-backend)
- [Build and production start](#build-and-production-start)
- [Available commands](#available-commands)
- [API integration](#api-integration)
- [Route map](#route-map)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Features

- Public landing page explaining the evidence-first AVP workflow.
- Analyst signup, email verification, onboarding, login, logout, and password reset.
- Role-aware routing for administrators, analysts, and maintainers.
- Public analyst directory and public analyst profiles.
- Analyst technology library with search, filters, voting, reviews, and document reading.
- Maintainer upload workflow for registering technologies and documents.
- Admin management for universities, users, categories, documents, and analytics.
- Analyst reputation, tiers, badges, credibility, and rewards views.
- Same-origin `/api/*` browser requests proxied to the FastAPI API so the session cookie remains first-party.

## Architecture

### Rendering model

The project uses the Next.js App Router:

- Server components fetch protected data through `lib/api.ts`.
- Client components submit browser actions through `lib/client.ts`.
- `proxy.ts` performs optimistic route selection from the session cookie.
- The backend remains the source of truth for authentication and authorization.
- Public pages do not require a session and use `publicApi()` where needed.

`proxy.ts` only decodes the session to choose a destination. It does not verify authorization. Every API request is still authorized by FastAPI, and the backend re-reads the user record on every authenticated request.

### Request flow

```text
Browser
  │
  ├── GET /library, /uploads, /admin
  │       └── Next.js server component
  │             └── lib/api.ts → FastAPI API_URL
  │
  └── Browser action
          └── lib/client.ts → /api/*
                └── next.config.ts rewrite
                      └── FastAPI at API_URL
                            └── httpOnly avp_session cookie
```

By default, `API_URL` is `http://localhost:8000`. The rewrite in `next.config.ts` maps `/api/:path*` to the backend without exposing a second browser origin.

### Styling and branding

- `app/globals.css` contains global styles and theme variables.
- `app/landing.module.css` contains landing-page-specific styling.
- Tailwind v4 provides utility classes and brand tokens.
- IBM Plex Sans and IBM Plex Mono are loaded from `next/font/google`.
- Zodiak is self-hosted from `app/fonts/`.
- Brand assets are in `public/brand/`.

The authenticated application supports light and dark themes. The landing page pins its own light visual treatment.

## Prerequisites

- Node.js 20 or newer.
- pnpm 11.24.0 or npm.
- A running AVP backend at `http://localhost:8000`.
- Docker Desktop if the backend and Postgres are being run with Docker.

The repository declares pnpm as its package manager:

```text
pnpm@11.24.0
```

## Environment configuration

There is no committed frontend `.env.example` at present. The frontend reads two environment variables: `API_URL`, and `NEXT_PUBLIC_CONTACT_EMAIL` (the team inbox behind the landing page's "Request a demo" link; it falls back to a placeholder).

Create `frontend/.env.local` when the backend is not running at the default URL:

```dotenv
API_URL=http://localhost:8000
```

For a deployed frontend, set `API_URL` to the reachable backend origin. The value is used by:

- `next.config.ts` for the `/api/*` rewrite.
- `lib/api.ts` for server-side API requests.
- `lib/client.ts` indirectly through the rewrite.

Do not put secrets in frontend environment variables. Values exposed to browser code must be treated as public.

## Install dependencies

### pnpm

```bash
cd frontend
pnpm install
```

### npm

The repository is locked with pnpm. npm can still install from `package.json`, but pnpm is preferred for lockfile consistency:

```bash
cd frontend
npm install
```

## Run locally

Start the backend first from a second terminal. See [`../backend/README.md`](../backend/README.md).

### pnpm

```bash
cd frontend
pnpm dev
```

### npm

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The backend Docker stack creates the first administrator when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `backend/.env`. Use those credentials to sign in.

## Run with the backend

From the repository root, start the backend API, worker, migrations, and Postgres:

```bash
cd backend
cp .env.example .env
# Set JWT_SECRET and ADMIN_PASSWORD at minimum.
docker compose up -d --build
```

Then start the frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Verify the two applications:

- Frontend: [http://localhost:3000](http://localhost:3000)
- FastAPI Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Backend health endpoint: [http://localhost:8000/health](http://localhost:8000/health)

If the backend API uses a different host or port:

```bash
API_URL=http://localhost:8001 pnpm dev
```

Or put the same value in `.env.local`.

## Build and production start

### pnpm

```bash
cd frontend
pnpm build
pnpm start
```

### npm

```bash
cd frontend
npm run build
npm run start
```

The production server listens on port `3000` by default. Set `PORT` if another port is required:

```bash
PORT=3001 pnpm start
```

This repository does not currently contain a frontend Dockerfile or frontend service in Docker Compose. Use the local Node commands above, or build a Node container around the same `pnpm build` and `pnpm start` commands.

## Available commands

| Command | pnpm | npm | Purpose |
| --- | --- | --- | --- |
| Development server | `pnpm dev` | `npm run dev` | Start Next.js with hot reload |
| Production build | `pnpm build` | `npm run build` | Compile and validate the production app |
| Production server | `pnpm start` | `npm run start` | Serve the compiled app |
| Lint | `pnpm lint` | `npm run lint` | Run ESLint |
| Generate API types | `pnpm gen:api` | `npm run gen:api` | Generate `lib/api-types.ts` from the backend OpenAPI document |

Generate API types after the backend is running:

```bash
pnpm gen:api
```

The script reads `http://localhost:8000/openapi.json`. If the backend is elsewhere, run the equivalent command with `npx openapi-typescript` and the appropriate URL.

## API integration

### Server-side requests

Use `api()` from `lib/api.ts` in server components. It forwards the incoming cookie header and redirects unauthenticated responses to `/login`.

```ts
import { api } from "@/lib/api";

const me = await api<Me>("/auth/me");
```

Use `publicApi()` for public pages where a `404` should become `null` rather than a login redirect.

### Browser requests

Use `send()` from `lib/client.ts` in client components:

```ts
await send("/auth/logout", { method: "POST" });
await send("/technologies/technology-id/vote", {
  method: "PUT",
  json: { value: 1 },
});
```

FastAPI validation and error payloads are converted into readable `SendError` messages for UI actions.

### Authentication behavior

The backend sets an httpOnly `avp_session` cookie. The frontend must not store credentials or tokens in local storage. The browser sends the cookie automatically for same-origin `/api/*` requests.

## Route map

### Public

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/analysts` | Public analyst directory |
| `/a/[handle]` | Public analyst profile |

### Authentication and onboarding

| Route | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/signup` | Analyst signup |
| `/verify` | Confirm an email link |
| `/forgot` | Request a password reset |
| `/reset` | Set a new password |
| `/onboarding` | Complete an analyst profile |

### Authenticated application

| Route | Roles | Purpose |
| --- | --- | --- |
| `/library` | Admin, analyst | Browse and filter technologies |
| `/library/[id]` | Admin, analyst | Read documents and review a technology |
| `/rewards` | Analyst | View reputation, tiers, badges, and rewards |
| `/uploads` | Admin, maintainer | Manage institutional uploads |
| `/uploads/new` | Admin, maintainer | Create a new technology upload |
| `/uploads/[id]` | Admin, maintainer | Process and verify an upload |
| `/account` | Authenticated users | Manage account and password |
| `/admin/universities` | Admin | Manage institutions |
| `/admin/users` | Admin | Manage staff users |
| `/admin/categories` | Admin | Manage technology categories |
| `/admin/documents` | Admin | Inspect documents |
| `/admin/analytics` | Admin | View analytics |

## Project structure

```text
frontend/
├── app/
│   ├── (app)/              # Authenticated shell and role-specific application routes
│   │   ├── library/        # Analyst technology library and reader
│   │   ├── uploads/        # Maintainer/admin ingestion UI
│   │   ├── admin/          # Administration screens
│   │   ├── rewards/        # Analyst credibility and rewards
│   │   ├── account/        # Account settings
│   │   ├── Shell.tsx       # Authenticated navigation shell
│   │   └── layout.tsx      # Authenticated layout
│   ├── landing/            # Landing page sections
│   ├── login/ signup/      # Authentication screens
│   ├── verify/ forgot/     # Email verification and password recovery
│   ├── onboarding/         # Analyst profile setup
│   ├── _profile/           # Shared profile and credibility components
│   ├── _brand/             # Logo and brand components
│   ├── analysts/           # Public analyst directory
│   ├── a/[handle]/         # Public analyst profile
│   ├── layout.tsx          # Root fonts, metadata, theme initialization
│   └── globals.css         # Global styling
├── lib/
│   ├── api.ts              # Server-side API client
│   ├── client.ts           # Browser-side API client
│   ├── session.ts          # Session decoding for optimistic routing
│   ├── currentSession.ts   # Server-side current-session helpers
│   ├── types.ts            # Shared frontend types
│   ├── rubric.ts           # Analyst review guidance
│   └── trl.ts              # TRL display helpers
├── public/brand/           # Brand images
├── next.config.ts          # Backend API rewrite
├── proxy.ts                # Role-aware optimistic route guard
├── package.json             # Scripts and dependencies
├── pnpm-lock.yaml          # Dependency lockfile
└── tsconfig.json           # TypeScript configuration
```

## Troubleshooting

### Frontend shows backend connection errors

Confirm the API is running:

```bash
curl http://localhost:8000/health
```

If it is on another URL, set `API_URL` in `frontend/.env.local` and restart the Next.js development server.

### Browser requests redirect repeatedly to login

Check that:

1. The backend is reachable through `API_URL`.
2. You are using the same browser origin for the frontend and `/api` requests.
3. The backend has a valid `JWT_SECRET`.
4. The account is active and email-verified.

### `pnpm gen:api` cannot fetch OpenAPI

Start the backend first:

```bash
cd backend
docker compose up -d --build
curl http://localhost:8000/openapi.json
```

Then rerun the generation command from `frontend/`.

### Lint or build fails after dependency changes

Reinstall from the lockfile:

```bash
rm -rf node_modules
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

### Backend changes are not visible

The frontend talks to the running backend API. Restart or rebuild the backend stack after changing backend code:

```bash
cd backend
docker compose up -d --build
```
#   A c a d e m i c V e n t u r e P i p e l i n e  
 