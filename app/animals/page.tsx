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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [adoptionRequests, setAdoptionRequests] = useState<Set<string>>(new Set())
  const [showAdoptModal, setShowAdoptModal] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [adoptionMessage, setAdoptionMessage] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const { data, error } = await supabase.from('animals').select('*')
        if (error) throw error
        setAnimals(data || [])

        // Fetch user's favorites and adoption requests if authenticated
        if (user) {
          const { data: favoritesData } = await supabase
            .from('favorites')
            .select('animal_id')
            .eq('user_id', user.id)

          if (favoritesData) {
            setFavorites(new Set(favoritesData.map(f => f.animal_id)))
          }

          const { data: requestsData } = await supabase
            .from('adoption_requests')
            .select('animal_id')
            .eq('user_id', user.id)

          if (requestsData) {
            setAdoptionRequests(new Set(requestsData.map(r => r.animal_id)))
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAnimals()
  }, [user])

  async function handleToggleFavorite(animalId: string) {
    if (!user) return

    const isFavorited = favorites.has(animalId)

    try {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('animal_id', animalId)

        // Update local state
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(animalId)
          return newSet
        })
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, animal_id: animalId })

        // Update local state
        setFavorites(prev => new Set(prev).add(animalId))
      }
    } catch (error: any) {
      alert('Error updating favorite: ' + error.message)
    }
  }

  function handleRequestAdoption(animal: any) {
    // Check if already requested
    if (adoptionRequests.has(animal.id)) {
      alert('You have already requested to adopt this animal')
      return
    }

    setSelectedAnimal(animal)
    setShowAdoptModal(true)
  }

  async function handleSubmitAdoption() {
    if (!user || !selectedAnimal) return

    try {
      const { error } = await supabase
        .from('adoption_requests')
        .insert({
          user_id: user.id,
          animal_id: selectedAnimal.id,
          status: 'pending',
          message: adoptionMessage || null
        })

      if (error) throw error

      // Update local state
      setAdoptionRequests(prev => new Set(prev).add(selectedAnimal.id))
      setShowAdoptModal(false)
      setSelectedAnimal(null)
      setAdoptionMessage('')
      alert('Adoption request submitted successfully!')
    } catch (error: any) {
      alert('Error submitting request: ' + error.message)
    }
  }

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
                      className={`${styles.favoriteButton} ${
                        favorites.has(animal.id) ? styles.favoriteButtonActive : ''
                      }`}
                      onClick={() => handleToggleFavorite(animal.id)}
                    >
                      {favorites.has(animal.id) ? '♥ Favorited' : '♡ Favorite'}
                    </button>
                    <button
                      className={styles.adoptButton}
                      onClick={() => handleRequestAdoption(animal)}
                      disabled={adoptionRequests.has(animal.id)}
                    >
                      {adoptionRequests.has(animal.id) ? 'Request Sent' : 'Request Adoption'}
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

      {/* Adoption Request Modal */}
      {showAdoptModal && selectedAnimal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdoptModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowAdoptModal(false)}
            >
              ×
            </button>
            <h2>Request Adoption: {selectedAnimal.name}</h2>
            <p>Would you like to include a message with your request?</p>
            <textarea
              className={styles.messageInput}
              placeholder="Tell us why you'd like to adopt this pet... (optional)"
              maxLength={200}
              value={adoptionMessage}
              onChange={(e) => setAdoptionMessage(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowAdoptModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmit}
                onClick={handleSubmitAdoption}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
