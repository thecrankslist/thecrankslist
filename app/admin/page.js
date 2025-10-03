'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [rejectedUsers, setRejectedUsers] = useState([])
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (adminData) {
        setIsAdmin(true)
        fetchUsers()
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const pending = data.filter(u => u.approval_status === 'pending')
      const approved = data.filter(u => u.approval_status === 'approved')
      const rejected = data.filter(u => u.approval_status === 'rejected')

      setPendingUsers(pending)
      setApprovedUsers(approved)
      setRejectedUsers(rejected)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleApprove = async (userId, profileId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', profileId)

      if (error) throw error

      fetchUsers()
      alert('User approved successfully!')
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Error approving user')
    }
  }

  const handleReject = async (userId, profileId) => {
    const reason = prompt('Rejection reason (optional):')
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || 'No reason provided'
        })
        .eq('id', profileId)

      if (error) throw error

      fetchUsers()
      alert('User rejected')
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Error rejecting user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-light text-black">loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-light text-black mb-4">access denied</h1>
          <p className="text-gray-600 mb-6">you don't have admin privileges</p>
          <Link href="/" className="text-black underline">return home</Link>
        </div>
      </div>
    )
  }

  const renderUserCard = (userProfile, showActions = true) => {
    const email = userProfile.auth_user?.email || 'No email'
    
    return (
      <div key={userProfile.id} className="bg-white border-2 border-gray-300 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-light text-lg text-black mb-1">
              {userProfile.display_name || userProfile.username || 'No name'}
            </h3>
            <p className="text-gray-600 text-sm">{email}</p>
            {userProfile.location && (
              <p className="text-gray-500 text-sm mt-1">{userProfile.location}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs ${
            userProfile.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            userProfile.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {userProfile.approval_status}
          </span>
        </div>

        {userProfile.bio && (
          <p className="text-gray-600 text-sm mb-4">{userProfile.bio}</p>
        )}

        <div className="text-xs text-gray-500 mb-4">
          Signed up: {new Date(userProfile.created_at).toLocaleDateString()}
        </div>

        {userProfile.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Rejection reason:</strong> {userProfile.rejection_reason}
            </p>
          </div>
        )}

        {showActions && userProfile.approval_status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(userProfile.user_id, userProfile.id)}
              className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              approve
            </button>
            <button
              onClick={() => handleReject(userProfile.user_id, userProfile.id)}
              className="flex-1 bg-white text-black border-2 border-gray-300 px-4 py-2 rounded-lg hover:border-black transition-colors text-sm"
            >
              reject
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <h1 className="text-3xl font-light text-black" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>crankslist</h1>
            </Link>
            <nav className="flex items-center space-x-8">
              <Link href="/browse" className="text-gray-600 hover:text-black transition-colors">browse</Link>
              <Link href="/account" className="text-gray-600 hover:text-black transition-colors">my account</Link>
              <span className="bg-black text-white px-4 py-1 rounded-full text-sm">admin</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-light text-black mb-8">user management</h2>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 font-light transition-colors ${
              activeTab === 'pending' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            pending ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-3 px-4 font-light transition-colors ${
              activeTab === 'approved' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            approved ({approvedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`pb-3 px-4 font-light transition-colors ${
              activeTab === 'rejected' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            rejected ({rejectedUsers.length})
          </button>
        </div>

        {/* User Lists */}
        {activeTab === 'pending' && (
          <div>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-12">no pending users</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {pendingUsers.map(user => renderUserCard(user, true))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div>
            {approvedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-12">no approved users yet</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {approvedUsers.map(user => renderUserCard(user, false))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div>
            {rejectedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-12">no rejected users</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {rejectedUsers.map(user => renderUserCard(user, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}