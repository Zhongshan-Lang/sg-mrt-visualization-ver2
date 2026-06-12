import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')
          if (normalizedId.includes('node_modules/react') || normalizedId.includes('node_modules/react-dom')) {
            return 'react'
          }
          if (normalizedId.includes('node_modules/maplibre-gl')) {
            return 'map'
          }
          if (normalizedId.includes('node_modules/@turf')) {
            return 'turf'
          }
          if (normalizedId.includes('/src/data/sg-rail.geo.json')) {
            return 'rail-data'
          }
          if (
            normalizedId.includes('/src/systems/train/')
          ) {
            return 'train-system'
          }
          if (
            normalizedId.includes('/src/routing/') ||
            normalizedId.includes('/src/utils/routeUtils')
          ) {
            return 'routing'
          }
          if (normalizedId.includes('/src/components/Panels/StationPanel')) {
            return 'station-panel'
          }
          if (normalizedId.includes('/src/components/Panels/RoutePanel')) {
            return 'route-panel'
          }
          if (normalizedId.includes('/src/components/Panels/TrainPanel')) {
            return 'train-panel'
          }
          if (normalizedId.includes('/src/components/Panels/LinePanel')) {
            return 'line-panel'
          }
        },
      },
    },
  },
})
