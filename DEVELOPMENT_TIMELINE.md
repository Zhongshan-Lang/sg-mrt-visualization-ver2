# Development Timeline

## 1. Project Foundation

The project started as an interactive Singapore MRT/LRT visualization built with React, Vite, MapLibre GL, Turf.js, and GeoJSON data.

Early work focused on turning rail network data into a usable map experience:

- Render MRT/LRT lines from GeoJSON.
- Display station points and line colors.
- Add basic map interaction with zoom, pan, rotation, and pitch.
- Build the first station search and station selection flow.
- Establish the main application structure and shared configuration for lines, colors, and station metadata.

## 2. Station And Line Panels

After the base map was working, the project moved toward richer information panels.

Station Panel development included:

- Station details.
- Station images.
- Line badges.
- Exit lists.
- Nearby exit landmarks.
- Facilities and accessibility-related information.
- Forecast and service-style information sections.

Line Panel development included:

- Line metadata.
- Terminal station information.
- Full station lists.
- Line selection from both the map and line controls.
- Adaptive styling for long station names and multilingual labels.

This stage established the project as more than a map: it became a layered transit information interface.

## 3. Multilingual Interface

The project then introduced multilingual display support.

Implemented languages:

- English
- Chinese
- Tamil

Key additions:

- Automatic label switching.
- Manual language switching from the search bar.
- Language lock control.
- Animated text transitions for station names, panel titles, and selected UI labels.
- Layout handling for longer Tamil labels.

This became one of the main UI challenges because different languages have very different text lengths and wrapping behavior.

## 4. Route Planning

Route planning was added as a major functional milestone.

Supported route strategies:

- Fewer stops.
- Shorter distance.
- Fewer transfers.

The Route Panel was expanded to include:

- Start and destination station display.
- Estimated travel time.
- Number of stops.
- Transfer count.
- Fare estimate.
- Distance estimate.
- Detailed journey sections.
- Animated route highlight on the map.

Special attention was required for LRT loops, where route geometry and direction can easily become incorrect. PE, PW, SE, SW, BP, and other loop-style services required targeted handling.

## 5. Route Geometry Regression Testing

As route planning became more complex, route regression tests were added.

The tests cover cases such as:

- PTC to PE stations.
- PTC to PW stations.
- NE to PE transfer behavior.
- STC to SE routing.
- Correct route geometry direction.
- Avoiding invalid straight-line shortcuts on LRT loops.

The route test command is:

```bash
npm run test:routes
```

This stage improved confidence when changing route logic, line highlighting, or generated data indexes.

## 6. Train Simulation

Train visualization was then added to make the map feel more alive.

Train features included:

- Simulated trains moving along route geometry.
- Train hover popup.
- Train click panel.
- Destination and next-station information.
- Full line stop list.
- Estimated arrival times.
- Station badges for transfer stations.
- Multilingual station labels.

The train panel also went through several interaction refinements:

- Panel exclusivity with other panels.
- Popup styling.
- Light and dark theme support.
- Live data refresh while the panel remains open.
- Handling terminal station edge cases.

## 7. Train Camera Tracking

Train tracking was explored as a more cinematic interaction.

The final behavior focused on:

- Clicking a train opens the train panel.
- Tracking view can lock the camera to the train.
- The camera keeps the train centered.
- Zoom can still be adjusted while tracking.
- Different tracking views can be selected, such as bird view and lower follow view.
- Bearing follows the train direction more smoothly.

This was one of the most difficult interaction areas because map camera movement, train movement, user zoom input, and bearing updates all affect each other.

## 8. Camera Choreography

The project later introduced broader camera choreography beyond trains.

Route camera:

- After route planning, the camera frames the journey while avoiding the route panel.
- Search/navigation UI closes quickly after route calculation.
- Camera movement speed was tuned to avoid feeling too abrupt.

Station camera:

- Clicking a station moves to a stable station-focused camera.

Line camera:

- Selecting a line first enters a global overview.
- After a delay, the camera starts a line tour.
- The tour travels from one terminal station to the other.
- The camera path follows a smoothed version of the line direction.
- Manual map interaction exits the automatic tour and returns control to the user.

The line tour required several iterations to balance smoothness, geographic accuracy, endpoint coverage, loop behavior, and bearing changes.

## 9. Map Density And Station Visibility

As the map became richer, visual density became a problem at wide zoom levels.

Improvements included:

- Showing transfer stations at wider zoom levels.
- Showing terminal stations with the same visual importance as transfer stations.
- Hiding ordinary station cores until the user zooms in.
- Enlarging ordinary station cores slightly at closer zoom levels.
- Separating important station layers from local station layers.

This made the map cleaner from far away while keeping detailed station interaction available when zoomed in.

## 10. Data Indexing And Project Organization

To reduce runtime overhead and make the codebase easier to maintain, generated indexes were introduced.

Generated data includes:

- Station code to station data.
- Station code groups.
- Station entrances.
- Line properties.
- Line station sequences.
- Terminal station codes.

The index generation command is:

```bash
npm run build:indexes
```

Code organization was also improved by splitting large files into focused modules:

- Map lifecycle hooks.
- Route navigation hooks.
- Panel state hooks.
- Line highlighting logic.
- Map theme styling.
- Camera utilities.
- Route geometry utilities.
- Interaction helpers.
- Special route rules.

## 11. UI Refinement And Theming

Many smaller refinements were added to improve polish:

- Light and dark mode styling.
- Frosted glass panel surfaces.
- Animated panel transitions.
- Route panel layout improvements.
- Station and line badge styling.
- Language lock glow effect.
- Search bar icon alignment.
- Responsive sizing for long text.
- Collapsible information sections.
- Better panel close behavior and highlight cleanup.

These details helped the interface feel less like a raw map demo and more like a designed transit product.

## 12. Tutorial And Portfolio Documentation

The latest stage focused on making the project easier to explain and present.

Added documentation:

- `PORTFOLIO_CONTEXT.md`
- `DEVELOPMENT_TIMELINE.md`

Added in-app onboarding:

- A search-bar guide button.
- A frosted tutorial modal.
- Chinese and English tutorial content.
- Open and close animations.
- Sections explaining search, routing, stations, lines, trains, map controls, and language controls.

This makes the project more suitable for portfolio review because viewers can understand the system without needing a separate explanation first.

## Current Project State

The project is now a full interactive transit visualization prototype with:

- A real geographic rail map.
- Rich station, line, route, and train panels.
- Multiple route planning strategies.
- Multilingual UI behavior.
- Simulated train movement.
- Camera choreography.
- Route regression tests.
- Generated runtime data indexes.
- Portfolio-oriented documentation.

## Possible Next Milestones

- Add Playwright-based UI regression tests for key interactions.
- Improve mobile layout and touch interaction.
- Add richer facility and accessibility data if reliable sources are available.
- Add more refined station interior or transfer guidance.
- Design lightweight stylized landmarks without relying on unavailable proprietary 3D assets.
- Continue reducing large map/data chunks through targeted lazy loading.
