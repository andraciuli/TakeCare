'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ShelterEditor.module.css'

export default function ShelterEditor({ shelterId }: { shelterId: string }) {
  const [shelter, setShelter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShelter()
  }, [shelterId])

  async function fetchShelter() {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .eq('id', shelterId)
        .single()

      if (error) throw error
      setShelter(data)
      setFormData({
        name: data.name,
        address: data.address,
        phone: data.phone || '',
        email: data.email || '',
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        description: data.description || '',
        schedule: data.schedule || '',
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSave() {
    setError(null)

    try {
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates')
      }

      const { error } = await supabase
        .from('shelters')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone || null,
          email: formData.email || null,
          latitude: lat,
          longitude: lng,
          description: formData.description || null,
          schedule: formData.schedule || null,
        })
        .eq('id', shelterId)

      if (error) throw error

      await fetchShelter()
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading shelter details...</div>
  }

  if (!shelter) {
    return <div className={styles.error}>Shelter not found</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Shelter Details</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className={styles.editButton}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Schedule</label>
            <input
              type="text"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              rows={4}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          <div className={styles.actions}>
            <button onClick={() => setEditing(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Name:</span>
            <span>{shelter.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Address:</span>
            <span>{shelter.address}</span>
          </div>
          {shelter.phone && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Phone:</span>
              <span>{shelter.phone}</span>
            </div>
          )}
          {shelter.email && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Email:</span>
              <span>{shelter.email}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.label}>Location:</span>
            <span>{shelter.latitude}, {shelter.longitude}</span>
          </div>
          {shelter.schedule && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Schedule:</span>
              <span>{shelter.schedule}</span>
            </div>
          )}
          {shelter.description && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Description:</span>
              <span>{shelter.description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
