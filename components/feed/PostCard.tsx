'use client'
import { supabase } from '@/lib/supabase'
import { getUserDisplayName } from '@/lib/userUtils'
import { getRelativeTime } from '@/lib/timeUtils'
import CommentSection from './CommentSection'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: {
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
    comments: any[]
  }
  currentUserId: string
  onPostDeleted: () => void
  onCommentAdded: () => void
}

export default function PostCard({
  post,
  currentUserId,
  onPostDeleted,
  onCommentAdded
}: PostCardProps) {
  const isOwner = post.user_id === currentUserId

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error
      onPostDeleted()
    } catch (error: any) {
      alert('Error deleting post: ' + error.message)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>
            {getUserDisplayName(post.users)}
          </div>
          <div className={styles.timestamp}>
            {getRelativeTime(post.created_at)}
          </div>
        </div>
        {isOwner && (
          <button className={styles.deleteButton} onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>

      <div className={styles.content}>{post.content}</div>

      <CommentSection
        postId={post.id}
        comments={post.comments || []}
        currentUserId={currentUserId}
        onCommentAdded={onCommentAdded}
      />
    </div>
  )
}
