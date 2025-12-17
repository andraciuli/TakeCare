'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from '../../animals/animals.module.css'

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
      <div className={styles.loading}>
        <p>Loading shelter...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div style={{ textAlign: 'center' }}>
          <p className={styles.errorText}>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!shelter) {
    return (
      <div className={styles.loading}>
        <p>Shelter not found.</p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <h1 className={styles.title}>{shelter.name}</h1>
          {shelter.address && <p className={styles.shelterAddress}>{shelter.address}</p>}
          {shelter.phone && <p className={styles.info}><strong>Phone:</strong> {shelter.phone}</p>}
          {shelter.email && <p className={styles.info}><strong>Email:</strong> {shelter.email}</p>}

          <h2 style={{ marginTop: 24 }}>Animals at this shelter</h2>

          {animals.length === 0 ? (
            <p>No animals currently listed for this shelter.</p>
          ) : (
            <div className={styles.grid}>
              {animals.map((animal) => (
                <div key={animal.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{animal.name}</h3>
                  <p className={styles.info}><strong>Species:</strong> {animal.species}</p>
                  {animal.breed && <p className={styles.info}><strong>Breed:</strong> {animal.breed}</p>}
                  {animal.age && <p className={styles.info}><strong>Age:</strong> {animal.age} years</p>}
                  <span className={`${styles.badge} ${
                    animal.status === 'available' ? styles.badgeAvailable : styles.badgeAdopted
                  }`}>{animal.status}</span>
                  <div style={{ marginTop: 10 }}>
                    <Link href={`/animals/${animal.id}`} className={styles.loginLink}>View details</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
