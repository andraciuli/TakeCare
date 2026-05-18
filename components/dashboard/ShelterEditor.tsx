'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ShelterEditor.module.css'

export default function ShelterEditor({ shelterId }: { shelterId: string }) {
  const [shelter, setShelter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({
    name: '',
    address: '',
    description: '',
    phone: '',
    email: '',
    schedule: '',
    instagram: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
        name: data.name || '',
        address: data.address || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        schedule: data.schedule || '',
        instagram: data.instagram || '',
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
    setSaving(true)

    try {
      const { error } = await supabase
        .from('shelters')
        .update({
          name: formData.name,
          address: formData.address,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email || null,
          schedule: formData.schedule || null,
          instagram: formData.instagram || null,
        })
        .eq('id', shelterId)

      if (error) throw error
      await fetchShelter()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading profile editor...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Shelter Profile Editor</h2>
          <p className={styles.subtitle}>Update your shelter's public identity and contact details.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.icon}>ℹ️</span> General Information
        </h3>
        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label>Shelter Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className={styles.inputGroup}>
            <label>Location / Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label>Mission Statement</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={4}
            placeholder="Tell your story..."
          />
        </div>
      </div>

      <div className={styles.middleRow}>
        <div className={styles.formSection} style={{ flex: 1 }}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.icon}>📸</span> Gallery Photos
          </h3>
          <div className={styles.galleryGrid}>
            <div className={styles.photoSlot}>
              <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop" alt="Gallery 1" />
            </div>
            <div className={styles.photoSlot}>
              <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop" alt="Gallery 2" />
            </div>
          </div>
        </div>

        <div className={styles.formSection} style={{ flex: 1 }}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.icon}>🕒</span> Operating Hours
          </h3>
          <div className={styles.hoursGrid}>
            <label>Mon-Fri</label>
            <input type="text" name="schedule" value={formData.schedule} onChange={handleChange} placeholder="e.g. 9:00 AM - 6:00 PM" />
            <label>Saturday</label>
            <input type="text" placeholder="10:00 AM - 4:00 PM" />
            <label>Sunday</label>
            <input type="text" placeholder="Closed" />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.icon}>📞</span> Contact & Social Links
        </h3>
        <div className={styles.contactGrid}>
          <div className={styles.inputGroup}>
            <label>Public Email</label>
            <div className={styles.inputWithIcon}>
              <span>✉️</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Phone Number</label>
            <div className={styles.inputWithIcon}>
              <span>📞</span>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Instagram Handle</label>
            <div className={styles.inputWithIcon}>
              <span>📸</span>
              <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@handle" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <h3><span className={styles.icon}>👁️</span> Live Preview</h3>
          <span className={styles.previewBadge}>HOW IT LOOKS TO VISITORS</span>
        </div>
        <div className={styles.previewCard}>
          <div className={styles.previewImage}>
            <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=300&fit=crop" alt="Cover" />
            <div className={styles.previewOverlay}>
              <h4>{formData.name || 'Shelter Name'}</h4>
              <p>📍 {formData.address || 'Location'}</p>
            </div>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewMission}>
              <h5>Our Mission</h5>
              <p>"{formData.description || 'Our mission is to bridge the gap between abandoned souls and loving families through education, patience, and warmth.'}"</p>
            </div>
            <div className={styles.previewActions}>
              <div className={styles.previewActionItem}>✉️ Email Us</div>
              <div className={styles.previewActionItem}>📞 Call Now</div>
              <button className={styles.previewButton}>View Animals</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
