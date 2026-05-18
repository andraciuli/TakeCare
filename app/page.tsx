'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  const router = useRouter()
  const { userRole, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (userRole === 'shelter_admin') {
        router.push('/dashboard')
      } else {
        router.push('/animals')
      }
    }
  }, [userRole, loading, router])

  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.2rem', fontFamily: 'var(--font-quicksand)' }}>
          Se încarcă...
        </p>
      </div>
    </>
  )
}
