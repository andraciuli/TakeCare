'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdoptionRequests.module.css'

export default function AdoptionRequests({ shelterId }: { shelterId: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All Status')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Visit Scheduling Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [visitDate, setVisitDate] = useState('')
  const [visitMessage, setVisitMessage] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [shelterId])

  async function fetchRequests() {
    try {
      const { data, error } = await supabase
        .from('adoption_requests')
        .select(`
          *,
          animals!inner(id, name, species, breed, shelter_id),
          users!inner(email, first_name, last_name, phone, adoption_profile)
        `)
        .eq('animals.shelter_id', shelterId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      alert('Error fetching requests: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(requestId: string) {
    try {
      const { error } = await supabase
        .from('adoption_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error
      await fetchRequests()
    } catch (error: any) {
      alert('Error updating request: ' + error.message)
    }
  }

  function openApproveModal(requestId: string) {
    setSelectedRequestId(requestId)
    setVisitDate('')
    setVisitMessage('')
    setShowModal(true)
  }

  async function confirmApproveAndSchedule() {
    if (!selectedRequestId || !visitDate) {
      alert('Please select a date and time for the visit.')
      return
    }

    setIsScheduling(true)
    try {
      const { error } = await supabase
        .from('adoption_requests')
        .update({
          // keep status as pending, but set visit_date
          visit_date: new Date(visitDate).toISOString(),
          visit_message: visitMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequestId)

      if (error) throw error

      // Update animal status to pending
      const request = requests.find(r => r.id === selectedRequestId)
      if (request) {
        await supabase
          .from('animals')
          .update({ status: 'pending' })
          .eq('id', request.animal_id)
      }

      setShowModal(false)
      setSelectedRequestId(null)
      await fetchRequests()
    } catch (error: any) {
      alert('Error scheduling visit: ' + error.message)
    } finally {
      setIsScheduling(false)
    }
  }

  async function handleFinalApprove(requestId: string, animalId: string) {
    try {
      const { error } = await supabase
        .from('adoption_requests')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      const { error: animalError } = await supabase
        .from('animals')
        .update({ status: 'adopted' })
        .eq('id', animalId)

      if (animalError) throw animalError

      await fetchRequests()
    } catch (error: any) {
      alert('Error finalizing adoption: ' + error.message)
    }
  }

  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'All Status') return true;
    if (activeFilter === 'New' && r.status === 'pending' && !r.visit_date) return true;
    if (activeFilter === 'Interview Scheduled' && r.status === 'pending' && r.visit_date) return true;
    if (activeFilter === 'Approved' && r.status === 'approved') return true;
    if (activeFilter === 'Declined' && r.status === 'rejected') return true;
    return false;
  })

  const stats = {
    new: requests.filter(r => r.status === 'pending' && !r.visit_date).length,
    scheduled: requests.filter(r => r.status === 'pending' && r.visit_date).length,
    approved: requests.filter(r => r.status === 'approved' && new Date(r.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  }

  const FILTERS = ['All Status', 'New', 'Interview Scheduled', 'Approved', 'Declined'];

  if (loading) {
    return <div className={styles.loading}>Loading requests...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Adoption Requests</h2>
        <p className={styles.subtitle}>Manage and review incoming applications from prospective pet parents.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.bgPrimary}`}>
          <p className={styles.statLabel}>NEW REQUESTS</p>
          <p className={styles.statValue}>{stats.new.toString().padStart(2, '0')}</p>
        </div>
        <div className={`${styles.statCard} ${styles.bgWhite}`}>
          <p className={styles.statLabelDark}>SCHEDULED</p>
          <p className={styles.statValueDark}>{stats.scheduled.toString().padStart(2, '0')}</p>
        </div>
        <div className={`${styles.statCard} ${styles.bgGreen}`}>
          <p className={styles.statLabel}>APPROVED THIS WEEK</p>
          <p className={styles.statValue}>{stats.approved.toString().padStart(2, '0')}</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Search applicant or animal..." className={styles.searchInput} />
        </div>
        <div className={styles.filterPills}>
          {FILTERS.map(filter => (
            <button 
              key={filter} 
              className={`${styles.filterPill} ${activeFilter === filter ? styles.pillActive : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {filteredRequests.length === 0 ? (
          <div className={styles.empty}>
            <p>No adoption requests found for this filter.</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const isExpanded = expandedId === request.id;
            const name = request.users.first_name ? `${request.users.first_name} ${request.users.last_name}` : request.users.email;
            const avatarInitial = name.charAt(0).toUpperCase();

            // Status Map
            let tagClass = styles.tagNew;
            let tagLabel = 'NEW';
            if (request.status === 'pending' && request.visit_date) { tagClass = styles.tagScheduled; tagLabel = 'INTERVIEW SCHEDULED'; }
            else if (request.status === 'approved') { tagClass = styles.tagGreen; tagLabel = 'APPROVED'; } // using green tag styling for approved
            else if (request.status === 'rejected') { tagClass = styles.tagDeclined; tagLabel = 'DECLINED'; }

            return (
              <div key={request.id} className={styles.requestItemContainer}>
                <div 
                  className={styles.requestItem}
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                >
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{avatarInitial}</div>
                    <div>
                      <h4 className={styles.applicantName}>{name}</h4>
                      <p className={styles.petInfo}>
                        🐾 {request.animals.name} ({request.animals.breed || request.animals.species}) <span className={styles.dot}>•</span> {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                      </p>
                    </div>
                  </div>
                  <div className={`${styles.statusTag} ${tagClass}`}>
                    {tagLabel}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={styles.expandedContent}>
                    <div className={styles.expandedGrid}>
                      <div className={styles.contactInfo}>
                        <h5>Contact Details</h5>
                        <p><strong>Email:</strong> {request.users.email}</p>
                        {request.users.phone && <p><strong>Phone:</strong> {request.users.phone}</p>}
                      </div>

                      {request.users.adoption_profile && Object.keys(request.users.adoption_profile).length > 0 && (
                        <div className={styles.profileInfo}>
                          <h5>Adoption Profile</h5>
                          <div className={styles.profileGrid}>
                            <p><strong>Housing:</strong> {request.users.adoption_profile.housing_type}</p>
                            <p><strong>Household:</strong> {request.users.adoption_profile.household_members}</p>
                            <p><strong>Other Pets:</strong> {request.users.adoption_profile.other_pets}</p>
                            <p><strong>Activity:</strong> {request.users.adoption_profile.physical_activity}</p>
                          </div>
                        </div>
                      )}

                      {request.extra_answers && Object.keys(request.extra_answers).length > 0 && (
                        <div className={styles.extraAnswers}>
                          <h5>Shelter Custom Questions</h5>
                          {Object.entries(request.extra_answers).map(([question, answer]) => (
                            <div key={question} style={{ marginBottom: '0.5rem' }}>
                              <strong>Q: {question}</strong>
                              <p>A: {String(answer)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && !request.visit_date && (
                      <div className={styles.actions}>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(request.id) }} className={styles.rejectBtn}>
                          Decline Application
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openApproveModal(request.id) }} className={styles.approveBtn}>
                          Approve & Schedule
                        </button>
                      </div>
                    )}
                    {request.status === 'pending' && request.visit_date && (
                      <div className={styles.actions}>
                        <button onClick={(e) => { e.stopPropagation(); handleFinalApprove(request.id, request.animal_id) }} className={styles.approveBtn} style={{ width: '100%' }}>
                          Finalize Adoption (Approved)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {filteredRequests.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreBtn}>Load More Applications <span>˅</span></button>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Approve & Schedule Visit</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Date & Time for Visit</label>
              <input 
                type="datetime-local" 
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Message / Instructions (Optional)</label>
              <textarea 
                value={visitMessage}
                onChange={(e) => setVisitMessage(e.target.value)}
                placeholder="E.g., Please bring your ID. We look forward to meeting you!"
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowModal(false)} 
                className={styles.cancelButton}
                disabled={isScheduling}
              >
                Cancel
              </button>
              <button 
                onClick={confirmApproveAndSchedule} 
                className={styles.scheduleButton}
                disabled={isScheduling || !visitDate}
              >
                {isScheduling ? 'Scheduling...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
