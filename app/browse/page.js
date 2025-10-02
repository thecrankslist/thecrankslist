'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function BrowsePage() {
  const [bikes, setBikes] = useState([])
  const [filteredBikes, setFilteredBikes] = useState([])
  const [bikeTypes, setBikeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    search: ''
  })

  // Parse price range from URL parameter
  const parsePriceRange = (priceParam) => {
    if (!priceParam) return { min: '', max: '' }
    
    switch (priceParam) {
      case 'under $500':
        return { min: '', max: '500' }
      case '$500 - $1,000':
        return { min: '500', max: '1000' }
      case '$1,000 - $2,000':
        return { min: '1000', max: '2000' }
      case '$2,000 - $4,000':
        return { min: '2000', max: '4000' }
      case '$4,000+':
        return { min: '4000', max: '' }
      default:
        return { min: '', max: '' }
    }
  }

  // Fetch bikes and bike types from database
  useEffect(() => {
    fetchBikes()
    fetchBikeTypes()
    checkUser()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    
    // Check for search parameters from homepage
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    const typeParam = urlParams.get('type')
    const priceParam = urlParams.get('price')
    const locationParam = urlParams.get('location')
    
    // Parse price range
    const priceRange = parsePriceRange(priceParam)
    
    // Set filters from URL parameters
    setFilters(prev => ({
      ...prev,
      search: searchParam || '',
      type: typeParam || '',
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      location: locationParam || ''
    }))

    return () => subscription.unsubscribe()
  }, [])

  // Apply filters when filters change
  useEffect(() => {
    applyFilters()
  }, [bikes, filters])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const fetchBikes = async () => {
    try {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBikes(data || [])
    } catch (error) {
      console.error('Error fetching bikes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBikeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('bike_types')
        .select('*')
        .order('sort_order')

      if (error) throw error
      setBikeTypes(data || [])
    } catch (error) {
      console.error('Error fetching bike types:', error)
      // Fallback to name ordering if sort_order doesn't exist
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('bike_types')
          .select('*')
          .order('name')
        
        if (!fallbackError) setBikeTypes(fallbackData || [])
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
      }
    }
  }

  const applyFilters = () => {
    let filtered = bikes

    if (filters.type) {
      filtered = filtered.filter(bike => bike.bike_type === filters.type)
    }

    if (filters.minPrice) {
      filtered = filtered.filter(bike => bike.price >= parseInt(filters.minPrice))
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(bike => bike.price <= parseInt(filters.maxPrice))
    }

    if (filters.location) {
      filtered = filtered.filter(bike => 
        bike.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(bike => 
        bike.title.toLowerCase().includes(searchLower) ||
        bike.description?.toLowerCase().includes(searchLower) ||
        bike.brand?.toLowerCase().includes(searchLower) ||
        bike.bike_type.toLowerCase().includes(searchLower)
      )
    }

    setFilteredBikes(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    
    // Update URL parameters when filters change
    const urlParams = new URLSearchParams(window.location.search)
    if (value) {
      urlParams.set(key === 'type' ? 'type' : key === 'location' ? 'location' : key === 'search' ? 'search' : key, value)
    } else {
      urlParams.delete(key === 'type' ? 'type' : key === 'location' ? 'location' : key === 'search' ? 'search' : key)
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      search: ''
    })
    
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-light text-black">loading bikes...</div>
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
              <Link href="/browse" className="text-black font-medium">browse</Link>
              {user && (
                <Link href="/account" className="text-gray-600 hover:text-black transition-colors">my account</Link>
              )}
              <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                sell
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 sticky top-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-light text-black">filters</h2>
                <button 
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-black text-sm"
                >
                  clear all
                </button>
              </div>

              <div className="space-y-6">
                {/* Bike Type Filter */}
                <div>
                  <label className="block text-sm font-light text-black mb-2">bike type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black"
                  >
                    <option value="">all types</option>
                    {bikeTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filters */}
                <div>
                  <label className="block text-sm font-light text-black mb-2">price range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-600"
                    />
                    <input
                      type="number"
                      placeholder="max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-light text-black mb-2">location</label>
                  <input
                    type="text"
                    placeholder="city, province"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-600"
                  />
                </div>

                {/* Search Filter */}
                <div>
                  <label className="block text-sm font-light text-black mb-2">keyword search</label>
                  <input
                    type="text"
                    placeholder="brand, model, features..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bikes Grid */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-black">
                {filteredBikes.length} bikes found
              </h2>
            </div>

            {filteredBikes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xl font-light text-gray-500 mb-4">no bikes found</div>
                <button 
                  onClick={clearFilters}
                  className="text-black hover:underline"
                >
                  clear filters to see all bikes
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBikes.map((bike) => (
                  <Link key={bike.id} href={`/bike/${bike.id}`} className="block group">
                    <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden hover:shadow-lg hover:border-black transition-all cursor-pointer">
                      {/* Updated Bike Image Section */}
                      <div className="bg-gray-200 h-48 flex items-center justify-center group-hover:bg-gray-300 transition-colors overflow-hidden relative">
                        {bike.images && bike.images.length > 0 ? (
                          <img 
                            src={bike.images[0]} 
                            alt={bike.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentNode.querySelector('.fallback-icon').style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`fallback-icon absolute inset-0 flex items-center justify-center text-4xl ${bike.images && bike.images.length > 0 ? 'hidden' : 'flex'}`}
                        >
                          🚴‍♂️
                        </div>
                        {bike.images && bike.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                            +{bike.images.length - 1}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h3 className="font-light text-lg mb-2 text-black group-hover:text-gray-800 transition-colors line-clamp-2">
                          {bike.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3 font-light">
                          {bike.condition} • {bike.brand && `${bike.brand} • `}{bike.size && `size ${bike.size}`}
                        </p>
                        
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-light text-black">${bike.price.toLocaleString()}</span>
                          <span className="text-gray-400 text-sm">{bike.location}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-black group-hover:bg-gray-200 transition-colors">
                            {bike.bike_type}
                          </span>
                          <span className="text-black group-hover:text-gray-800 text-sm font-light transition-colors">
                            view details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}