'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState(null)
  const [bikeTypes, setBikeTypes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    checkUser()
    fetchBikeTypes()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
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
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedType) params.set('type', selectedType)
    if (selectedPrice) params.set('price', selectedPrice)
    if (location) params.set('location', location)
    
    window.location.href = `/browse?${params.toString()}`
  }

  const priceRanges = [
    'under $500',
    '$500 - $1,000',
    '$1,000 - $2,000',
    '$2,000 - $4,000',
    '$4,000+'
  ]

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

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl font-light text-black mb-16 tracking-tight" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
              your local bike marketplace
            </h2>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white border-2 border-gray-300 rounded-2xl p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="search bikes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-500 font-light text-lg transition-all"
                />
                <input
                  type="text"
                  placeholder="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-500 font-light text-lg transition-all"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black bg-gray-50 text-black font-light text-lg transition-all"
                >
                  <option value="">all bike types</option>
                  {bikeTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black bg-gray-50 text-black font-light text-lg transition-all"
                >
                  <option value="">any price</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white px-8 py-5 rounded-full hover:bg-gray-800 transition-all font-light text-xl shadow-lg hover:shadow-xl"
              >
                search bikes
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Browse by Category - Redesigned */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-light text-black mb-3">browse by category</h3>
          <p className="text-gray-600 font-light text-lg">explore bikes by type</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {bikeTypes.map(type => (
            <Link
              key={type.id}
              href={`/browse?type=${type.name}`}
              className="group bg-white border-2 border-gray-300 rounded-xl p-4 text-center hover:border-black hover:shadow-lg transition-all duration-300"
            >
              <div className="font-light text-base text-black group-hover:text-gray-800 transition-colors">
                {type.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-y border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-light text-black mb-2">local</div>
              <div className="text-gray-600 font-light">buy and sell in your area</div>
            </div>
            <div>
              <div className="text-5xl font-light text-black mb-2">simple</div>
              <div className="text-gray-600 font-light">list your bike in minutes</div>
            </div>
            <div>
              <div className="text-5xl font-light text-black mb-2">trusted</div>
              <div className="text-gray-600 font-light">connect with real riders</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h3 className="text-4xl font-light text-black mb-4">ready to sell?</h3>
            <p className="text-xl text-gray-600 font-light mb-10 max-w-2xl mx-auto">
              list your bike in minutes and reach local buyers looking for their next ride
            </p>
            <Link
              href="/sell"
              className="inline-block bg-black text-white px-10 py-5 rounded-full hover:bg-gray-800 transition-all font-light text-xl shadow-lg hover:shadow-xl"
            >
              create a listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}