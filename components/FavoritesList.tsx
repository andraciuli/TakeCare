"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/app/animals/animals.module.css'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export default function FavoritesList() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    async function fetchFavorites() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`animal_id, animals(*)`)
          .eq('user_id', user!.id)

        if (error) throw error

        const favs = (data || []).map((row: any) => row.animals ?? row)
        setFavorites(favs)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user])

  if (!user) {
    return (
      <div className={styles.container} style={{ padding: 24 }}>
        <h1>Your favorites</h1>
        <p>Please <Link href="/auth">sign in</Link> to see your favorite animals.</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.container}>
      <div style={{ padding: 16 }}>
        <h1 className={styles.title}>Favorite animals</h1>
        {loading && <p>Loading favorites...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && favorites.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <p>You don't have any favorite animals yet.</p>
            <Link href="/animals" className={styles.loginLink}>Browse animals</Link>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className={styles.grid}>
            {favorites.map((animal: any) => (
              <div key={animal.id} className={styles.card}>
                <h3 className={styles.cardTitle}>{animal.name}</h3>
                {animal.species && <p className={styles.info}><strong>Species:</strong> {animal.species}</p>}
                {animal.breed && <p className={styles.info}><strong>Breed:</strong> {animal.breed}</p>}
                <p style={{ marginTop: 8 }}>
                  <button
                    className={styles.detailsButton}
                    onClick={async () => {
                      // If we already have full data, just open modal. Otherwise fetch full record with shelter relation.
                      if (!animal.description || !animal.shelters) {
                        try {
                          const { data } = await supabase
                            .from('animals')
                            .select(`*, shelters(id, name, address, phone)`)
                            .eq('id', animal.id)
                            .single()

                          setSelectedAnimal(data ?? animal)
                        } catch (err) {
                          setSelectedAnimal(animal)
                        }
                      } else {
                        setSelectedAnimal(animal)
                      }
                      setShowModal(true)
                    }}
                  >
                    View details
                  </button>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Details modal */}
      {showModal && selectedAnimal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            <h2>{selectedAnimal.name}</h2>
            {selectedAnimal.species && <p className={styles.info}><strong>Species:</strong> {selectedAnimal.species}</p>}
            {selectedAnimal.breed && <p className={styles.info}><strong>Breed:</strong> {selectedAnimal.breed}</p>}
            {selectedAnimal.age && <p className={styles.info}><strong>Age:</strong> {selectedAnimal.age} years</p>}
            {selectedAnimal.sex && <p className={styles.info}><strong>Sex:</strong> {selectedAnimal.sex}</p>}
            {selectedAnimal.description && <p className={styles.description}>{selectedAnimal.description}</p>}
            {selectedAnimal.shelters && (
              <div className={styles.shelterInfo}>
                <p className={styles.shelterName}><strong>Shelter:</strong> <Link href={`/shelter/${selectedAnimal.shelters.id}`}>{selectedAnimal.shelters.name}</Link></p>
                {selectedAnimal.shelters.address && <p className={styles.shelterAddress}>{selectedAnimal.shelters.address}</p>}
                {selectedAnimal.shelters.phone && <p className={styles.shelterAddress}>Phone: {selectedAnimal.shelters.phone}</p>}
              </div>
            )}
            {/* removed 'Open full page' as requested */}
          </div>
        </div>
      )}
      </div>
    </>
  )
}
