'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './auth.module.css'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'adopter' | 'shelter_admin'>('adopter')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, refreshUserData } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        // Login flow
        const { error } = await signIn(email, password)
        if (error) throw error

        // Fetch user role to determine redirect
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (userData?.role === 'shelter_admin') {
            // Check if they have a shelter
            const { data: shelterData } = await supabase
              .from('shelters')
              .select('id')
              .eq('admin_id', user.id)
              .single()

            router.push(shelterData ? '/dashboard' : '/shelter/create')
          } else {
            router.push('/')
          }
        }
      } else {
        // Signup flow
        const { error } = await signUp(email, password)
        if (error) throw error

        // Auto login after signup
        const { error: loginError } = await signIn(email, password)
        if (loginError) throw loginError

        // Update user role if shelter_admin
        const { data: { user } } = await supabase.auth.getUser()
        // if (user && selectedRole === 'shelter_admin') {
        //   await supabase
        //     .from('users')
        //     .update({ role: 'shelter_admin' })
        //     .eq('id', user.id)

        //   // Refresh auth context to get updated role
            if (!user) throw new Error('No user after signup')

            // Create or update profile in public.users
            const { error: upsertErr } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                role: selectedRole, // <-- exact ce a ales utilizatorul
              })

            if (upsertErr) throw upsertErr

        await refreshUserData()
        // }

        // Redirect based on role
        if (selectedRole === 'shelter_admin') {
          router.push('/shelter/create')
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      // Show user-friendly error messages
      const message = err.message
      if (message.includes('invalid')) {
        setError('Invalid email address. Try using a real email or test@test.com')
      } else if (message.includes('already registered')) {
        setError('This email is already registered. Try logging in instead.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isLogin ? 'Login' : 'Sign Up'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          {!isLogin && (
            <div className={styles.formGroupLast}>
              <label className={styles.label}>I want to:</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="adopter"
                    checked={selectedRole === 'adopter'}
                    onChange={() => setSelectedRole('adopter')}
                  />
                  <span>Adopt a pet</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="shelter_admin"
                    checked={selectedRole === 'shelter_admin'}
                    onChange={() => setSelectedRole('shelter_admin')}
                  />
                  <span>Manage a shelter</span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className={styles.toggleContainer}>
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className={styles.toggleButton}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
