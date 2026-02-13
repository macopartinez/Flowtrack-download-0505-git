# Flowtrack

## Overview

Flowtrack is a social media unfollower tracking application. Users connect their Instagram or Facebook accounts, and the app tracks who unfollows them, displaying analytics on a dashboard with charts and stats. The app uses a monorepo structure with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project is organized into three main directories:
- `client/` — React SPA frontend
- `server/` — Express API backend
- `shared/` — Code shared between frontend and backend (schema, route definitions)

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, custom fonts (Outfit for display, Plus Jakarta Sans for body)
- **Animations**: Framer Motion for page transitions and hover effects
- **Charts**: Recharts for analytics visualizations
- **Build Tool**: Vite with React plugin

Key pages:
- `/` — Landing page with marketing content and account connection dialog
- `/dashboard/:userId` — Analytics dashboard showing unfollower stats and charts

### Visual Effects System
The landing page uses a layered animation system with wave-reactive text:

- **RadarBackground** (`client/src/components/RadarBackground.tsx`): Canvas-based radar wave animation (green waves from top-left corner on #0a0a0a dark background). Exports wave position data via `waveData.ts`.
- **BackgroundFlowtrack** (`client/src/components/BackgroundFlowtrack.tsx`): Large centered "FLOWTRACK" text rendered on canvas. Only outlines/contours are visible, and they glow electric green when radar waves pass through them.
- **GlassText** (`client/src/components/GlassText.tsx`): Navbar "FLOWTRACK" logo using Lalezar font with CSS `backdrop-filter` glass effect (blur, low brightness, low saturation). Gets frosted with electric green color when waves pass.
- **Wave Data** (`client/src/lib/waveData.ts`): Shared module that stores wave positions. `RadarBackground` writes to it each frame, both text components read from it via `getWaveIntensityAtPoint()` to calculate wave intersection intensity.
- **Scroll Snap & Blur**: Landing page uses `snap-y snap-mandatory`. Section 3 (Features) applies a progressive `backdrop-filter` blur (12px) over the background (including the large BackgroundFlowtrack text) for better focus. The features are presented via a nested vertical snap: 1. Real-time Alerts (with phone animation), 2. Deep Analytics, 3. Account Safety.
- **Fonts**: Lalezar (Google Font) for FLOWTRACK branding, Outfit for display headings, Plus Jakarta Sans for body text.
- **Theme**: Dark mode only (#0a0a0a background, green electric accents rgba(0,255,100), purple primary for UI elements).

### Backend
- **Framework**: Express 5 on Node.js
- **Runtime**: tsx for TypeScript execution in development
- **API Design**: REST API with routes defined in `shared/routes.ts` using Zod schemas for validation. Route definitions are shared between client and server for type safety.
- **Build**: esbuild for production server bundling, Vite for client bundling

### Database
- **Database**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (defined in `shared/schema.ts`):
  - `users` table: id, username, platform (instagram/facebook), avatarUrl, isConnected, createdAt
  - `unfollowers` table: id, userId, username (person who unfollowed), detectedAt
- **Migrations**: Drizzle Kit with `db:push` command for schema sync

### API Routes
All routes are prefixed with `/api/`:
- `POST /api/users/connect` — Connect a social media account (creates user + seeds mock data)
- `GET /api/users/:id` — Get user details
- `GET /api/stats/:userId` — Get unfollower statistics for a user

### Storage Layer
- `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class
- Uses Drizzle ORM queries directly against PostgreSQL
- The interface pattern allows for potential swapping of storage implementations

### Development vs Production
- **Dev**: Vite dev server with HMR proxied through Express, uses `server/vite.ts`
- **Production**: Client built to `dist/public/`, server built to `dist/index.cjs`, static files served by Express

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## External Dependencies

### Required Services
- **PostgreSQL**: Database, must be provisioned with `DATABASE_URL` environment variable set

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express**: HTTP server framework (v5)
- **@tanstack/react-query**: Client-side data fetching and caching
- **zod** + **drizzle-zod**: Schema validation shared between client and server
- **framer-motion**: Animation library for UI transitions
- **recharts**: Charting library for dashboard analytics
- **date-fns**: Date formatting utilities
- **wouter**: Lightweight React routing
- **shadcn/ui components**: Full suite of Radix-based UI primitives (dialog, select, tabs, toast, etc.)
- **connect-pg-simple**: PostgreSQL session store (available but sessions not fully implemented yet)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)