'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import styles from './profile.module.css'

export default function ProfilePage() {
  const { user, userRole, loading, signOut } = useAuth()
  const router = useRouter()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Adoption Profile State
  const [adoptionProfile, setAdoptionProfile] = useState({
    housing_type: '',
    housing_status: '',
    household_members: '',
    other_pets: '',
    hours_alone: '',
    physical_activity: '',
    vacation_plans: '',
    medical_budget: '',
    food_plan: '',
    previous_experience: '',
    behavior_reaction: '',
    long_term_commitment: '',
    adoption_motivation: '',
    adoption_destination: '',
    sleeping_place: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // My Requests State
  const [myRequests, setMyRequests] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      localStorage.setItem('profile_last_viewed', new Date().toISOString())
      
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, phone, adoption_profile')
        .eq('id', user.id)
        .single()
        
      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setPhone(data.phone || '')
        if (data.adoption_profile) {
          setAdoptionProfile(prev => ({ ...prev, ...data.adoption_profile }))
        }
      }
      
      // Fetch my adoption requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('adoption_requests')
        .select(`
          *,
          animals!inner(
            id, name, species, shelter_id,
            shelters (name, phone, address)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        
      if (requestsData) {
        setMyRequests(requestsData)
      }
    }
    
    fetchProfile()
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAdoptionProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          adoption_profile: adoptionProfile
        })
        .eq('id', user.id)
        
      if (error) throw error
      
      setMessage({ 
        type: 'success', 
        text: 'Profil actualizat cu succes! Atenție: completarea acestui profil nu garantează adopția. Adăpostul va decide dacă sunteți potrivit(ă) pentru adopția acelui animal.' 
      })
      window.scrollTo(0, 0)
      setTimeout(() => setMessage({ type: '', text: '' }), 8000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Eroare la salvare: ' + error.message })
      window.scrollTo(0, 0)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setIsDeleting(true)
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)
        
      if (error) throw error
      
      await signOut()
      router.push('/')
      
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Eroare la ștergerea contului: ' + error.message })
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading || !user) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Setări Cont</h1>
            <p className={styles.subtitle}>Gestionează informațiile personale și completează profilul de adopție.</p>
          </div>

          {message.text && (
            <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Date Personale</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Email (Nu poate fi modificat)</label>
                <input type="email" value={user.email || ''} disabled className={styles.input} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prenume</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Ex: Ion"
                  className={styles.input} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nume de Familie</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Ex: Popescu"
                  className={styles.input} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Număr de Telefon</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ex: 0722 123 456"
                  className={styles.input} 
                />
              </div>
            </div>

            {userRole !== 'shelter_admin' && (
              <>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>1. Contextul Locuinței și Stilul de Viață</h2>
              <p className={styles.sectionDesc}>Aceste întrebări ajută adăpostul să determine dacă mediul este compatibil cu animalul dorit.</p>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipul locuinței</label>
                <select name="housing_type" value={adoptionProfile.housing_type} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="Apartament">Apartament</option>
                  <option value="Casă fără curte">Casă fără curte</option>
                  <option value="Casă cu curte securizată">Casă cu curte securizată</option>
                  <option value="Casă cu curte deschisă">Casă cu curte deschisă</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Statutul locuinței (Proprietar/Chiriaș)</label>
                <select name="housing_status" value={adoptionProfile.housing_status} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="Proprietar">Proprietar</option>
                  <option value="Chiriaș (cu acordul proprietarului)">Chiriaș (cu acordul scris al proprietarului)</option>
                  <option value="Chiriaș (fără acord)">Chiriaș (încă nu am acordul)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Membrii familiei (Adulți, Copii, Persoane alergice)</label>
                <textarea 
                  name="household_members" 
                  value={adoptionProfile.household_members} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: 2 adulți, 1 copil de 5 ani. Nimeni nu este alergic."
                  className={styles.textarea} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Alte animale (Specie, Sex, Sterilizate/Vaccinate)</label>
                <textarea 
                  name="other_pets" 
                  value={adoptionProfile.other_pets} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: Nu mai am alte animale / O pisică femelă, sterilizată și vaccinată la zi."
                  className={styles.textarea} 
                />
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>2. Disponibilitate de Timp și Energie</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Câte ore pe zi va rămâne animalul singur acasă?</label>
                <input 
                  type="text" 
                  name="hours_alone" 
                  value={adoptionProfile.hours_alone} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: 8 ore (program de lucru) / Lucrez de acasă"
                  className={styles.input} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Timp alocat zilnic pentru plimbări și joacă</label>
                <input 
                  type="text" 
                  name="physical_activity" 
                  value={adoptionProfile.physical_activity} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: 2 ore de plimbare, 1 oră joacă indoor"
                  className={styles.input} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cine va îngriji animalul când sunteți plecat în concediu?</label>
                <input 
                  type="text" 
                  name="vacation_plans" 
                  value={adoptionProfile.vacation_plans} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: Părinții / Pet-hotel autorizat"
                  className={styles.input} 
                />
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>3. Responsabilitate Financiară</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Buget pentru vaccinuri, deparazitări și urgențe</label>
                <select name="medical_budget" value={adoptionProfile.medical_budget} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="Da, sunt pregătit financiar">Da, sunt pregătit(ă) pentru costuri anuale și urgențe</option>
                  <option value="Necesită bugetare atentă">Aș prefera proceduri subvenționate dacă e posibil</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Situație financiară</label>
                <select 
                  name="food_plan" 
                  value={adoptionProfile.food_plan} 
                  onChange={handleProfileChange} 
                  className={styles.input}
                >
                  <option value="">Alege o opțiune</option>
                  <option value="Angajat">Angajat</option>
                  <option value="Student">Student</option>
                  <option value="Altele">Altele</option>
                </select>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>4. Experiență și Atitudine</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Ați mai avut animale de companie?</label>
                <textarea 
                  name="previous_experience" 
                  value={adoptionProfile.previous_experience} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: Da, un câine care a trăit 14 ani."
                  className={styles.textarea} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sunteți dispus(ă) să dresați animalul sau să îl duceți la dresaj dacă este necesar?</label>
                <textarea 
                  name="behavior_reaction" 
                  value={adoptionProfile.behavior_reaction} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: Da, sunt dispus(ă) să aloc timp pentru dresaj cu recompense sau să îl duc la un dresor profesionist."
                  className={styles.textarea} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sunteți conștient(ă) de angajamentul pe următorii 10-15 ani?</label>
                <select name="long_term_commitment" value={adoptionProfile.long_term_commitment} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="Da">Da, îmi asum acest angajament</option>
                  <option value="Nu sunt sigur">Nu sunt încă sigur(ă)</option>
                </select>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>5. Intenția Adopției</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>De ce doriți să adoptați în acest moment?</label>
                <textarea 
                  name="adoption_motivation" 
                  value={adoptionProfile.adoption_motivation} 
                  onChange={handleProfileChange} 
                  placeholder="Ex: Caut un companion pentru activități în natură."
                  className={styles.textarea} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Destinația animalului</label>
                <select name="adoption_destination" value={adoptionProfile.adoption_destination} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="Pentru mine">Pentru mine</option>
                  <option value="Membru al familiei">Membru al familiei</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Unde va dormi animalul?</label>
                <select name="sleeping_place" value={adoptionProfile.sleeping_place} onChange={handleProfileChange} className={styles.input}>
                  <option value="">Alege o opțiune</option>
                  <option value="În casă (pe pat/fotoliu/pătuț)">În casă</option>
                  <option value="Afară în cușcă/curte">Afară în cușcă / curte</option>
                  <option value="În garaj/anexă">În garaj / anexă</option>
                  <option value="În lanț">În lanț / țarc izolat</option>
                </select>
              </div>

              <div className={styles.disclaimerBox}>
                <p className={styles.disclaimerText}>
                  ⚠️ <strong>Notă importantă:</strong> Completarea acestui profil NU garantează adopția. Fiecare adăpost va decide dacă sunteți persoana potrivită pentru adopția acelui animal specific, în vederea asigurării binelui acestuia.
                </p>
              </div>

              <div className={styles.buttonGroup}>
                <button type="submit" disabled={isSaving} className={styles.saveButtonFull}>
                  {isSaving ? 'Se salvează...' : 'Salvează Profilul Complet'}
                </button>
              </div>
            </div>
            </>
            )}
          </form>

          {userRole !== 'shelter_admin' && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Cererile mele de adopție</h2>
            {myRequests.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Nu ai trimis nicio cerere de adopție încă.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myRequests.map((req) => (
                  <div key={req.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.animals.name} ({req.animals.species})</h3>
                      <span style={{
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '999px', 
                        fontSize: '0.85rem', 
                        fontWeight: '600',
                        background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#dc2626' : '#92400e'
                      }}>
                        {req.status === 'approved' ? 'APROBATĂ' : req.status === 'rejected' ? 'RESPINSĂ' : 'ÎN AȘTEPTARE'}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0', color: '#4b5563', fontSize: '0.9rem' }}>Adăpost: {req.animals?.shelters?.name}</p>
                    
                    {req.status === 'pending' && req.visit_date && (
                      <div style={{ marginTop: '1rem', background: '#ecfdf5', padding: '1rem', borderRadius: '6px', border: '1px solid #10b981' }}>
                        <p style={{ margin: '0', color: '#047857', fontWeight: 'bold' }}>🗓️ Vizită Programată: {new Date(req.visit_date).toLocaleString()}</p>
                        {req.visit_message && (
                          <p style={{ margin: '0.5rem 0 0 0', color: '#065f46', fontSize: '0.9rem' }}>Mesaj: {req.visit_message}</p>
                        )}
                        <p style={{ margin: '0.5rem 0 0 0', color: '#065f46', fontSize: '0.9rem' }}>Adresă: {req.animals?.shelters?.address} | Tel: {req.animals?.shelters?.phone}</p>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#047857', fontSize: '0.9rem', fontWeight: '500' }}>
                          * Pentru a reprograma vizita, vă rugăm să sunați la adăpost.
                        </p>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <div style={{ marginTop: '1rem', background: '#ecfdf5', padding: '1.25rem', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                        <p style={{ margin: '0', color: '#065f46', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🎉 Adopție Finalizată cu Succes!
                        </p>
                        <p style={{ margin: '0.75rem 0 0 0', color: '#065f46', fontSize: '0.92rem', lineHeight: '1.6' }}>
                          Felicitări! Cererea dumneavoastră de adopție pentru <strong>{req.animals.name}</strong> a fost aprobată definitiv de conducerea adăpostului. Noul membru al familiei vă așteaptă cu nerăbdare! Contactați adăpostul la <strong>{req.animals?.shelters?.phone}</strong> pentru a stabili preluarea.
                        </p>
                      </div>
                    )}

                    {req.status === 'rejected' && (
                      <div style={{ marginTop: '1rem', background: '#fef2f2', padding: '1.25rem', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                        <p style={{ margin: '0', color: '#991b1b', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ✉️ Cerere Neaprobată
                        </p>
                        <p style={{ margin: '0.75rem 0 0 0', color: '#7f1d1d', fontSize: '0.92rem', lineHeight: '1.6' }}>
                          Ne pare rău, dar cererea dumneavoastră de adopție pentru <strong>{req.animals.name}</strong> a fost declinată de adăpost. Vă încurajăm să nu vă pierdeți speranța și să vizitați restul animăluțelor din adăposturile noastre partenere care își caută încă o familie iubitoare.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          <div className={`${styles.card} ${styles.dangerZone}`}>
            <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Atenție</h2>
            <p className={styles.dangerText}>
              Odată ce îți ștergi contul, nu vei mai putea reveni. Te rugăm să fii sigur(ă) de această acțiune.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className={styles.deleteButton}>
              Șterge Contul Definitiv
            </button>
          </div>

        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Ești absolut sigur(ă)?</h3>
            <p className={styles.modalText}>
              Această acțiune nu poate fi anulată. Contul tău și datele asociate vor fi eliminate din platforma noastră.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className={styles.cancelButton}>Anulează</button>
              <button onClick={handleDeleteAccount} disabled={isDeleting} className={styles.deleteButton}>
                {isDeleting ? 'Se șterge...' : 'Da, șterge contul!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
