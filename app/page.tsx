'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import styles from './home.module.css'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
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
    </>
  )
}
