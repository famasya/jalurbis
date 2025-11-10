# JalurBis

**JalurBis** is an interactive web application that displays public transportation routes and real-time vehicle tracking across Indonesia. The application visualizes transportation data from the Ministry of Transportation (Kemenhub) on an interactive map.

## Features

- Interactive map showing public transportation routes and corridors
- Real-time vehicle position tracking
- Search and filter transportation routes
- View bus shelters and stops along routes

## Tech Stack

- **Framework**: TanStack Start (SSR React framework)
- **Deployment**: Cloudflare Workers
- **UI**: React 19, TailwindCSS, Shadcn UI
- **Data Fetching**: React Query
- **Routing**: TanStack Router (file-based)
- **Real-time**: Socket.IO
- **Maps**: Leaflet, React Leaflet
- **Package Manager**: Bun
- **Code Quality**: Biome (linting & formatting)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Run development server (accessible at http://localhost:3000)
bun dev
```

### Build & Deploy

```bash
# Build for production
bun run build

# Deploy to Cloudflare Workers
bun run deploy
```

### Code Quality

```bash
# Run linter and formatter
bun run lint
```
