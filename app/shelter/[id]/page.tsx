'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './shelter.module.css'

export default function ShelterPage() {
  const params = useParams()
  const shelterId = params?.id as string | undefined
  const [shelter, setShelter] = useState<any | null>(null)
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shelterId) return

    async function fetchShelterAndAnimals() {
      setLoading(true)
      try {
        const { data: shelterData, error: shelterError } = await supabase
          .from('shelters')
          .select('*')
          .eq('id', shelterId)
          .single()

        if (shelterError) throw shelterError
        setShelter(shelterData)

        const { data: animalsData, error: animalsError } = await supabase
          .from('animals')
          .select('*')
          .eq('shelter_id', shelterId)

        if (animalsError) throw animalsError
        setAnimals(animalsData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchShelterAndAnimals()
  }, [shelterId])

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loading}>Loading shelter profile...</div>
      </div>
    )
  }

  if (error || !shelter) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.error}>Error: {error || 'Shelter not found.'}</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.previewCard}>
          <div className={styles.previewImage}>
            {/* Fallback to a nice Unsplash image if no specific cover image exists */}
            <img src={shelter.gallery_urls && shelter.gallery_urls.length > 0 ? shelter.gallery_urls[0] : "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=400&fit=crop"} alt="Cover" />
            <div className={styles.previewOverlay}>
              <h1 className={styles.title}>{shelter.name}</h1>
              <p className={styles.address}>📍 {shelter.address}</p>
            </div>
          </div>
          
          <div className={styles.previewContent}>
            <div className={styles.previewMission}>
              <h5>Our Mission</h5>
              <p>"{shelter.description || 'Our mission is to bridge the gap between abandoned souls and loving families through education, patience, and warmth.'}"</p>
              
              <div className={styles.infoGrid}>
                {shelter.schedule && (
                  <div>
                    <h6>🕒 Operating Hours</h6>
                    <p>{shelter.schedule}</p>
                  </div>
                )}
                {shelter.instagram && (
                  <div>
                    <h6>🌐 Social / Website</h6>
                    <a href={shelter.instagram.startsWith('http') ? shelter.instagram : `https://instagram.com/${shelter.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className={styles.socialLink}>
                      {shelter.instagram}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.previewActions}>
              {shelter.email && (
                <a href={`mailto:${shelter.email}`} className={styles.previewActionItem}>
                  <span>✉️</span> {shelter.email}
                </a>
              )}
              {shelter.phone && (
                <a href={`tel:${shelter.phone}`} className={styles.previewActionItem}>
                  <span>📞</span> {shelter.phone}
                </a>
              )}
              <a href="#animals" className={styles.previewButton}>View Animals</a>
            </div>
          </div>
        </div>

        {/* Animals Grid */}
        <div id="animals" className={styles.animalsSection}>
          <h2 className={styles.sectionTitle}>Animals looking for a home ({animals.length})</h2>
          
          {animals.length === 0 ? (
            <p className={styles.emptyText}>No animals currently listed for this shelter.</p>
          ) : (
            <div className={styles.grid}>
              {animals.map((animal) => (
                <Link href={`/animals/${animal.id}`} key={animal.id} className={styles.animalCard}>
                  <div className={styles.animalImageWrapper}>
                    {animal.image_url && animal.image_url.length > 0 ? (
                      <img src={animal.image_url[0]} alt={animal.name} className={styles.animalImage} />
                    ) : (
                      <div className={styles.noImage}>No Image</div>
                    )}
                    <span className={`${styles.statusBadge} ${animal.status === 'available' ? styles.statusAvailable : styles.statusAdopted}`}>
                      {animal.status}
                    </span>
                  </div>
                  <div className={styles.animalInfo}>
                    <h3 className={styles.animalName}>{animal.name}</h3>
                    <p className={styles.animalDetails}>
                      {animal.species} • {animal.breed || 'Unknown breed'} • {animal.age ? `${animal.age} yrs` : 'Unknown age'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
