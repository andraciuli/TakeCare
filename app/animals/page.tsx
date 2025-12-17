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
  const [requestStatuses, setRequestStatuses] = useState<Map<string, string>>(new Map())
  const [showAdoptModal, setShowAdoptModal] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [adoptionMessage, setAdoptionMessage] = useState('')
  const [requesterName, setRequesterName] = useState<string>('')
  const [requesterEmail, setRequesterEmail] = useState<string>('')
  const [requesterPhone, setRequesterPhone] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select(`
            *,
            shelters (
              id,
              name,
              address,
              phone
            )
          `)
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
            .select('animal_id, status')
            .eq('user_id', user.id)

          if (requestsData) {
            // Only add pending requests to the set (so rejected ones can be re-requested)
            const pendingRequests = requestsData.filter(r => r.status === 'pending')
            setAdoptionRequests(new Set(pendingRequests.map(r => r.animal_id)))

            // Store all statuses for feedback
            const statusMap = new Map()
            requestsData.forEach(r => statusMap.set(r.animal_id, r.status))
            setRequestStatuses(statusMap)
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
    // Check if already has pending request
    if (adoptionRequests.has(animal.id)) {
      alert('You have already requested to adopt this animal')
      return
    }

    // Show feedback for rejected/approved requests
    const status = requestStatuses.get(animal.id)
    if (status === 'rejected') {
      const retry = confirm('Your previous request was declined. Would you like to request again?')
      if (!retry) return
    } else if (status === 'approved') {
      alert('Your request was approved! Contact the shelter for next steps.')
      return
    }

    setSelectedAnimal(animal)
    setRequesterEmail(user?.email ?? '')
    setRequesterName(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '')
    setRequesterPhone('')
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

    if (!requesterName.trim() || !requesterEmail.trim() || !requesterPhone.trim()) {
      alert('Please complete your name, email and phone before submitting.')
      return
    }

    try {
      const { error } = await supabase
        .from('adoption_requests')
        .insert({
          user_id: user.id,
          animal_id: selectedAnimal.id,
          status: 'pending',
          message: adoptionMessage || null,
          // store requester details (make sure these columns exist in your table)
          requester_name: requesterName,
          requester_email: requesterEmail,
          requester_phone: requesterPhone
        })

      if (error) throw error

      // Update local state
      setAdoptionRequests(prev => new Set(prev).add(selectedAnimal.id))
      // Clear modal state
      setShowAdoptModal(false)
      setSelectedAnimal(null)
      setAdoptionMessage('')
      setRequesterName('')
      setRequesterEmail('')
      setRequesterPhone('')
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

                {animal.shelters && (
                  <div className={styles.shelterInfo}>
                    <p className={styles.shelterName}>
                      <strong>Shelter:</strong>{' '}
                      <Link href={`/shelter/${animal.shelters.id}`}>
                        {animal.shelters.name}
                      </Link>
                    </p>
                    {animal.shelters.address && (
                      <p className={styles.shelterAddress}>
                        {animal.shelters.address}
                      </p>
                    )}
                  </div>
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
                      {adoptionRequests.has(animal.id)
                        ? 'Request Pending'
                        : requestStatuses.get(animal.id) === 'rejected'
                        ? 'Request Again'
                        : requestStatuses.get(animal.id) === 'approved'
                        ? 'Approved!'
                        : 'Request Adoption'}
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
            
            <p>Please complete your contact details.</p>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Numele tău</label>
              <input
                className={styles.formInput}
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Numele complet"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Emailul tău</label>
              <input
                className={styles.formInput}
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Telefonul tău</label>
              <input
                className={styles.formInput}
                type="tel"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                placeholder="+40 7xx xxx xxx"
              />
            </div>
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
