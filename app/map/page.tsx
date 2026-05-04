'use client'

import dynamic from 'next/dynamic'

// Dynamically import the map component with SSR disabled
// This prevents Next.js from trying to server-side render the heavy @arcgis/core library
// which significantly improves compilation time and prevents SSR errors.
const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading map component...</p>
    </div>
  )
})

export default function MapPage() {
  return <MapClient />
}
