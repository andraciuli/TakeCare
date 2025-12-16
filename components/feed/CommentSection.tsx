'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserDisplayName } from '@/lib/userUtils'
import { getRelativeTime } from '@/lib/timeUtils'
import styles from './CommentSection.module.css'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  currentUserId: string
  onCommentAdded: () => void
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  onCommentAdded
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)

  // Sort comments by created_at ascending (oldest first)
  const sortedComments = [...comments].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      onCommentAdded()
    } catch (error: any) {
      alert('Error adding comment: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      onCommentAdded()
    } catch (error: any) {
      alert('Error deleting comment: ' + error.message)
    }
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={() => setShowComments(!showComments)}
      >
        {showComments
          ? 'Hide comments'
          : `Show ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
      </button>

      {showComments && (
        <>
          {sortedComments.length > 0 && (
            <div className={styles.commentsList}>
              {sortedComments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <div>
                      <span className={styles.commentAuthor}>
                        {getUserDisplayName(comment.users)}
                      </span>
                      <span className={styles.commentTime}>
                        {' '}· {getRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    {comment.user_id === currentUserId && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className={styles.commentContent}>{comment.content}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.commentForm}>
            <input
              type="text"
              className={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={300}
              disabled={submitting}
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
