'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AnimalsManager from '@/components/dashboard/AnimalsManager'
import AdoptionRequests from '@/components/dashboard/AdoptionRequests'
import ShelterEditor from '@/components/dashboard/ShelterEditor'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import styles from './dashboard.module.css'

type TabType = 'overview' | 'shelter' | 'animals' | 'requests'

export default function DashboardPage() {
  const { user, userRole, shelterId, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth')
      } else if (userRole !== 'shelter_admin') {
        router.push('/')
      } else if (!shelterId) {
        router.push('/shelter/create')
      }
    }
  }, [user, userRole, shelterId, loading, router])

  if (loading || !shelterId) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      
      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Manager</h2>
          <button 
            className={activeTab === 'overview' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('overview')}
          >
            📊 Dashboard Home
          </button>
          <button 
            className={activeTab === 'shelter' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('shelter')}
          >
            📝 Profile Editor
          </button>
          <button 
            className={activeTab === 'animals' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('animals')}
          >
            🐾 Manage Animals
          </button>
          <button 
            className={activeTab === 'requests' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('requests')}
          >
            📅 Appointments
          </button>
        </aside>

        <main className={styles.mainContent}>
          {activeTab === 'overview' && <DashboardOverview shelterId={shelterId} />}
          {activeTab === 'shelter' && <ShelterEditor shelterId={shelterId} />}
          {activeTab === 'animals' && <AnimalsManager shelterId={shelterId} />}
          {activeTab === 'requests' && <AdoptionRequests shelterId={shelterId} />}
        </main>
      </div>
    </div>
  )
}
