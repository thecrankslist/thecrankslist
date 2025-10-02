'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MyAccountPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true) // NEW: prevent header initials flash
  const [activeSection, setActiveSection] = useState('listings')
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUnreadCount()
      // Set up real-time listener for new messages
      const messagesSubscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `recipient_email=eq.${user.email}`
          }, 
          () => {
            fetchUnreadCount()
          }
        )
        .subscribe()

      return () => {
        try {
          messagesSubscription.unsubscribe?.()
        } catch {
          // ignore
        }
      }
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      setUserProfile(data || null)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!user) return
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', user.email)
        .eq('is_read', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'listings':
        return <MyListingsContent />
      case 'create':
        return <CreateListingContent />
      case 'messages':
        return <MessagesContent user={user} onReadMessage={fetchUnreadCount} />
      case 'settings':
        return <AccountSettingsContent user={user} onProfileUpdate={handleProfileUpdate} />
      default:
        return <MyListingsContent />
    }
  }

  const getDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name
    if (userProfile?.username) return userProfile.username
    return user?.email || 'User'
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-3xl font-light text-black" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>crankslist</h1>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/browse" className="text-gray-600 hover:text-black transition-colors">browse</Link>
                <div className="relative">
                  <span className="text-gray-600">my account</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  sell
                </Link>
              </nav>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500 font-light">Loading account...</p>
        </div>
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

              {/* Avatar + Label (no initials flash) */}
              <div className="relative flex items-center space-x-2">
                {profileLoading ? (
                  // Neutral placeholder while we don't know yet
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300" />
                ) : userProfile?.profile_picture_url ? (
                  <img
                    src={userProfile.profile_picture_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                    <span className="text-xs text-gray-600">{getInitials()}</span>
                  </div>
                )}

                <span className="text-gray-600">my account</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-black transition-colors"
              >
                sign out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 sticky top-8">
              {/* Profile Section */}
              <div className="mb-6 text-center">
                {profileLoading ? (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-300 mx-auto mb-3" />
                ) : userProfile?.profile_picture_url ? (
                  <img
                    src={userProfile.profile_picture_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 mx-auto mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 mx-auto mb-3">
                    <span className="text-2xl text-gray-600">{getInitials()}</span>
                  </div>
                )}
                <h2 className="text-xl font-light text-black mb-1">{getDisplayName()}</h2>
                <p className="text-gray-500 text-sm font-light">{user?.email}</p>
                {userProfile?.location && (
                  <p className="text-gray-400 text-xs mt-1">📍 {userProfile.location}</p>
                )}
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('listings')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-light transition-colors ${
                    activeSection === 'listings' 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  my listings
                </button>
                
                <button
                  onClick={() => setActiveSection('create')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-light transition-colors ${
                    activeSection === 'create' 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  create listing
                </button>
                
                <button
                  onClick={() => setActiveSection('messages')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-light transition-colors relative ${
                    activeSection === 'messages' 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  messages
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-light transition-colors ${
                    activeSection === 'settings' 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  account settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// My Listings Component
function MyListingsContent() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBikes()
  }, [])

  const fetchMyBikes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('seller_email', user.email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBikes(data || [])
    } catch (error) {
      console.error('Error fetching bikes:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleSoldStatus = async (bikeId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('bikes')
        .update({ is_sold: !currentStatus })
        .eq('id', bikeId)

      if (error) throw error
      
      // Refresh the list
      fetchMyBikes()
    } catch (error) {
      console.error('Error updating bike status:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-black">my listings</h2>
        <Link
          href="/sell"
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-light"
        >
          create new listing
        </Link>
      </div>

      {bikes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚲</div>
          <h3 className="text-xl font-light text-gray-600 mb-2">no listings yet</h3>
          <p className="text-gray-500 font-light mb-6">create your first bike listing to get started</p>
          <Link
            href="/sell"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-light inline-block"
          >
            create listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bikes.map((bike) => (
            <div key={bike.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      href={`/bike/${bike.id}`}
                      className="text-lg font-light text-black hover:underline"
                    >
                      {bike.title}
                    </Link>
                    {bike.is_sold && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        SOLD
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span>{formatPrice(bike.price)}</span>
                    <span>{bike.location}</span>
                    <span>listed {formatDate(bike.created_at)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{bike.bike_type} • {bike.condition}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSoldStatus(bike.id, bike.is_sold)}
                    className={`px-3 py-1 rounded-lg text-sm font-light transition-colors ${
                      bike.is_sold
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {bike.is_sold ? 'mark available' : 'mark sold'}
                  </button>
                  <Link
                    href={`/bike/${bike.id}`}
                    className="text-gray-600 hover:text-black transition-colors text-sm"
                  >
                    view
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Messages Component
function MessagesContent({ user, onReadMessage }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          bikes (
            title,
            price,
            location
          )
        `)
        .eq('recipient_email', user.email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      )

      // Update unread count in parent
      if (onReadMessage) onReadMessage()
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleMessageClick = (message) => {
    setSelectedMessage(message)
    if (!message.is_read) {
      markAsRead(message.id)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-300 rounded"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedMessage) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedMessage(null)}
            className="text-gray-600 hover:text-black transition-colors mr-4"
          >
            ← back to messages
          </button>
          <h2 className="text-2xl font-light text-black">message details</h2>
        </div>

        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-light text-black">{selectedMessage.subject}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  from {selectedMessage.sender_name} ({selectedMessage.sender_email})
                </p>
              </div>
              <span className="text-sm text-gray-400">
                {formatDate(selectedMessage.created_at)}
              </span>
            </div>

            {selectedMessage.bikes && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">regarding:</p>
                <Link
                  href={`/bike/${selectedMessage.bike_id}`}
                  className="font-medium text-black hover:underline"
                >
                  {selectedMessage.bikes.title}
                </Link>
                <p className="text-sm text-gray-500">
                  ${selectedMessage.bikes.price?.toLocaleString()} • {selectedMessage.bikes.location}
                </p>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <a
              href={`mailto:${selectedMessage.sender_email}?subject=Re: ${selectedMessage.subject}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-light"
            >
              reply via email
            </a>
            {selectedMessage.bikes && (
              <Link
                href={`/bike/${selectedMessage.bike_id}`}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-light"
              >
                view listing
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
      <h2 className="text-2xl font-light text-black mb-6">messages</h2>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-light text-gray-600 mb-2">no messages yet</h3>
          <p className="text-gray-500 font-light">
            Messages from interested buyers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className={`border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all ${
                !message.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-black">{message.subject}</h3>
                  {!message.is_read && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      new
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-400">
                  {formatDate(message.created_at)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                from {message.sender_name} ({message.sender_email})
              </p>

              {message.bikes && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    {message.bikes.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${message.bikes.price?.toLocaleString()} • {message.bikes.location}
                  </p>
                </div>
              )}

              <p className="text-gray-700 text-sm line-clamp-2">
                {message.message}
              </p>

              <div className="mt-3 text-right">
                <span className="text-blue-600 text-sm hover:text-blue-700">
                  read more →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Create Listing Component
function CreateListingContent() {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
      <h2 className="text-2xl font-light text-black mb-6">create new listing</h2>
      <p className="text-gray-600 mb-6 font-light">
        Ready to list your bike? Click the button below to create a new listing.
      </p>
      <Link
        href="/sell"
        className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-light inline-block"
      >
        create listing
      </Link>
    </div>
  )
}

// Enhanced Account Settings Component
function AccountSettingsContent({ user, onProfileUpdate }) {
  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    phone: '',
    location: '',
    bio: '',
    profile_picture_url: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      // First, get or create user profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError
      }

      if (existingProfile) {
        setProfile({
          display_name: existingProfile.display_name || '',
          username: existingProfile.username || '',
          phone: existingProfile.phone || '',
          location: existingProfile.location || '',
          bio: existingProfile.bio || '',
          profile_picture_url: existingProfile.profile_picture_url || ''
        })
      } else {
        // Create initial profile record
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.id,
            email: user.email,
            display_name: '',
            username: '',
            phone: '',
            location: '',
            bio: '',
            profile_picture_url: ''
          }])

        if (createError) throw createError
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Error loading profile data' })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      // Check if username is unique (if changed)
      if (profile.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('username', profile.username)
          .neq('user_id', user.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        if (existingUser) {
          setMessage({ type: 'error', text: 'Username is already taken' })
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: profile.display_name,
          username: profile.username,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          profile_picture_url: profile.profile_picture_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Notify parent component about profile update
      if (onProfileUpdate) {
        onProfileUpdate(profile)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Error saving profile changes' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setChangingPassword(true)
    setMessage({ type: '', text: '' })

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setChangingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setChangingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Error changing password' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    setUploadingImage(true)
    setMessage({ type: '', text: '' })

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      // Update profile with new image URL in DB immediately so header/sidebar update too
      const nextProfile = { ...profile, profile_picture_url: publicUrl }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setProfile(nextProfile)
      setMessage({ type: 'success', text: 'Profile picture uploaded!' })

      // Let parent header/sidebar know right away
      if (onProfileUpdate) onProfileUpdate(nextProfile)
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: 'Error uploading image' })
    } finally {
      setUploadingImage(false)
    }
  }

  const removeProfilePicture = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: '',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      const nextProfile = { ...profile, profile_picture_url: '' }
      setProfile(nextProfile)
      setMessage({ type: 'success', text: 'Profile picture removed' })
      if (onProfileUpdate) onProfileUpdate(nextProfile)
    } catch (err) {
      console.error('Error removing profile picture:', err)
      setMessage({ type: 'error', text: 'Error removing profile picture' })
    }
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
      <h2 className="text-2xl font-light text-black mb-6">account settings</h2>
      
      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
            activeTab === 'profile' 
              ? 'bg-white text-black shadow-sm' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
            activeTab === 'password' 
              ? 'bg-white text-black shadow-sm' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Password
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <span className="text-2xl text-gray-500">
                      {profile.display_name ? profile.display_name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium">
                  {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                {profile.profile_picture_url && (
                  <button
                    onClick={removeProfilePicture}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({...profile, display_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="How you want to appear on listings"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="unique username (letters, numbers, underscore only)"
            />
            <p className="text-xs text-gray-500 mt-1">This will be your unique identifier (optional)</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="Your phone number"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({...profile, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="Your city"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="Tell us about yourself (optional)"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{profile.bio.length}/500 characters</p>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-light disabled:opacity-50"
          >
            {saving ? 'saving...' : 'save changes'}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-gray-900"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-light disabled:opacity-50"
          >
            {changingPassword ? 'changing password...' : 'change password'}
          </button>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Use a strong, unique password</li>
              <li>• Consider using a password manager</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}