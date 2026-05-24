'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './create.module.css'

export default function CreateShelterPage() {
  const { user, userRole, refreshUserData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    description: '',
    schedule: '',
  })

  // Redirect if not shelter admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("Redirecting to auth because user is null")
        router.push('/auth')
      } else if (userRole === 'adopter') {
        console.log("Redirecting to home because userRole is adopter")
        router.push('/')
      }
    }
  }, [user, userRole, authLoading, router])

  if (authLoading) {
    return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>
  }

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate coordinates
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates. Please enter valid numbers.')
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordinates out of range.')
      }

      // Insert shelter
      const { error: insertError } = await supabase
        .from('shelters')
        .insert({
          admin_id: user!.id,
          name: formData.name,
          address: formData.address,
          phone: formData.phone || null,
          email: formData.email || null,
          latitude: lat,
          longitude: lng,
          description: formData.description || null,
          schedule: formData.schedule || null,
        })

      if (insertError) throw insertError

      // Refresh user data to get shelter ID
      await refreshUserData()

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Your Shelter</h1>
        <p className={styles.subtitle}>
          Set up your shelter profile to start managing animals
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Shelter Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Happy Paws Shelter"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="123 Main St, City"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={styles.input}
                placeholder="0712345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="contact@shelter.com"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Latitude *</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="44.4268"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Longitude *</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="26.1025"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Schedule</label>
            <input
              type="text"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              className={styles.input}
              placeholder="Mon-Fri: 9:00-17:00"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Tell people about your shelter..."
              rows={4}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Creating...' : 'Create Shelter'}
          </button>
        </form>

        <p className={styles.coordinatesHelp}>
          Tip: Find coordinates at{' '}
          <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer">
            latlong.net
          </a>
        </p>
      </div>
    </div>
  )
}
