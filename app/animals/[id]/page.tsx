'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import styles from './details.module.css'
import { useParams, useRouter } from 'next/navigation'

export default function AnimalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const animalId = params?.id as string

  const [animal, setAnimal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  
  const [showAdoptModal, setShowAdoptModal] = useState(false)
  const [adoptionMessage, setAdoptionMessage] = useState('')
  const [requesterName, setRequesterName] = useState<string>('')
  const [requesterEmail, setRequesterEmail] = useState<string>('')
  const [requesterPhone, setRequesterPhone] = useState<string>('')
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string>>({})
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const { user } = useAuth()

  useEffect(() => {
    if (!animalId) return

    async function fetchAnimal() {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select(`
            *,
            shelters (
              id,
              name,
              address,
              phone,
              email
            )
          `)
          .eq('id', animalId)
          .single()
          
        if (error) throw error
        setAnimal(data)

        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('animal_id')
            .eq('user_id', user.id)
            .eq('animal_id', animalId)
            .single()

          if (favData) setIsFavorite(true)

          const { data: reqData } = await supabase
            .from('adoption_requests')
            .select('status')
            .eq('user_id', user.id)
            .eq('animal_id', animalId)
            .order('created_at', { ascending: false })
            .limit(1)

          if (reqData && reqData.length > 0) {
            setRequestStatus(reqData[0].status)
          }

          const { data: profileData } = await supabase
            .from('users')
            .select('first_name, last_name, phone, adoption_profile')
            .eq('id', user.id)
            .single()

          if (profileData) {
            const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ')
            const hasBasicInfo = !!(fullName && profileData.phone)
            const hasAdoptionProfile = profileData.adoption_profile && Object.keys(profileData.adoption_profile).length > 0
            
            if (hasBasicInfo && hasAdoptionProfile) {
              setIsProfileComplete(true)
            } else {
              setIsProfileComplete(false)
            }
            setRequesterName(fullName || user?.user_metadata?.full_name || '')
            setRequesterPhone(profileData.phone || '')
          }
          setRequesterEmail(user.email ?? '')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAnimal()
  }, [animalId, user])

  async function handleToggleFavorite() {
    if (!user) {
      router.push('/auth')
      return
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('animal_id', animalId)
        setIsFavorite(false)
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, animal_id: animalId })
        setIsFavorite(true)
      }
    } catch (error: any) {
      alert('Error updating favorite: ' + error.message)
    }
  }

  function handleRequestAdoption() {
    if (!user) {
      router.push('/auth')
      return
    }

    if (requestStatus === 'pending') {
      alert('You have already requested to adopt this animal')
      return
    }

    if (requestStatus === 'rejected') {
      const retry = confirm('Your previous request was declined. Would you like to request again?')
      if (!retry) return
    } else if (requestStatus === 'approved') {
      alert('Your request was approved! Contact the shelter for next steps.')
      return
    }

    if (!isProfileComplete) {
      setShowAdoptModal(true)
      return
    }

    setExtraAnswers({})
    setShowAdoptModal(true)
  }

  async function handleSubmitAdoption() {
    if (!user || !animal) return

    if (!requesterName.trim() || !requesterEmail.trim() || !requesterPhone.trim()) {
      setFormError('Te rugăm să completezi numele, emailul și telefonul înainte de a trimite.')
      return
    }
    setFormError('')

    try {

      const { error } = await supabase
        .from('adoption_requests')
        .insert({
          user_id: user.id,
          animal_id: animal.id,
          status: 'pending',
          message: adoptionMessage || null,
          extra_answers: extraAnswers
        })

      if (error) throw error

      setRequestStatus('pending')
      setShowAdoptModal(false)
      setAdoptionMessage('')
      setSuccessMessage('Cererea de adopție a fost trimisă cu succes!')
      window.scrollTo(0, 0)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error: any) {
      alert('Error submitting request: ' + error.message)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.loading}>Loading animal details...</div>
      </>
    )
  }

  if (error || !animal) {
    return (
      <>
        <Navbar />
        <div className={styles.error}>Error: {error || 'Animal not found'}</div>
      </>
    )
  }

  const characteristics = animal.characteristics || {}
  const hasImages = animal.image_url && animal.image_url.length > 0

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <div className={styles.breadcrumb}>
            <Link href="/animals">← Inapoi la toate animalele</Link>
          </div>
          
          {successMessage && (
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #10b981', fontWeight: '500' }}>
              ✓ {successMessage}
            </div>
          )}
          
          <div className={styles.content}>
            {/* Left Column: Images */}
            <div className={styles.imageSection}>
              {hasImages ? (
                <>
                  <div className={styles.mainImageContainer}>
                    <img 
                      src={animal.image_url[currentImageIndex]} 
                      alt={animal.name} 
                      className={styles.mainImage} 
                    />
                    {animal.image_url.length > 1 && (
                      <>
                        <button 
                          className={styles.imageNavLeft}
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? animal.image_url.length - 1 : prev - 1)}
                        >
                          ‹
                        </button>
                        <button 
                          className={styles.imageNavRight}
                          onClick={() => setCurrentImageIndex(prev => (prev + 1) % animal.image_url.length)}
                        >
                          ›
                        </button>
                        <span className={styles.imageCount}>
                          {currentImageIndex + 1} / {animal.image_url.length}
                        </span>
                      </>
                    )}
                  </div>
                  {animal.image_url.length > 1 && (
                    <div className={styles.thumbnails}>
                      {animal.image_url.map((url: string, idx: number) => (
                        <img 
                          key={idx}
                          src={url}
                          alt={`${animal.name} thumbnail ${idx + 1}`}
                          className={`${styles.thumbnail} ${idx === currentImageIndex ? styles.activeThumbnail : ''}`}
                          onClick={() => setCurrentImageIndex(idx)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.mainImageContainer} style={{ background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#6b7280' }}>Fără imagine</p>
                </div>
              )}
            </div>

            {/* Right Column: Info */}
            <div className={styles.infoSection}>
              <div className={styles.header}>
                <h1 className={styles.title}>{animal.name}</h1>
                <span className={`${styles.statusBadge} ${animal.status === 'available' ? styles.statusAvailable : styles.statusAdopted}`}>
                  {animal.status === 'available' ? 'Disponibil' : 'Adoptat'}
                </span>
              </div>

              <div className={styles.basicInfo}>
                <div className={styles.infoChip}>
                  <strong>Specie:</strong> <span style={{ textTransform: 'capitalize' }}>{animal.species}</span>
                </div>
                {animal.breed && (
                  <div className={styles.infoChip}>
                    <strong>Rasă:</strong> {animal.breed}
                  </div>
                )}
                {animal.age !== null && (
                  <div className={styles.infoChip}>
                    <strong>Vârstă:</strong> {animal.age} ani
                  </div>
                )}
                <div className={styles.infoChip}>
                  <strong>Sex:</strong> <span style={{ textTransform: 'capitalize' }}>{animal.sex}</span>
                </div>
              </div>

              <h2 className={styles.sectionTitle}>Descriere Comportamentală</h2>
              <p className={styles.description}>
                {animal.description || "Acest animal nu are încă o descriere detaliată."}
              </p>

              <h2 className={styles.sectionTitle}>Caracteristici & Istoric Medical</h2>
              <div className={styles.medicalGrid}>
                <div className={styles.medicalItem}>
                  <span className={characteristics.vaccinated ? styles.iconTrue : styles.iconFalse}>
                    {characteristics.vaccinated ? '✓' : '✗'}
                  </span>
                  <span>Vaccinat</span>
                </div>
                <div className={styles.medicalItem}>
                  <span className={characteristics.sterilized ? styles.iconTrue : styles.iconFalse}>
                    {characteristics.sterilized ? '✓' : '✗'}
                  </span>
                  <span>Sterilizat</span>
                </div>
                <div className={styles.medicalItem}>
                  <span className={characteristics.dewormed !== false ? styles.iconTrue : styles.iconFalse}>
                    {characteristics.dewormed !== false ? '✓' : '✗'}
                  </span>
                  <span>Deparazitat</span>
                </div>
                {animal.species === 'dog' && (
                  <div className={styles.medicalItem}>
                    <span className={characteristics.house_trained ? styles.iconTrue : styles.iconFalse}>
                      {characteristics.house_trained ? '✓' : '✗'}
                    </span>
                    <span>Dresat pentru casă</span>
                  </div>
                )}
                {animal.species === 'cat' && (
                  <div className={styles.medicalItem}>
                    <span className={characteristics.litter_trained ? styles.iconTrue : styles.iconFalse}>
                      {characteristics.litter_trained ? '✓' : '✗'}
                    </span>
                    <span>Învățat la litieră</span>
                  </div>
                )}
              </div>

              {animal.shelters && (
                <div className={styles.shelterCard}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Adăpost</h3>
                  <Link href={`/shelter/${animal.shelters.id}`} className={styles.shelterLink}>
                    {animal.shelters.name}
                  </Link>
                  <p>📍 {animal.shelters.address}</p>
                  {animal.shelters.phone && <p>📞 {animal.shelters.phone}</p>}
                  {animal.shelters.email && <p>✉️ {animal.shelters.email}</p>}
                </div>
              )}

              <div className={styles.actions}>
                <button 
                  className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ''}`}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? '♥ Favorit' : '♡ Salvează'}
                </button>
                <button 
                  className={styles.adoptButton}
                  onClick={handleRequestAdoption}
                  disabled={requestStatus === 'pending'}
                >
                  {requestStatus === 'pending'
                    ? 'Cerere în Așteptare'
                    : requestStatus === 'rejected'
                    ? 'Încearcă din nou'
                    : requestStatus === 'approved'
                    ? 'Aprobat!'
                    : 'Cere Adopție'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Request Modal */}
      {showAdoptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdoptModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowAdoptModal(false)}>×</button>
            <h2>Cerere Adopție: {animal.name}</h2>
            
            {formError && (
              <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {formError}
              </div>
            )}
            
            {!isProfileComplete ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Profil Incomplet</h3>
                <p style={{ marginBottom: '2rem', color: '#4b5563', lineHeight: '1.5' }}>
                  Pentru a trimite o cerere de adopție, te rugăm să îți completezi profilul de adoptator. Acesta ajută adăpostul să se asigure că ești perechea potrivită pentru <strong>{animal.name}</strong>.
                </p>
                <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
                  <button className={styles.modalCancel} onClick={() => setShowAdoptModal(false)}>Anulează</button>
                  <Link href="/profile" className={styles.modalSubmit} style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                    Completează Profilul
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Informațiile tale de contact și profilul de adopție vor fi trimise automat către adăpost.</p>
            
                {animal?.extra_questions && animal.extra_questions.length > 0 && (
                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>Întrebări suplimentare de la adăpost:</h3>
                    {animal.extra_questions.map((q: string, i: number) => (
                      <div key={i} className={styles.formRow}>
                        <label className={styles.formLabel}>{q}</label>
                        <input
                          className={styles.formInput}
                          type="text"
                          value={extraAnswers[q] || ''}
                          onChange={(e) => setExtraAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                          placeholder="Răspunsul tău..."
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <p style={{ marginTop: '1rem' }}>Dorești să incluzi un mesaj pentru adăpost?</p>
                <textarea
                  className={styles.messageInput}
                  placeholder="Spune-ne de ce îți dorești acest animal... (opțional)"
                  maxLength={200}
                  value={adoptionMessage}
                  onChange={(e) => setAdoptionMessage(e.target.value)}
                />
                <div className={styles.modalActions}>
                  <button className={styles.modalCancel} onClick={() => setShowAdoptModal(false)}>Anulează</button>
                  <button className={styles.modalSubmit} onClick={handleSubmitAdoption}>Trimite Cererea</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
