'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import styles from './home.module.css'

export default function HomePage() {
  const { user, signOut, loading } = useAuth()

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>TakeCare</div>
        <div className={styles.navRight}>
          {loading ? (
            <span className={styles.userEmail}>Loading...</span>
          ) : user ? (
            <>
              <span className={styles.userEmail}>{user.email}</span>
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

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>TakeCare</h1>
          <p className={styles.subtitle}>
            Find your perfect companion from shelters in Romania
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/animals" className={styles.primaryButton}>
              Browse Animals
            </Link>
            <Link href="/map" className={styles.secondaryButton}>
              View Map
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
