'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import styles from './Navbar.module.css'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { user, userRole, signOut, loading } = useAuth()
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    if (user && userRole !== 'shelter_admin') {
      const checkUpdates = async () => {
        const { data } = await supabase
          .from('adoption_requests')
          .select('updated_at, status, visit_date')
          .eq('user_id', user.id)

        if (data) {
          const lastViewed = localStorage.getItem('profile_last_viewed')
          if (!lastViewed) {
            localStorage.setItem('profile_last_viewed', new Date().toISOString())
            return
          }

          const hasUnseenUpdate = data.some(req => {
            const isUpdated = req.status !== 'pending' || req.visit_date !== null
            if (!isUpdated) return false
            
            const updatedAtTime = new Date(req.updated_at).getTime()
            const lastViewedTime = new Date(lastViewed).getTime()
            return updatedAtTime > lastViewedTime
          })

          setHasUpdate(hasUnseenUpdate)
        }
      }
      
      checkUpdates()

      const channel = supabase
        .channel('adoption_requests_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'adoption_requests',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const req = payload.new as any
            const isUpdated = req.status !== 'pending' || req.visit_date !== null
            if (isUpdated) {
              const lastViewed = localStorage.getItem('profile_last_viewed')
              if (lastViewed) {
                const updatedAtTime = new Date(req.updated_at).getTime()
                const lastViewedTime = new Date(lastViewed).getTime()
                if (updatedAtTime > lastViewedTime) {
                  setHasUpdate(true)
                }
              } else {
                setHasUpdate(true)
              }
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, userRole])

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        TakeCare
      </Link>

      <div className={styles.navLinks}>
        {userRole !== 'shelter_admin' && (
          <Link href="/animals" className={styles.navLink}>
            Animals
          </Link>
        )}
        {userRole !== 'shelter_admin' && (
          <Link href="/matchmaker" className={styles.navLink}>
            Matchmaker
          </Link>
        )}
        <Link href="/education" className={styles.navLink}>
          Education
        </Link>
        <Link href="/map" className={styles.navLink}>
          Map
        </Link>
        {userRole === 'shelter_admin' && (
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
        )}
      </div>

      <div className={styles.navRight}>
        {loading ? (
          <span className={styles.navLink}>Loading...</span>
        ) : user ? (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link href="/profile" className={styles.navLink}>
                Profile
              </Link>
              {hasUpdate && (
                <span className={styles.notificationDot}></span>
              )}
            </div>
            <button onClick={() => signOut()} className={styles.logoutButton}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/auth" className={styles.loginLink}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
