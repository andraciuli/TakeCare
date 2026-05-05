'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdoptionRequests.module.css'

export default function AdoptionRequests({ shelterId }: { shelterId: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  async function handleRequest(requestId: string, newStatus: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('adoption_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      // If approved, update animal status
      if (newStatus === 'approved') {
        const request = requests.find(r => r.id === requestId)
        if (request) {
          await supabase
            .from('animals')
            .update({ status: 'adopted' })
            .eq('id', request.animal_id)
        }
      }

      await fetchRequests()
    } catch (error: any) {
      alert('Error updating request: ' + error.message)
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

              {request.message && (
                <div className={styles.message}>
                  <p><strong>Message:</strong></p>
                  <p>{request.message}</p>
                </div>
              )}

              <p className={styles.date}>
                Requested: {new Date(request.created_at).toLocaleDateString()}
              </p>

              {request.status === 'pending' && (
                <div className={styles.actions}>
                  <button
                    onClick={() => handleRequest(request.id, 'rejected')}
                    className={styles.rejectButton}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, 'approved')}
                    className={styles.approveButton}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
