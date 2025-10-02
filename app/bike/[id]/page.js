'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function BikeDetailPage() {
  const params = useParams()
  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchBike(params.id)
    }
  }, [params?.id])

  const fetchBike = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Bike listing not found')
        } else {
          throw error
        }
        return
      }

      setBike(data)
    } catch (error) {
      console.error('Error fetching bike:', error)
      setError('Error loading bike details')
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
      month: 'long',
      day: 'numeric'
    })
  }

  const maskEmail = (email) => {
    if (!email) return ''
    const [username, domain] = email.split('@')
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`
    }
    return `${username.slice(0, 2)}***@${domain}`
  }

  const handleContactClick = () => {
    setShowContactInfo(true)
  }

  const handleContactFormSubmit = async (e) => {
    e.preventDefault()
    setSendingMessage(true)
    
    try {
      // Here you would typically send the message through your backend
      // This could be an API route that emails the seller without revealing their email
      const response = await fetch('/api/contact-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bike.id,
          bikeTitle: bike.title,
          buyerName: contactFormData.name,
          buyerEmail: contactFormData.email,
          message: contactFormData.message,
          sellerEmail: bike.seller_email // This stays on your server
        })
      })

      if (response.ok) {
        alert('Message sent successfully!')
        setContactFormData({ name: '', email: '', message: '' })
        setShowContactForm(false)
      } else {
        alert('Error sending message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handlePhoneClick = (phone) => {
    window.location.href = `tel:${phone}`
  }

  const switchMainImage = (index) => {
    setSelectedImageIndex(index)
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
                <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  sell
                </Link>
              </nav>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500 font-light">Loading bike details...</p>
        </div>
      </div>
    )
  }

  if (error || !bike) {
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
                <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  sell
                </Link>
              </nav>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-12">
            <div className="text-6xl mb-6">🚲</div>
            <h2 className="text-3xl font-light text-black mb-4">bike not found</h2>
            <p className="text-gray-500 mb-8 font-light">{error || 'This listing may have been removed'}</p>
            <Link href="/browse" className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-light">
              back to browse
            </Link>
          </div>
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
              <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                sell
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/browse" className="hover:text-black transition-colors">browse</Link>
            <span>›</span>
            <span className="text-black truncate">{bike.title}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
              {/* Updated Image Gallery */}
              {bike.images && bike.images.length > 0 ? (
                <div className="mb-6">
                  {/* Main Image */}
                  <div className="bg-gray-200 h-64 md:h-80 rounded-lg overflow-hidden mb-4 relative">
                    <img 
                      src={bike.images[selectedImageIndex]} 
                      alt={bike.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-8xl hidden">
                      🚴‍♂️
                    </div>
                    
                    {/* Navigation arrows for multiple images */}
                    {bike.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : bike.images.length - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(selectedImageIndex < bike.images.length - 1 ? selectedImageIndex + 1 : 0)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          →
                        </button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                          {selectedImageIndex + 1} / {bike.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {bike.images.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {bike.images.map((image, index) => (
                        <div 
                          key={index} 
                          className={`aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-75 transition-all border-2 ${
                            selectedImageIndex === index ? 'border-black' : 'border-transparent'
                          }`}
                          onClick={() => switchMainImage(index)}
                        >
                          <img 
                            src={image}
                            alt={`${bike.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-200 h-64 md:h-80 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-8xl">🚴‍♂️</span>
                </div>
              )}

              {/* Title and Price */}
              <div className="mb-6">
                <h1 className="text-3xl font-light text-black mb-2">{bike.title}</h1>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <p className="text-3xl font-light text-green-600">{formatPrice(bike.price)}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📍 {bike.location}</span>
                    <span>📅 {formatDate(bike.created_at)}</span>
                  </div>
                </div>
                {bike.is_sold && (
                  <div className="mt-3">
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      SOLD
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {bike.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-light text-black mb-3">description</h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{bike.description}</p>
                  </div>
                </div>
              )}

              {/* Bike Details */}
              <div className="mb-8">
                <h2 className="text-xl font-light text-black mb-4">details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">type</h3>
                    <p className="text-lg text-black capitalize">{bike.bike_type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">condition</h3>
                    <p className="text-lg text-black capitalize">{bike.condition}</p>
                  </div>
                  {bike.brand && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">brand</h3>
                      <p className="text-lg text-black">{bike.brand}</p>
                    </div>
                  )}
                  {bike.size && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">size</h3>
                      <p className="text-lg text-black">{bike.size}</p>
                    </div>
                  )}
                  {bike.year && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">year</h3>
                      <p className="text-lg text-black">{bike.year}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-light text-black mb-4">contact seller</h2>
              
              {bike.is_sold ? (
                <div className="text-center">
                  <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="text-red-600 font-medium mb-2">sold</p>
                  <p className="text-gray-500 text-sm">this bike is no longer available</p>
                </div>
              ) : !showContactInfo && !showContactForm ? (
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p className="text-gray-600 mb-4 font-light">interested in this bike?</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-light"
                    >
                      send message
                    </button>
                    <button
                      onClick={handleContactClick}
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-light"
                    >
                      show contact info
                    </button>
                  </div>
                </div>
              ) : showContactForm ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-black text-center mb-4">send a message</h3>
                  <form onSubmit={handleContactFormSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Your email"
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Your message"
                        value={contactFormData.message}
                        onChange={(e) => setContactFormData({...contactFormData, message: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32 resize-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-light disabled:opacity-50"
                      >
                        {sendingMessage ? 'sending...' : 'send message'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="w-full text-gray-600 py-2 hover:text-black transition-colors font-light"
                      >
                        cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👤</span>
                    </div>
                    <p className="font-medium text-black">{bike.seller_name || bike.seller_email?.split('@')[0] || 'Seller'}</p>
                    <p className="text-sm text-gray-500">{bike.location}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-light"
                    >
                      send message
                    </button>

                    {bike.seller_phone && (
                      <button
                        onClick={() => handlePhoneClick(bike.seller_phone)}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-light flex items-center justify-center"
                      >
                        <span className="mr-2">📞</span>
                        call seller
                      </button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <p className="mb-2">📧 {maskEmail(bike.seller_email)}</p>
                    {bike.seller_phone && (
                      <p>📞 {bike.seller_phone}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">email masked for privacy</p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                  listed {formatDate(bike.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to browse */}
        <div className="mt-8 text-center">
          <Link 
            href="/browse"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors font-light"
          >
            <span className="mr-2">←</span>
            back to all listings
          </Link>
        </div>
      </div>
    </div>
  )
}