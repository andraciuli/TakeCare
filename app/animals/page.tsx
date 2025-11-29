'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import styles from './animals.module.css'

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const { data, error } = await supabase.from('animals').select('*')
        if (error) throw error
        setAnimals(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAnimals()
  }, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading animals...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div style={{ textAlign: 'center' }}>
          <p className={styles.errorText}>Error: {error}</p>
          <p className={styles.hint}>Make sure to run the seed data SQL</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <h1 className={styles.title}>Available Animals</h1>
        {animals.length === 0 ? (
          <p>No animals found. Run the seed data SQL in Supabase.</p>
        ) : (
          <div className={styles.grid}>
            {animals.map((animal) => (
              <div key={animal.id} className={styles.card}>
                <h2 className={styles.cardTitle}>{animal.name}</h2>
                <p className={styles.info}>
                  <span className={styles.label}>Species:</span> {animal.species}
                </p>
                {animal.breed && (
                  <p className={styles.info}>
                    <span className={styles.label}>Breed:</span> {animal.breed}
                  </p>
                )}
                {animal.age && (
                  <p className={styles.info}>
                    <span className={styles.label}>Age:</span> {animal.age} years
                  </p>
                )}
                <p className={styles.info}>
                  <span className={styles.label}>Sex:</span> {animal.sex}
                </p>
                {animal.description && (
                  <p className={styles.description}>{animal.description}</p>
                )}
                <span
                  className={`${styles.badge} ${
                    animal.status === 'available' ? styles.badgeAvailable : styles.badgeAdopted
                  }`}
                >
                  {animal.status}
                </span>

                {/* Show actions only for authenticated users */}
                {user ? (
                  <div className={styles.actions}>
                    <button
                      className={styles.favoriteButton}
                      onClick={() => alert('Favorite feature coming soon!')}
                    >
                      ♥ Favorite
                    </button>
                    <button
                      className={styles.adoptButton}
                      onClick={() => alert('Adoption request feature coming soon!')}
                    >
                      Request Adoption
                    </button>
                  </div>
                ) : (
                  <div className={styles.loginPrompt}>
                    <Link href="/auth" className={styles.loginLink}>
                      Login to favorite or adopt
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  )
}
