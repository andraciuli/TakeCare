'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './AnimalsManager.module.css'

export default function AnimalsManager({ shelterId }: { shelterId: string }) {
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  useEffect(() => {
    fetchAnimals()
  }, [shelterId])

  async function fetchAnimals() {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnimals(data || [])
    } catch (error: any) {
      alert('Error fetching animals: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(animal: any) {
    setEditingId(animal.id)
    setEditForm({
      name: animal.name,
      species: animal.species,
      breed: animal.breed || '',
      age: animal.age || '',
      sex: animal.sex,
      description: animal.description || '',
      status: animal.status,
    })
    setExistingImages(animal.image_url || [])
    setNewImages([])
    setNewImagePreviews([])
    setImagesToDelete([])
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
    setExistingImages([])
    setNewImages([])
    setNewImagePreviews([])
    setImagesToDelete([])
    // Clean up preview URLs
    newImagePreviews.forEach(url => URL.revokeObjectURL(url))
  }

  function handleNewImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setNewImages([...newImages, ...files])

      const urls = files.map(file => URL.createObjectURL(file))
      setNewImagePreviews([...newImagePreviews, ...urls])
    }
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImages(newImages.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  function markImageForDeletion(url: string) {
    setImagesToDelete([...imagesToDelete, url])
    setExistingImages(existingImages.filter(img => img !== url))
  }

  async function saveEdit(animalId: string) {
    try {
      // Upload new images if any
      let newImageUrls: string[] = []
      if (newImages.length > 0) {
        const uploadPromises = newImages.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
          const filePath = `${fileName}`

          const { data, error: uploadError } = await supabase.storage
            .from('pets')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('pets')
            .getPublicUrl(filePath)

          return publicUrl
        })

        newImageUrls = await Promise.all(uploadPromises)
      }

      // Delete marked images from storage
      if (imagesToDelete.length > 0) {
        const filePaths = imagesToDelete.map(url => {
          // Extract file path from URL
          const urlParts = url.split('/pets/')
          return urlParts[urlParts.length - 1]
        })

        await supabase.storage
          .from('pets')
          .remove(filePaths)
      }

      // Combine existing images (not deleted) with new image URLs
      const finalImageUrls = [...existingImages, ...newImageUrls]

      const { error } = await supabase
        .from('animals')
        .update({
          name: editForm.name,
          species: editForm.species,
          breed: editForm.breed || null,
          age: editForm.age ? parseInt(editForm.age) : null,
          sex: editForm.sex,
          description: editForm.description || null,
          status: editForm.status,
          image_url: finalImageUrls.length > 0 ? finalImageUrls : null,
        })
        .eq('id', animalId)

      if (error) throw error

      // Clean up preview URLs
      newImagePreviews.forEach(url => URL.revokeObjectURL(url))

      await fetchAnimals()
      setEditingId(null)
      setEditForm({})
      setExistingImages([])
      setNewImages([])
      setNewImagePreviews([])
      setImagesToDelete([])
    } catch (error: any) {
      alert('Error updating animal: ' + error.message)
    }
  }

  async function deleteAnimal(animalId: string) {
    if (!confirm('Are you sure you want to delete this animal?')) return

    try {
      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('id', animalId)

      if (error) throw error
      await fetchAnimals()
    } catch (error: any) {
      alert('Error deleting animal: ' + error.message)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading animals...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Manage Animals</h2>
        <Link href="/dashboard/animals/add" className={styles.addButton}>
          + Add Animal
        </Link>
      </div>

      {animals.length === 0 ? (
        <div className={styles.empty}>
          <p>No animals yet. Add your first animal!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {animals.map((animal) => (
            <div key={animal.id} className={styles.card}>
              {editingId === animal.id ? (
                <div className={styles.editForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Species</label>
                      <input
                        type="text"
                        value={editForm.species}
                        onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Breed</label>
                      <input
                        type="text"
                        value={editForm.breed}
                        onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Age</label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Sex</label>
                      <select
                        value={editForm.sex}
                        onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                        className={styles.input}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className={styles.input}
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="adopted">Adopted</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Images</label>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className={styles.imageLabel}>Current Images:</p>
                        <div className={styles.imageGrid}>
                          {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className={styles.imageItem}>
                              <img src={url} alt={`Animal ${index + 1}`} className={styles.thumbnail} />
                              <button
                                type="button"
                                onClick={() => markImageForDeletion(url)}
                                className={styles.removeButton}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images Preview */}
                    {newImagePreviews.length > 0 && (
                      <div>
                        <p className={styles.imageLabel}>New Images:</p>
                        <div className={styles.imageGrid}>
                          {newImagePreviews.map((url, index) => (
                            <div key={`new-${index}`} className={styles.imageItem}>
                              <img src={url} alt={`New ${index + 1}`} className={styles.thumbnail} />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className={styles.removeButton}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload New Images */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageSelect}
                      className={styles.fileInput}
                    />
                    <p className={styles.fileHint}>Add more images</p>
                  </div>

                  <div className={styles.actions}>
                    <button onClick={cancelEdit} className={styles.cancelButton}>
                      Cancel
                    </button>
                    <button onClick={() => saveEdit(animal.id)} className={styles.saveButton}>
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.animalName}>{animal.name}</h3>
                    <span className={`${styles.badge} ${styles[`badge${animal.status.charAt(0).toUpperCase() + animal.status.slice(1)}`]}`}>
                      {animal.status}
                    </span>
                  </div>

                  {animal.image_url && animal.image_url.length > 0 && (
                    <div className={styles.imageGrid}>
                      {animal.image_url.map((url: string, index: number) => (
                        <div key={index} className={styles.imageItem}>
                          <img src={url} alt={`${animal.name} ${index + 1}`} className={styles.thumbnail} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.info}>
                    <p><strong>Species:</strong> {animal.species}</p>
                    {animal.breed && <p><strong>Breed:</strong> {animal.breed}</p>}
                    {animal.age && <p><strong>Age:</strong> {animal.age} years</p>}
                    <p><strong>Sex:</strong> {animal.sex}</p>
                    {animal.description && <p><strong>Description:</strong> {animal.description}</p>}
                  </div>

                  <div className={styles.actions}>
                    <button onClick={() => startEdit(animal)} className={styles.editButton}>
                      Edit
                    </button>
                    <button onClick={() => deleteAnimal(animal.id)} className={styles.deleteButton}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
