'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CreatePost from '@/components/feed/CreatePost'
import PostCard from '@/components/feed/PostCard'
import styles from './feed.module.css'

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user])

  async function fetchPosts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          users (
            id,
            first_name,
            last_name,
            email
          ),
          comments (
            id,
            content,
            created_at,
            user_id,
            users (
              id,
              first_name,
              last_name,
              email
            )
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPosts(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <p>Loading feed...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles.error}>
          <p className={styles.errorText}>Error: {error}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <h1 className={styles.title}>Community Feed</h1>

          <CreatePost onPostCreated={fetchPosts} />

          <div className={styles.postsContainer}>
            {posts.length === 0 ? (
              <p className={styles.emptyState}>
                No posts yet. Be the first to share something!
              </p>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onPostDeleted={fetchPosts}
                  onCommentAdded={fetchPosts}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
