# Singapore MRT Visualization

An interactive Singapore MRT/LRT visualization built with React, Vite, MapLibre GL, and GeoJSON.

This project is not just a static rail map. It combines network visualization, route planning, train simulation, multilingual UI, station information panels, and camera choreography into a single explorable map experience.

## Highlights

- Full MRT/LRT network map with real line geometry
- Route planning with multiple strategies:
  - `Fewest Stops`
  - `Shortest Path`
  - `Fewest Transfers`
- Animated route highlighting and map camera framing
- Station, line, and train panels
- Simulated train movement along the network
- Multilingual labels and UI:
  - English
  - Chinese
  - Tamil
- Light and dark themes
- 2D / 3D map viewing modes
- Guide modal for first-time users

## Tech Stack

- React
- Vite
- MapLibre GL
- Turf.js
- GeoJSON

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and provide your MapTiler key:

```bash
VITE_MAPTILER_KEY=your_maptiler_key
```

### 3. Start the dev server

```bash
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test:routes
npm run build:indexes
```

## Project Structure

```text
src/
  camera/           Camera choreography for station and line views
  components/       Map layers, panels, search, and UI chrome
  contexts/         Shared app context such as theme
  data/             Static data, generated indexes, and loaders
  hooks/            State and lifecycle hooks
  i18n/             UI label dictionaries
  routing/          Route algorithms, geometry, markers, and camera logic
  styles/           Shared animation and UI styles
  systems/train/    Train simulation, popups, panel data, and tracking
  utils/            Shared helpers
```

## Data Notes

- Core network geometry is stored in `src/data/sg-rail.geo.json`
- Lightweight generated indexes are used to keep runtime lookups fast
- Large experimental files that exceed GitHub's file size limit are intentionally kept out of version control

## Why This Project Exists

This project is a frontend / geospatial interface case study focused on:

- dense transit visualization
- map-first interaction design
- route computation with special-case rail logic
- multilingual information design
- coordinated panel and camera behavior

## Status

Active prototype with ongoing UI, interaction, and data-structure refinement.
