'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import styles from './map.module.css'

// ------------------------------------------
// 1. Functii Utilitare pentru Distanță (Haversine)
// ------------------------------------------

interface UserLocation {
  latitude: number;
  longitude: number;
}

const R = 6371; // Raza Pământului în Kilometri
const MAX_DISTANCE_KM = 50; // Raza rezonabilă pentru filtrare (50 km)

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Calculează distanța (în km) între două puncte geografice.
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distanța în km
  return distance;
}


// ------------------------------------------
// 2. Componenta MapPage
// ------------------------------------------

export default function MapPage() {
  const mapViewNode = useRef<HTMLDivElement>(null)
  const [shelters, setShelters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  // Noua stare pentru a comuta vizualizarea
  const [showAllShelters, setShowAllShelters] = useState(false) 
  const viewRef = useRef<any>(null)
  const [filterMessage, setFilterMessage] = useState<string>('');
  
  // Fetch shelters
  useEffect(() => {
    // ... (Logica de fetch neschimbată)
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

  // Get user's geolocation
  useEffect(() => {
    // ... (Logica de geolocație neschimbată)
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Geolocation not supported or running on server.');
      setLocationLoading(false)
      return
    }

    const geoOptions = {
      enableHighAccuracy: true, 
      timeout: 10000, 
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(`Geolocation found: Lat ${position.coords.latitude}, Lon ${position.coords.longitude}`);
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (geoError) => {
        let errorMessage = 'Geolocation error: ';
        
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage += 'Permission denied by user.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case geoError.TIMEOUT:
            errorMessage += 'The request to get user location timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        console.warn(errorMessage, geoError);
        setLocationLoading(false);
      },
      geoOptions
    );
  }, []);

  // Funcție pentru a distruge și reinițializa harta (necesară la schimbarea vizualizării)
  const destroyMap = () => {
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }
  }

  // Handle button click
  const handleToggleView = () => {
    // Distruge harta curentă pentru a o forța să se reinițializeze cu noile date
    destroyMap();
    setShowAllShelters(prev => !prev);
  }

  // Initialize map and apply filtering
  useEffect(() => {
    // Distruge harta la fiecare rulare a efectului, pentru a preveni suprapunerea
    destroyMap(); 

    // Așteptăm ambele operațiuni să se finalizeze
    if (!mapViewNode.current || loading || locationLoading || shelters.length === 0) return
    
    // Dacă harta este deja inițializată (nu ar trebui să se întâmple din cauza destroyMap), ieșim
    // if (viewRef.current) return 
    
    async function initializeMap() {
      try {
        // Dynamic imports 
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

        // ------------------------------------------
        // APLICARE FILTRARE/COMUTARE
        // ------------------------------------------
        let sheltersToDisplay = shelters;
        let message = '';
        
        let initialCenter: [number, number];
        let initialZoom: number;

        if (showAllShelters || !userLocation) {
            // Cazul 1: Arată tot (sau nu avem locație pentru filtrare)
            initialCenter = [25.0, 45.5]; // Centrul României
            initialZoom = 7; 
            message = `Showing all ${shelters.length} shelter(s) in Romania.`;
        } 
        
        if (!showAllShelters && userLocation) {
            // Cazul 2: Arată filtre local
            const nearbyShelters = shelters.filter(shelter => {
                const distance = getDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    shelter.latitude,
                    shelter.longitude
                );
                return distance <= MAX_DISTANCE_KM;
            });

            sheltersToDisplay = nearbyShelters;
            
            // Centrul pe utilizator cu zoom local
            initialCenter = [userLocation.longitude, userLocation.latitude]; 
            initialZoom = 11;
            
            message = `${nearbyShelters.length} shelter${nearbyShelters.length !== 1 ? 's' : ''} found within ${MAX_DISTANCE_KM} km of your location.`;
            
            // Adaugă un marker pentru locația utilizatorului
            const userPoint = new Point({
                longitude: userLocation.longitude,
                latitude: userLocation.latitude
            });

            const userGraphic = new Graphic({
                geometry: userPoint,
                symbol: {
                    type: 'simple-marker',
                    color: [255, 0, 0], 
                    size: 14,
                    outline: {
                        color: [255, 255, 255],
                        width: 3
                    }
                } as any,
                attributes: { name: "Locația Mea" },
                popupTemplate: {
                    title: "Locația Ta Actuală",
                    content: `Rază de căutare: ${MAX_DISTANCE_KM} km`
                }
            });

            graphicsLayer.add(userGraphic);
        }
        
        setFilterMessage(message);

        // Create map view
        const view = new MapView({
          container: mapViewNode.current!,
          center: initialCenter, 
          zoom: initialZoom,
          map: map
        })

        viewRef.current = view

        await view.when()
        console.log(`ArcGIS map loaded. View: ${showAllShelters ? 'All' : 'Filtered'}`);

        // Add shelter markers based on current list (filtered or all)
        sheltersToDisplay.forEach(shelter => {
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

    // Funcția de curățare asigură distrugerea hărții la demontarea componentei
    return () => {
      destroyMap();
    }
  // Adaugă showAllShelters la dependențe, astfel încât comutarea să forțeze reîncărcarea hărții
  }, [shelters, loading, locationLoading, userLocation, showAllShelters]) 

  if (loading || locationLoading) {
    return (
      <div className={styles.loading}>
        <p>{loading ? 'Loading shelters...' : 'Getting your location for filtering...'}</p>
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
          <button 
            onClick={handleToggleView} 
            className={styles.toggleButton} // Necesită stilizare CSS
            disabled={!userLocation} // Dezactivează dacă nu avem locație pentru a arăta "Local"
            title={!userLocation ? "Location required to filter locally" : showAllShelters ? "Show shelters near me" : "Show all shelters"}
          >
            {showAllShelters ? '🏠 Show Local Shelters' : '🌍 Show All Shelters'}
          </button>
          <p className={styles.subtitle}>
            {filterMessage}
          </p>
        </div>
        <div ref={mapViewNode} className={styles.mapView} />
      </div>
    </>
  )
}