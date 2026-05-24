'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import styles from './Navbar.module.css'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { user, userRole, signOut, loading } = useAuth()
  const [hasScheduledVisit, setHasScheduledVisit] = useState(false)

  useEffect(() => {
    if (user && userRole !== 'shelter_admin') {
      const checkVisits = async () => {
        const { data } = await supabase
          .from('adoption_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .not('visit_date', 'is', null)
          .limit(1)
          
        if (data && data.length > 0) {
          setHasScheduledVisit(true)
        }
      }
      checkVisits()
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
          Educație
        </Link>
        <Link href="/map" className={styles.navLink}>
          Map
        </Link>
        {userRole !== 'shelter_admin' && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Link href="/profile" className={styles.navLink}>
              Cererile mele
            </Link>
            {hasScheduledVisit && (
              <span style={{ 
                position: 'absolute', 
                top: '0px', 
                right: '-8px', 
                width: '10px', 
                height: '10px', 
                backgroundColor: '#3b82f6', 
                borderRadius: '50%',
                border: '2px solid white'
              }}></span>
            )}
          </div>
        )}
        {userRole === 'shelter_admin' && (
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
        )}
      </div>

      <div className={styles.navRight}>
        {loading ? (
          <span className={styles.userEmail}>Loading...</span>
        ) : user ? (
          <>
            <Link href="/profile" className={styles.userEmail} style={{ textDecoration: 'none', cursor: 'pointer' }}>
              Profile
            </Link>
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
