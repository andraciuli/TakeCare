'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './DashboardOverview.module.css'
import Link from 'next/link'

export default function DashboardOverview({ shelterId }: { shelterId: string }) {
  const [stats, setStats] = useState({ animals: 0, pending: 0, matches: 0 })
  const [trendData, setTrendData] = useState<{ month: string; percentage: number }[]>([])
  const [priorities, setPriorities] = useState<{ id: number; text: string; urgent: boolean }[]>([])
  const [newPriorityText, setNewPriorityText] = useState('')

  useEffect(() => {
    // Load priorities from local storage
    const savedPriorities = localStorage.getItem(`priorities_${shelterId}`)
    if (savedPriorities) {
      setPriorities(JSON.parse(savedPriorities))
    } else {
      setPriorities([
        { id: 1, text: 'Review 3 new dog applications', urgent: false },
        { id: 2, text: 'Bella needs vaccination update', urgent: true }
      ])
    }
  }, [shelterId])

  useEffect(() => {
    async function fetchOverview() {
      if (!shelterId) return

      // Animals count
      const { count: animalCount } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', shelterId)

      // Adoption requests (scheduled interviews = pending with visit_date, completed = approved)
      const { data: requests } = await supabase
        .from('adoption_requests')
        .select('*, animals!inner(shelter_id)')
        .eq('animals.shelter_id', shelterId)
        .in('status', ['pending', 'approved'])

      const allRequests = requests || []
      const scheduledRequests = allRequests.filter(r => r.status === 'pending' && r.visit_date)
      const approvedRequests = allRequests.filter(r => r.status === 'approved')

      // Calculate matches this month
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const matchesThisMonth = approvedRequests.filter(req => {
        const d = new Date(req.updated_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      }).length

      setStats({
        animals: animalCount || 0,
        pending: scheduledRequests.length, // Scheduled interviews
        matches: matchesThisMonth
      })

      // Calculate trends for last 6 months
      const months: string[] = []
      const counts: number[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        months.push(d.toLocaleString('en-US', { month: 'short' }))
        counts.push(
          approvedRequests.filter(req => {
            const rd = new Date(req.updated_at)
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()
          }).length
        )
      }
      const maxCount = Math.max(...counts, 1) // prevent division by zero
      const trends = months.map((m, i) => ({
        month: m,
        percentage: (counts[i] / maxCount) * 100
      }))
      setTrendData(trends)
    }
    fetchOverview()
  }, [shelterId])

  const addPriority = () => {
    if (!newPriorityText.trim()) return
    const newPri = { id: Date.now(), text: newPriorityText, urgent: false }
    const updated = [...priorities, newPri]
    setPriorities(updated)
    setNewPriorityText('')
    localStorage.setItem(`priorities_${shelterId}`, JSON.stringify(updated))
  }

  const removePriority = (id: number) => {
    const updated = priorities.filter(p => p.id !== id)
    setPriorities(updated)
    localStorage.setItem(`priorities_${shelterId}`, JSON.stringify(updated))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shelter Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, shelter manager.</p>
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
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>💖</div>
          <div>
            <p className={styles.statLabel}>Matches This Month</p>
            <p className={styles.statValue}>{stats.matches}</p>
          </div>
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
            {trendData.map((d, i) => (
              <div 
                key={i} 
                className={`${styles.bar} ${i === trendData.length - 1 ? styles.barActive : ''}`} 
                style={{ height: `${Math.max(d.percentage, 5)}%` }}
              >
                <span>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.prioritiesCard} style={{ flex: 1 }}>
            <p className={styles.prioritiesTitle}>TOP SHELTER PRIORITIES</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                value={newPriorityText}
                onChange={e => setNewPriorityText(e.target.value)}
                placeholder="Add new priority..."
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                onKeyDown={e => e.key === 'Enter' && addPriority()}
              />
              <button 
                onClick={addPriority}
                style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {priorities.map(p => (
                <div key={p.id} className={styles.priorityItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={p.urgent ? styles.priorityIconRed : styles.priorityIconBlue}>
                      {p.urgent ? '🏥' : '📄'}
                    </span>
                    <span className={styles.priorityText}>{p.text}</span>
                    {p.urgent && <span className={styles.tagUrgent}>Urgent</span>}
                  </div>
                  <button 
                    onClick={() => removePriority(p.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
                    title="Remove priority"
                  >
                    ×
                  </button>
                </div>
              ))}
              {priorities.length === 0 && (
                <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>No priorities added.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
