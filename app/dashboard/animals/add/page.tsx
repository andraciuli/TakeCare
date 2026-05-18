'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import styles from './add.module.css'

export default function AddAnimalPage() {
  const { shelterId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    sex: 'male',
    description: '',
    status: 'available',
    extra_questions: '',
    characteristics: {
      vaccinated: false,
      sterilized: false,
      dewormed: false,
      house_trained: false,
      litter_trained: false
    }
  })

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)

      // Create preview URLs
      const urls = files.map(file => URL.createObjectURL(file))
      setPreviewUrls(urls)
    }
  }

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)

    // Revoke the old URL to free memory
    URL.revokeObjectURL(previewUrls[index])

    setSelectedFiles(newFiles)
    setPreviewUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let imageUrls: string[] = []

      // Upload images to Supabase Storage if any are selected
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
          const filePath = `${fileName}`

          const { data, error: uploadError } = await supabase.storage
            .from('animal-images')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('animal-images')
            .getPublicUrl(filePath)

          return publicUrl
        })

        imageUrls = await Promise.all(uploadPromises)
      }

      const parsedQuestions = formData.extra_questions
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0)

      // Insert animal with image URLs
      const { error } = await supabase
        .from('animals')
        .insert({
          shelter_id: shelterId,
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          age: formData.age ? parseInt(formData.age) : null,
          sex: formData.sex,
          description: formData.description || null,
          status: formData.status,
          image_url: imageUrls.length > 0 ? imageUrls : null,
          extra_questions: parsedQuestions,
          characteristics: formData.characteristics
        })

      if (error) throw error

      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Add New Animal</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Species *</label>
                <input
                  type="text"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="dog, cat, etc."
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Age (years)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Sex *</label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  className={styles.input}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="adopted">Adopted</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={styles.textarea}
                rows={4}
                placeholder="Describe the animal's personality, health, etc."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Characteristics</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.characteristics.vaccinated}
                    onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, vaccinated: e.target.checked } })}
                  />
                  Vaccinated
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.characteristics.sterilized}
                    onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, sterilized: e.target.checked } })}
                  />
                  Sterilized
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.characteristics.dewormed}
                    onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, dewormed: e.target.checked } })}
                  />
                  Dewormed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.characteristics.house_trained}
                    onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, house_trained: e.target.checked } })}
                  />
                  House Trained (Dogs)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.characteristics.litter_trained}
                    onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, litter_trained: e.target.checked } })}
                  />
                  Litter Trained (Cats)
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Extra Questions for Adopters (Optional)</label>
              <textarea
                name="extra_questions"
                value={formData.extra_questions}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
                placeholder="Write each question on a new line. Adopters will have to answer these when requesting to adopt."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <p className={styles.fileHint}>You can select multiple images</p>

              {previewUrls.length > 0 && (
                <div className={styles.imagePreviewGrid}>
                  {previewUrls.map((url, index) => (
                    <div key={index} className={styles.imagePreviewItem}>
                      <img src={url} alt={`Preview ${index + 1}`} className={styles.previewImage} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className={styles.removeImageButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Adding...' : 'Add Animal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
