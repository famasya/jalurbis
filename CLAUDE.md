# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JalurBis is an interactive map application displaying public transportation routes in Indonesia using real-time data from Kemenhub (Ministry of Transportation). Built with TanStack Start and deployed on Cloudflare Workers.

**Tech Stack:**
- TanStack Start (SSR React framework)
- Cloudflare Workers (deployment platform)
- React 19 + TypeScript
- TailwindCSS + Shadcn UI components
- React Query (data fetching/caching)
- TanStack Router (file-based routing)
- Socket.IO (real-time vehicle tracking)
- Leaflet + React Leaflet (map rendering)
- Bun (package manager and runtime)
- Biome (linting and formatting)

## Development Commands

```bash
# Install dependencies
bun install

# Development server (runs on port 3000, accessible on 0.0.0.0)
bun dev

# Build for production (includes TypeScript check)
bun run build

# Lint and format code
bun run lint

# Preview production build
bun run preview

# Deploy to Cloudflare Workers
bun run deploy

# Generate Cloudflare types (runs automatically after install)
bun run cf-typegen
```

## Architecture Overview

### Routing Structure
- File-based routing using TanStack Router
- Routes are defined in `src/routes/` directory
- `__root.tsx`: Root layout with global providers (ReactQuery, Preferences, SEO)
- `_layout/route.tsx`: Main layout wrapper with bottom navbar and debug bar
- `_layout/index.tsx`: Home page showing transportation mode selection
- `_layout/$code.$slug.tsx`: Dynamic route showing specific corridor/route details
- Route tree is auto-generated in `src/routeTree.gen.ts` (do not edit manually)

### Server Functions
Located in `src/server/`, these are TanStack Start server functions that run on Cloudflare Workers:
- `get-token.ts`: Fetches and decrypts main API authentication token
- `get-socket-token.ts`: Fetches and decrypts Socket.IO authentication token
- `get-trans.ts`: Fetches available transportation modes
- `get-corridor.ts`: Fetches corridor/route details
- `get-routes-corridor.ts`: Fetches routes for a specific corridor
- `find-routes.ts`: Search/filter routes using Fuse.js fuzzy search

All server functions use encrypted tokens via `encrypt-token.ts` library (AES-256-CBC encryption).

### Token Management System
Critical pattern used throughout the app for API authentication:

1. **Token Storage** (`src/lib/token-storage.ts`):
   - Tokens stored in localStorage with expiry times
   - Separate keys for main token and socket token

2. **Token Hooks** (`src/hooks/token-hooks.ts`):
   - `tokenHooks()`: Main API token with auto-refresh
   - `socketTokenHooks()`: Socket.IO token with auto-refresh
   - `prefetchToken()`: For use in route loaders
   - Tokens automatically refresh before expiry using React Query's `refetchInterval`
   - Falls back to server fetch if localStorage is empty/expired

3. **Token Helpers** (`src/lib/token-helpers.ts`):
   - `getRefreshInterval()`: Calculates when to refresh token (70% of TTL)

### Real-time Vehicle Tracking
- Socket.IO connection managed in `use-socket-io.ts` hook
- Connects to `https://gps.brtnusantara.com:5100`
- Listens for events prefixed with `BRT-*` for vehicle position updates
- Validates incoming data with Zod schema (`VehicleSchema`)
- Auto-reconnection with exponential backoff

### Data Fetching Patterns
- React Query for all data fetching with automatic caching and refetching
- Server functions called from client components using `useQuery`
- Token must be passed to all API calls
- Common pattern:
  ```tsx
  const { token } = tokenHooks();
  const { data } = useQuery({
    queryKey: ['key', token],
    queryFn: async () => {
      if (!token) return null;
      return await serverFunction({ data: { token } });
    },
    enabled: !!token,
  });
  ```

### Map Components (`src/components/map/`)
- `client-only-map.tsx`: Wrapper ensuring map only renders on client (Leaflet requires window)
- `transport-map.tsx`: Main map component with Leaflet integration
- `corridor-route.tsx`: Renders route polylines on map
- `vehichle-marker.tsx`: Real-time vehicle position markers
- `shelter-marker.tsx`: Bus shelter/stop markers

### User Preferences (`src/hooks/use-preferences.tsx`)
Manages user settings stored in localStorage:
- `debugMode`: Shows debug information bar
- `grayscaleMode`: Applies grayscale filter to map tiles (better contrast)
- `trackedVehicles`: Array of vehicle IDs to track

Grayscale mode is applied via inline script in `__root.tsx` to prevent flash of unstyled content.

### Color System (`src/lib/color-utils.ts`)
- Generates consistent colors for routes/corridors using hashing
- Ensures good contrast for text readability
- Functions: `stringToColor()`, `getContrastColor()`

### Environment Variables
Configured in `wrangler.jsonc` and `.env`:
- `SECRET_KEY_GPS_SOCKET`: Socket.IO API authentication
- `SECRET_KEY_MAIN`: Main API authentication
- `SECRET_KEY_PTIS`: AES-256 encryption key for token decryption
- `API_BASE_URL`: Main API endpoint
- `GPS_API_BASE_URL`: GPS/real-time tracking API endpoint

Access via `import { env } from "cloudflare:workers"` in server functions.

## Important Patterns

### Path Aliases
- `~/` resolves to `src/` directory (configured in `tsconfig.json`)
- Always use path aliases for imports from `src/`

### TypeScript
- Strict mode enabled
- All files must pass `tsc --noEmit` (checked in build)
- Cloudflare types auto-generated in `worker-configuration.d.ts`

### Code Style
- Biome for linting and formatting (not Prettier/ESLint)
- Tabs for indentation, double quotes for strings
- UI components in `src/components/ui/` are auto-generated from Shadcn (excluded from Biome checks)
- Run `bun run lint` to fix formatting issues

### Cloudflare Workers Specifics
- Uses `node:crypto` for encryption (enabled via `nodejs_compat` flag)
- Smart placement mode for optimal edge routing
- Observability enabled with 100% head sampling

### File Structure Conventions
- Server-side code: `src/server/` (uses `createServerFn()`)
- Client hooks: `src/hooks/`
- Reusable utilities: `src/lib/`
- UI components: `src/components/` (primitives in `ui/` subdirectory)
- Type definitions: `src/types/`
