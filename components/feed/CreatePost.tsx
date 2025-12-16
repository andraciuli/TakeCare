'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import styles from './CreatePost.module.css'

interface CreatePostProps {
  onPostCreated: () => void
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  const charCount = content.length
  const maxChars = 500
  const isOverLimit = charCount > maxChars
  const isEmpty = !content.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || isEmpty || isOverLimit) return

    try {
      setSubmitting(true)
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim()
      })

      if (error) throw error

      setContent('')
      onPostCreated()
    } catch (error: any) {
      alert('Error creating post: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
        />
        <div className={styles.footer}>
          <span
            className={`${styles.charCounter} ${
              isOverLimit ? styles.overLimit : ''
            }`}
          >
            {charCount}/{maxChars}
          </span>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isEmpty || isOverLimit || submitting}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
