'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './DashboardOverview.module.css'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardOverview({ shelterId }: { shelterId: string }) {
  const [stats, setStats] = useState({ animals: 0, pending: 0, matches: 0 })
  const [recentAnimals, setRecentAnimals] = useState<any[]>([])

  useEffect(() => {
    async function fetchOverview() {
      if (!shelterId) return

      // Animals count
      const { count: animalCount } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', shelterId)

      // Recent animals
      const { data: recent } = await supabase
        .from('animals')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })
        .limit(4)

      // Pending requests
      const { count: pendingCount } = await supabase
        .from('adoption_applications')
        .select('*, animals!inner(shelter_id)', { count: 'exact', head: true })
        .eq('animals.shelter_id', shelterId)
        .eq('status', 'pending')

      setStats({
        animals: animalCount || 0,
        pending: pendingCount || 0,
        matches: 54 // Mock data for now based on mockup
      })
      setRecentAnimals(recent || [])
    }
    fetchOverview()
  }, [shelterId])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shelter Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, shelter manager.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard/animals/add" className={styles.primaryBtn}>+ Add New Animal</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>🐾</div>
          <div>
            <p className={styles.statLabel}>Total Animals</p>
            <p className={styles.statValue}>{stats.animals}</p>
          </div>
          <div className={styles.trendUp}>+4% ↗</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.red}`}>📋</div>
          <div>
            <p className={styles.statLabel}>Pending Adoptions</p>
            <p className={styles.statValue}>{stats.pending}</p>
          </div>
          <div className={styles.trendLabel}>Current month</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>💖</div>
          <div>
            <p className={styles.statLabel}>Matches This Month</p>
            <p className={styles.statValue}>{stats.matches}</p>
          </div>
          <div className={styles.trendUp}>+12% ↗</div>
        </div>
      </div>

      {/* Split Section */}
      <div className={styles.middleSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Adoption Trends</h3>
            <select className={styles.selectBox}>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className={styles.mockChart}>
            {/* Simple CSS bar chart mock */}
            <div className={styles.bar} style={{ height: '40%' }}><span>Jan</span></div>
            <div className={styles.bar} style={{ height: '55%' }}><span>Feb</span></div>
            <div className={styles.bar} style={{ height: '45%' }}><span>Mar</span></div>
            <div className={styles.bar} style={{ height: '70%' }}><span>Apr</span></div>
            <div className={styles.bar} style={{ height: '65%' }}><span>May</span></div>
            <div className={`${styles.bar} ${styles.barActive}`} style={{ height: '90%' }}><span>Jun</span></div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.capacityCard}>
            <div>
              <h3>Shelter Capacity</h3>
              <p>84% Filled - Consider outreach.</p>
            </div>
            <div className={styles.capacityIcon}>📊</div>
          </div>

          <div className={styles.prioritiesCard}>
            <p className={styles.prioritiesTitle}>TOP SHELTER PRIORITIES</p>
            <div className={styles.priorityItem}>
              <span className={styles.priorityIconRed}>🏥</span>
              <span className={styles.priorityText}>Bella needs vaccination update</span>
              <span className={styles.tagUrgent}>Urgent</span>
            </div>
            <div className={styles.priorityItem}>
              <span className={styles.priorityIconBlue}>📄</span>
              <span className={styles.priorityText}>Review 3 new dog applications</span>
              <span className={styles.tagNew}>New</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added */}
      <div className={styles.recentlyAdded}>
        <div className={styles.recentHeader}>
          <h3>Recently Added Animals</h3>
        </div>
        
        <div className={styles.galleryGrid}>
          {recentAnimals.map(animal => (
            <div key={animal.id} className={styles.animalCard}>
              <div className={styles.imageContainer}>
                {animal.images && animal.images.length > 0 ? (
                  <img src={animal.images[0]} alt={animal.name} className={styles.animalImage} />
                ) : (
                  <div className={styles.placeholderImage}>No Image</div>
                )}
                {animal.status === 'available' && <span className={styles.statusTag}>New Arrival</span>}
              </div>
              <div className={styles.cardContent}>
                <h4>{animal.name}</h4>
                <div className={styles.tags}>
                  <span className={styles.pill}>{animal.breed}</span>
                  <span className={styles.pill}>{animal.age}</span>
                </div>
              </div>
            </div>
          ))}
          {recentAnimals.length === 0 && (
            <p style={{ color: 'var(--on-surface-variant)' }}>No animals added yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
