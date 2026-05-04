'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, userRole, signOut, loading } = useAuth()

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        TakeCare
      </Link>

      <div className={styles.navLinks}>
        <Link href="/animals" className={styles.navLink}>
          Animals
        </Link>
        <Link href="/matchmaker" className={styles.navLink}>
          Matchmaker
        </Link>
        <Link href="/education" className={styles.navLink}>
          Educație
        </Link>
        <Link href="/map" className={styles.navLink}>
          Map
        </Link>
        <Link href="/favorites" className={styles.navLink}>
          Favorites
        </Link>
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
  )
}
