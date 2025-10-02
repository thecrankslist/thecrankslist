'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Account created! Check your email to verify, then you can sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-light text-black">crankslist</Link>
          <h2 className="text-2xl font-light text-black mt-4">create account</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-light text-black mb-2">email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-black mb-2">password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50"
              placeholder="create a password"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-light disabled:opacity-50"
          >
            {loading ? 'creating account...' : 'create account'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center font-light ${
            message.includes('created') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 font-light">
            already have an account?{' '}
            <Link href="/login" className="text-black hover:underline">
              sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}