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
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit(animalId: string) {
    try {
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
        })
        .eq('id', animalId)

      if (error) throw error

      await fetchAnimals()
      setEditingId(null)
      setEditForm({})
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
