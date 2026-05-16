'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdoptionRequests.module.css'

export default function AdoptionRequests({ shelterId }: { shelterId: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
          animals!inner(id, name, species, shelter_id),
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
          status: 'approved',
          visit_date: new Date(visitDate).toISOString(),
          visit_message: visitMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequestId)

      if (error) throw error

      // Update animal status to pending or adopted
      const request = requests.find(r => r.id === selectedRequestId)
      if (request) {
        await supabase
          .from('animals')
          .update({ status: 'adopted' }) // or 'pending' if you prefer it to be pending until the visit
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

  if (loading) {
    return <div className={styles.loading}>Loading requests...</div>
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Adoption Requests</h2>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <p>No adoption requests yet.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((request) => (
            <div key={request.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.animalName}>{request.animals.name}</h3>
                  <p className={styles.species}>{request.animals.species}</p>
                </div>
                <span className={`${styles.badge} ${styles[`badge${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`]}`}>
                  {request.status}
                </span>
              </div>

              <div className={styles.userInfo}>
                <p><strong>Applicant:</strong> {request.users.email}</p>
                {request.users.first_name && (
                  <p><strong>Name:</strong> {request.users.first_name} {request.users.last_name}</p>
                )}
                {request.users.phone && (
                  <p><strong>Phone:</strong> {request.users.phone}</p>
                )}
              </div>

              {request.users.adoption_profile && Object.keys(request.users.adoption_profile).length > 0 && (
                <div className={styles.adoptionProfile}>
                  <h4 style={{marginTop: '1rem', marginBottom: '0.5rem', color: '#374151'}}>Adoption Profile / Interview</h4>
                  <div style={{background: '#f9fafb', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#4b5563', display: 'grid', gap: '0.5rem'}}>
                    {request.users.adoption_profile.housing_type && <p><strong>Housing:</strong> {request.users.adoption_profile.housing_type} ({request.users.adoption_profile.housing_status})</p>}
                    {request.users.adoption_profile.household_members && <p><strong>Household:</strong> {request.users.adoption_profile.household_members}</p>}
                    {request.users.adoption_profile.other_pets && <p><strong>Other Pets:</strong> {request.users.adoption_profile.other_pets}</p>}
                    {request.users.adoption_profile.hours_alone && <p><strong>Hours Alone:</strong> {request.users.adoption_profile.hours_alone}</p>}
                    {request.users.adoption_profile.physical_activity && <p><strong>Activity:</strong> {request.users.adoption_profile.physical_activity}</p>}
                    {request.users.adoption_profile.long_term_commitment && <p><strong>Long-term Commitment:</strong> {request.users.adoption_profile.long_term_commitment}</p>}
                    {request.users.adoption_profile.adoption_motivation && <p><strong>Motivation:</strong> {request.users.adoption_profile.adoption_motivation}</p>}
                    {request.users.adoption_profile.sleeping_place && <p><strong>Sleeping Place:</strong> {request.users.adoption_profile.sleeping_place}</p>}
                  </div>
                </div>
              )}

              {request.extra_answers && Object.keys(request.extra_answers).length > 0 && (
                <div className={styles.adoptionProfile} style={{ marginTop: '1rem' }}>
                  <h4 style={{marginBottom: '0.5rem', color: '#374151'}}>Răspunsuri la întrebările suplimentare</h4>
                  <div style={{background: '#f9fafb', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#4b5563', display: 'grid', gap: '0.5rem'}}>
                    {Object.entries(request.extra_answers).map(([question, answer]) => (
                      <div key={question} style={{ marginBottom: '0.5rem' }}>
                        <strong>{question}</strong>
                        <p style={{ margin: '0.2rem 0 0 0' }}>{String(answer)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.message && (
                <div className={styles.message}>
                  <p><strong>Message:</strong></p>
                  <p>{request.message}</p>
                </div>
              )}

              {request.visit_date && (
                <div className={styles.message} style={{ background: '#ecfdf5', borderColor: '#10b981', borderWidth: '1px', borderStyle: 'solid' }}>
                  <p style={{ color: '#047857' }}><strong>Scheduled Visit:</strong> {new Date(request.visit_date).toLocaleString()}</p>
                  {request.visit_message && <p style={{ color: '#065f46', marginTop: '0.5rem' }}>{request.visit_message}</p>}
                </div>
              )}

              <p className={styles.date}>
                Requested: {new Date(request.created_at).toLocaleDateString()}
              </p>

              {request.status === 'pending' && (
                <div className={styles.actions}>
                  <button
                    onClick={() => handleReject(request.id)}
                    className={styles.rejectButton}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openApproveModal(request.id)}
                    className={styles.approveButton}
                  >
                    Approve & Schedule
                  </button>
                </div>
              )}
            </div>
          ))}
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
