'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
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
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string>>({})
  const { user, userRole, shelterId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userRole === 'shelter_admin') {
      router.push('/dashboard')
    }
  }, [userRole, router])

  // Filter States
  const [filterSpecies, setFilterSpecies] = useState<string[]>(['dog', 'cat'])
  const [filterAge, setFilterAge] = useState<string>('all')
  const [filterSize, setFilterSize] = useState<string>('all')
  const [filterLocation, setFilterLocation] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('newest')

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 9

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterSpecies, filterAge, sortBy, debouncedSearch])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput])

  useEffect(() => {
    async function fetchAnimals() {
      try {
        let query = supabase
          .from('animals')
          .select(`*, shelters(id, name, address, phone)`)
          .in('status', ['available', 'pending'])

        if (debouncedSearch.trim() !== '') {
          query = query.or(`name.ilike.%${debouncedSearch}%,breed.ilike.%${debouncedSearch}%`)
        }

        const { data, error } = await query
        if (error) throw error
        
        let filteredData = data || [];
        
        // Apply local filtering since we don't have all columns perfect for DB filtering yet
        if (filterSpecies.length > 0 && !filterSpecies.includes('all')) {
          filteredData = filteredData.filter(a => filterSpecies.includes(a.species.toLowerCase()));
        }
        
        if (filterAge !== 'all') {
           // Simple mock logic for age range
           filteredData = filteredData.filter(a => {
             if (filterAge === 'puppy') return a.age < 1;
             if (filterAge === 'young') return a.age >= 1 && a.age < 3;
             if (filterAge === 'adult') return a.age >= 3 && a.age < 8;
             if (filterAge === 'senior') return a.age >= 8;
             return true;
           });
        }
        
        // Sorting
        if (sortBy === 'newest') {
          // Assume ID sort or created_at
          filteredData.sort((a, b) => (b.created_at?.localeCompare(a.created_at) || 0))
        } else if (sortBy === 'oldest') {
          filteredData.sort((a, b) => (a.created_at?.localeCompare(b.created_at) || 0))
        }

        setAnimals(filteredData)

        if (user) {
          const { data: favoritesData } = await supabase.from('favorites').select('animal_id').eq('user_id', user.id)
          if (favoritesData) setFavorites(new Set(favoritesData.map(f => f.animal_id)))

          const { data: requestsData } = await supabase.from('adoption_requests').select('animal_id, status').eq('user_id', user.id)
          if (requestsData) {
            const pendingRequests = requestsData.filter(r => r.status === 'pending')
            setAdoptionRequests(new Set(pendingRequests.map(r => r.animal_id)))
            const statusMap = new Map()
            requestsData.forEach(r => statusMap.set(r.animal_id, r.status))
            setRequestStatuses(statusMap)
          }

          const { data: profileData } = await supabase.from('users').select('first_name, last_name, phone').eq('id', user.id).single()
          if (profileData) {
            const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ')
            if (fullName && profileData.phone) setIsProfileComplete(true)
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
    fetchAnimals()
  }, [user, debouncedSearch, filterSpecies, filterAge, sortBy])

  const toggleSpecies = (species: string) => {
    setFilterSpecies(prev => {
      if (prev.includes(species)) return prev.filter(s => s !== species)
      return [...prev, species]
    })
  }

  async function handleToggleFavorite(animalId: string, e: React.MouseEvent) {
    e.preventDefault(); // prevent link navigation
    if (!user) {
      alert("Please login to favorite animals.");
      return;
    }
    const isFavorited = favorites.has(animalId)
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('animal_id', animalId)
        setFavorites(prev => { const newSet = new Set(prev); newSet.delete(animalId); return newSet })
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, animal_id: animalId })
        setFavorites(prev => new Set(prev).add(animalId))
      }
    } catch (error: any) {
      alert('Error updating favorite: ' + error.message)
    }
  }

  function handleRequestAdoption(animal: any, e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      alert("Please login to adopt.");
      router.push('/auth');
      return;
    }
    if (adoptionRequests.has(animal.id)) return alert('You have already requested to adopt this animal')
    
    const status = requestStatuses.get(animal.id)
    if (status === 'rejected') {
      if (!confirm('Your previous request was declined. Would you like to request again?')) return
    } else if (status === 'approved') {
      return alert('Your request was approved! Contact the shelter for next steps.')
    }

    setSelectedAnimal(animal)
    setExtraAnswers({})
    if (!isProfileComplete) {
      setRequesterEmail(user?.email ?? '')
      if (!requesterName) setRequesterName(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '')
    }
    setShowAdoptModal(true)
  }

  async function handleSubmitAdoption() {
    if (!user || !selectedAnimal) return
    if (!requesterName.trim() || !requesterEmail.trim() || !requesterPhone.trim()) {
      setFormError('Te rugăm să completezi numele, emailul și telefonul înainte de a trimite.')
      return
    }
    setFormError('')
    try {
      if (!isProfileComplete) {
        const nameParts = requesterName.trim().split(' ')
        await supabase.from('users').update({
          first_name: nameParts[0],
          last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
          phone: requesterPhone
        }).eq('id', user.id)
      }

      const { error } = await supabase.from('adoption_requests').insert({
        user_id: user.id,
        animal_id: selectedAnimal.id,
        status: 'pending',
        message: adoptionMessage || null,
        extra_answers: extraAnswers
      })

      if (error) throw error

      setAdoptionRequests(prev => new Set(prev).add(selectedAnimal.id))
      setShowAdoptModal(false)
      setSelectedAnimal(null)
      setAdoptionMessage('')
      setSuccessMessage('Cererea de adopție a fost trimisă cu succes!')
      window.scrollTo(0, 0)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error: any) {
      alert('Error submitting request: ' + error.message)
    }
  }

  if (loading) return <div className={styles.page}><Navbar/><div style={{padding: '5rem', textAlign: 'center'}}>Loading animals...</div></div>

  const totalPages = Math.ceil(animals.length / itemsPerPage)
  const displayedAnimals = animals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Your New Best Friend is Waiting.</h1>
          <p className={styles.heroSubtitle}>
            Every heart deserves a home. Browse our community of lovable companions ready to bring joy and loyalty into your life.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => window.scrollTo({top: 600, behavior: 'smooth'})}>Explore Animals</button>
            <Link href="/education" className={styles.btnOutline} style={{textDecoration: 'none', display: 'flex', alignItems: 'center'}}>How it Works</Link>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800" alt="Happy dog in grass" className={styles.heroImage} />
        </div>
      </section>

      <div className={styles.maxWidth}>
        {successMessage && (
          <div style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: '500' }}>
            ✓ {successMessage}
          </div>
        )}

        <div className={styles.mainLayout}>
          {/* ── Sidebar Filters ── */}
          <aside className={styles.sidebar}>
            <div className={styles.filtersContainer}>
              <div className={styles.filtersHeader}>
                <h2 className={styles.filtersTitle}>Filters</h2>
                <button className={styles.clearAllBtn} onClick={() => {
                  setFilterSpecies([]); setFilterAge('all'); setFilterSize('all'); setFilterLocation(''); setSearchInput('');
                }}>Clear all</button>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Species</span>
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkboxInput} checked={filterSpecies.includes('dog')} onChange={() => toggleSpecies('dog')} />
                    Dogs
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkboxInput} checked={filterSpecies.includes('cat')} onChange={() => toggleSpecies('cat')} />
                    Cats
                  </label>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Age Range</span>
                <div className={styles.pillList}>
                  {['Puppy/Kitten', 'Young', 'Adult', 'Senior'].map(age => {
                    const val = age.split('/')[0].toLowerCase();
                    return (
                      <button key={age} className={`${styles.filterPill} ${filterAge === val ? styles.active : ''}`} onClick={() => setFilterAge(val === filterAge ? 'all' : val)}>
                        {age}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Size</span>
                <select className={styles.filterSelect} value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>
                  <option value="all">All Sizes</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Location</span>
                <div className={styles.filterInputContainer}>
                  <span className={styles.filterInputIcon}>📍</span>
                  <input type="text" className={styles.filterInput} placeholder="City or Zip Code" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles.tipCard}>
              Did you know? Senior pets are often already house-trained and ready for a calm life with you.
            </div>
          </aside>

          {/* ── Content Area ── */}
          <main className={styles.contentArea}>
            <div className={styles.topBar}>
              <div className={styles.searchBar}>
                <span className={styles.filterInputIcon}>🔍</span>
                <input 
                  type="text" 
                  className={styles.searchInputTop}
                  placeholder="Search by name or breed..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className={styles.resultsCount}>
                Showing {animals.length} friends
              </div>
              <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
              </select>
            </div>

            {error ? (
              <p>Error loading animals.</p>
            ) : animals.length === 0 ? (
              <p>No animals match your filters.</p>
            ) : (
              <div className={styles.grid}>
                {displayedAnimals.map(animal => (
                  <Link href={`/animals/${animal.id}`} key={animal.id} style={{textDecoration: 'none'}}>
                    <div className={styles.card}>
                      <div className={styles.cardImageContainer}>
                        {/* Mock tags randomly for visual parity with mockup */}
                        {Math.random() > 0.7 && <span className={`${styles.cardTag} ${styles.tagNew}`}>New Arrival</span>}
                        {Math.random() > 0.8 && <span className={`${styles.cardTag} ${styles.tagUrgent}`}>Urgent Adoption</span>}
                        
                        <img 
                          src={(animal.image_url && animal.image_url.length > 0) ? animal.image_url[0] : (animal.species === 'cat' ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800" : "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800")} 
                          alt={animal.name} 
                          className={styles.cardImage} 
                        />
                      </div>

                      <div className={styles.cardContent}>
                        <div className={styles.cardTop}>
                          <h3 className={styles.cardTitle}>{animal.name}</h3>
                          <span className={styles.cardAge}>{animal.age} Years</span>
                        </div>
                        <div className={styles.cardBreed}>{animal.breed || 'Mixed Breed'}</div>
                        
                        <div className={styles.traitPills}>
                          <span className={styles.traitPill}>Vaccinated</span>
                          {animal.species === 'dog' && <span className={styles.traitPill}>House Trained</span>}
                          {animal.species === 'cat' && <span className={styles.traitPill}>Litter Trained</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Real Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageBtn} 
                  onClick={() => {
                    setCurrentPage(p => Math.max(p - 1, 1))
                    window.scrollTo({ top: 600, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page} 
                    className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentPage(page)
                      window.scrollTo({ top: 600, behavior: 'smooth' })
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className={styles.pageBtn} 
                  onClick={() => {
                    setCurrentPage(p => Math.min(p + 1, totalPages))
                    window.scrollTo({ top: 600, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  ›
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: 'var(--surface-variant)', padding: '4rem 0 2rem', marginTop: '4rem' }}>
        <div className={styles.maxWidth} style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem'}}>
          <div style={{maxWidth: '300px'}}>
            <h2 style={{fontFamily: 'var(--font-quicksand)', color: 'var(--primary)', marginBottom: '1rem'}}>TakeCare</h2>
            <p style={{color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: '1.5'}}>Connecting loving families with animals in need through innovation and empathy.</p>
          </div>
          <div>
            <h4 style={{color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'}}>Quick Links</h4>
            <ul style={{listStyle: 'none', padding: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: '2'}}>
              <li>Mission Statement</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
              <li>Volunteer</li>
            </ul>
          </div>
          <div style={{maxWidth: '300px'}}>
            <h4 style={{color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'}}>Stay Connected</h4>
            <p style={{color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1rem'}}>Join our newsletter for heartwarming updates.</p>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input type="email" placeholder="your@email.com" style={{padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', flex: 1}}/>
              <button style={{background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer'}}>Join</button>
            </div>
          </div>
        </div>
        <div style={{textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.8rem', marginTop: '4rem'}}>
          © 2024 TakeCare. Nurturing connections between hearts and paws.
        </div>
      </footer>
    </div>
  )
}
