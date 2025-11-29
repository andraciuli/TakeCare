'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import styles from './map.module.css'

export default function MapPage() {
  const mapViewNode = useRef<HTMLDivElement>(null)
  const [shelters, setShelters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const viewRef = useRef<any>(null)

  // Fetch shelters
  useEffect(() => {
    async function fetchShelters() {
      try {
        const { data, error } = await supabase.from('shelters').select('*')
        if (error) throw error
        setShelters(data || []) 
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchShelters()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapViewNode.current || loading || shelters.length === 0) return
    if (viewRef.current) return // Already initialized

    async function initializeMap() {
      try {
        // Dynamic imports to avoid SSR issues
        const [
          { default: Config },
          { default: WebMap },
          { default: MapView },
          { default: GraphicsLayer },
          { default: Graphic },
          { default: Point }
        ] = await Promise.all([
          import('@arcgis/core/config'),
          import('@arcgis/core/WebMap'),
          import('@arcgis/core/views/MapView'),
          import('@arcgis/core/layers/GraphicsLayer'),
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point')
        ])

        // Set API key
        Config.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY!

        // Create map
        const map = new WebMap({
          basemap: 'streets-vector'
        })

        // Add graphics layer
        const graphicsLayer = new GraphicsLayer()
        map.add(graphicsLayer)

        // Create map view centered on Romania
        const view = new MapView({
          container: mapViewNode.current!,
          center: [25.0, 45.5], // Romania center
          zoom: 7,
          map: map
        })

        viewRef.current = view

        await view.when()
        console.log('ArcGIS map loaded')

        // Add shelter markers
        shelters.forEach(shelter => {
          const point = new Point({
            longitude: shelter.longitude,
            latitude: shelter.latitude
          })

          const graphic = new Graphic({
            geometry: point,
            symbol: {
              type: 'simple-marker',
              color: [0, 112, 243],
              size: 12,
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            } as any,
            attributes: shelter,
            popupTemplate: {
              title: '{name}',
              content: `
                <div style="padding: 10px;">
                  <p><strong>Address:</strong> {address}</p>
                  <p><strong>Phone:</strong> {phone}</p>
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>Schedule:</strong> {schedule}</p>
                  <p style="margin-top: 10px;">{description}</p>
                </div>
              `
            }
          })

          graphicsLayer.add(graphic)
        })

      } catch (err: any) {
        console.error('Map initialization error:', err)
        setError(err.message)
      }
    }

    initializeMap()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [shelters, loading])

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div style={{ textAlign: 'center' }}>
          <p className={styles.errorText}>Error loading map: {error}</p>
        </div>
      </div>
    )
  }

  if (shelters.length === 0) {
    return (
      <div className={styles.loading}>
        <p>No shelters found. Add shelters to the database first.</p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Shelter Map</h1>
          <p className={styles.subtitle}>
            {shelters.length} shelter{shelters.length !== 1 ? 's' : ''} in Romania
          </p>
        </div>
        <div ref={mapViewNode} className={styles.mapView} />
      </div>
    </>
  )
}
