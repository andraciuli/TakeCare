'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AnimalsManager from '@/components/dashboard/AnimalsManager'
import AdoptionRequests from '@/components/dashboard/AdoptionRequests'
import ShelterEditor from '@/components/dashboard/ShelterEditor'
import styles from './dashboard.module.css'

type TabType = 'animals' | 'requests' | 'shelter'

export default function DashboardPage() {
  const { user, userRole, shelterId, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('animals')

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
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Shelter Dashboard</h1>

          <div className={styles.tabs}>
            <button
              className={activeTab === 'animals' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('animals')}
            >
              Animals
            </button>
            <button
              className={activeTab === 'requests' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('requests')}
            >
              Adoption Requests
            </button>
            <button
              className={activeTab === 'shelter' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('shelter')}
            >
              Shelter Details
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === 'animals' && <AnimalsManager shelterId={shelterId} />}
          {activeTab === 'requests' && <AdoptionRequests shelterId={shelterId} />}
          {activeTab === 'shelter' && <ShelterEditor shelterId={shelterId} />}
        </div>
      </div>
    </>
  )
}
