'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function SellPage() {
  const [user, setUser] = useState(null)
  const [approvalStatus, setApprovalStatus] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [bikeTypes, setBikeTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bike_type: '',
    condition: '',
    location: '',
    latitude: null,
    longitude: null,
    brand: '',
    size: '',
    year: '',
    currency: 'USD'
  })

  useEffect(() => {
    checkUserApproval()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          checkApproval(session.user.id)
        }
      }
    )
    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && approvalStatus === 'approved') {
      fetchBikeTypes()
    }
  }, [user, approvalStatus])

  const checkUserApproval = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setAuthLoading(false)
        return
      }

      setUser(user)
      await checkApproval(user.id)
    } catch (error) {
      console.error('Error checking approval:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const checkApproval = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('approval_status')
        .eq('user_id', userId)
        .single()

      setApprovalStatus(profile?.approval_status || 'pending')
    } catch (error) {
      console.error('Error checking approval:', error)
      setApprovalStatus('pending')
    }
  }

  const fetchBikeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('bike_types')
        .select('*')
        .order('name')

      if (error) throw error
      setBikeTypes(data || [])
    } catch (error) {
      console.error('Error fetching bike types:', error)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }

    setSelectedImages(files)
    const previews = files.map(file => URL.createObjectURL(file))
    setImagePreview(previews)
  }

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreview.filter((_, i) => i !== index)
    
    setSelectedImages(newImages)
    setImagePreview(newPreviews)
  }

  const uploadImages = async () => {
    if (selectedImages.length === 0) return []

    const imageUrls = []

    for (let i = 0; i < selectedImages.length; i++) {
      const file = selectedImages[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`

      try {
        const { data, error } = await supabase.storage
          .from('bike-images')
          .upload(fileName, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('bike-images')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      } catch (error) {
        console.error('Error uploading image:', error)
        throw error
      }
    }

    return imageUrls
  }

  const handleUseMyLocation = async () => {
    setLocationLoading(true)
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      })

      const { latitude, longitude } = position.coords

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      
      if (!response.ok) throw new Error('Failed to get location name')
      
      const data = await response.json()
      const city = data.city || data.locality || data.principalSubdivision
      const region = data.principalSubdivisionCode || data.principalSubdivision
      const locationString = `${city}, ${region}`

      setFormData(prev => ({
        ...prev,
        location: locationString,
        latitude,
        longitude
      }))

    } catch (error) {
      console.error('Error getting location:', error)
      alert('Unable to get your location. Please enter it manually or check your browser permissions.')
    } finally {
      setLocationLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const imageUrls = await uploadImages()

      const { data, error } = await supabase
        .from('bikes')
        .insert([{
          title: formData.title,
          description: formData.description,
          price: parseInt(formData.price),
          bike_type: formData.bike_type,
          condition: formData.condition,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          brand: formData.brand || null,
          size: formData.size || null,
          year: formData.year ? parseInt(formData.year) : null,
          user_id: user.id,
          seller_email: user.email,
          images: imageUrls
        }])
        .select()

      if (error) throw error

      setSuccess(true)
      setFormData({
        title: '',
        description: '',
        price: '',
        bike_type: '',
        condition: '',
        location: '',
        latitude: null,
        longitude: null,
        brand: '',
        size: '',
        year: '',
        currency: 'USD'
      })
      setSelectedImages([])
      setImagePreview([])
    } catch (error) {
      console.error('Error creating listing:', error.message || error)
      alert(error.message || 'Error creating listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-light text-black">loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-3xl font-light text-black">crankslist</h1>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/browse" className="text-gray-600 hover:text-black">browse</Link>
                <Link href="/auth/signin" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800">sign in</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-12">
            <h2 className="text-3xl font-light text-black mb-4">sign in required</h2>
            <p className="text-gray-500 mb-8 font-light">you need to be signed in to create a listing</p>
            <Link href="/auth/signin" className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-light inline-block">
              sign in to continue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-3xl font-light text-black">crankslist</h1>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/browse" className="text-gray-600 hover:text-black">browse</Link>
                <Link href="/account" className="text-gray-600 hover:text-black">my account</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-12">
            <h2 className="text-4xl font-light text-black mb-4">account pending approval</h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              your account is currently being reviewed by our team. you'll be able to create listings once your account is approved.
            </p>
            <p className="text-gray-600 text-sm">
              this usually takes 24-48 hours. we'll notify you via email once approved.
            </p>
            <div className="mt-8">
              <Link
                href="/browse"
                className="inline-block text-black underline hover:no-underline"
              >
                browse bikes while you wait
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-3xl font-light text-black">crankslist</h1>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/browse" className="text-gray-600 hover:text-black">browse</Link>
                <Link href="/account" className="text-gray-600 hover:text-black">my account</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12">
            <h2 className="text-4xl font-light text-black mb-4">account not approved</h2>
            <p className="text-gray-700 mb-6 text-lg">
              unfortunately, your account was not approved for posting listings.
            </p>
            <p className="text-gray-600 text-sm mb-8">
              if you believe this was a mistake, please contact us at{' '}
              <a href="mailto:thecrankslist@gmail.com" className="text-black underline">
                thecrankslist@gmail.com
              </a>
            </p>
            <Link
              href="/browse"
              className="inline-block text-black underline hover:no-underline"
            >
              browse bikes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center">
                <h1 className="text-3xl font-light text-black">crankslist</h1>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/browse" className="text-gray-600 hover:text-black">browse</Link>
                <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800">sell</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-12">
            <h2 className="text-3xl font-light text-black mb-4">listing created!</h2>
            <p className="text-gray-500 mb-8 font-light">your bike is now live on crankslist</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse" className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-light">view all listings</Link>
              <button onClick={() => setSuccess(false)} className="border border-gray-300 text-black px-8 py-3 rounded-lg hover:bg-gray-50 font-light">
                list another bike
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <h1 className="text-3xl font-light text-black">crankslist</h1>
            </Link>
            <nav className="flex items-center space-x-8">
              <Link href="/browse" className="text-gray-600 hover:text-black">browse</Link>
              <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800">sell</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-light text-black mb-4">sell your bike</h2>
          <p className="text-lg text-gray-500 font-light">create a listing in minutes</p>
          <p className="text-sm text-gray-400 font-light mt-2">signed in as {user.email}</p>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-light text-black mb-2">listing title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. 2022 Trek Mountain Bike - Excellent Condition"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-black mb-2">description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell buyers about your bike's condition, features, and history..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="1200"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="w-full md:w-36">
                  <label className="block text-sm font-light text-black mb-2 invisible">currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black focus:outline-none focus:border-black"
                  >
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">bike type *</label>
                  <select
                    name="bike_type"
                    value={formData.bike_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black focus:outline-none focus:border-black"
                  >
                    <option value="">select type</option>
                    {bikeTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black focus:outline-none focus:border-black"
                  >
                    <option value="">select condition</option>
                    <option value="excellent">excellent</option>
                    <option value="good">good</option>
                    <option value="fair">fair</option>
                    <option value="needs work">needs work</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Trek, Specialized, etc."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">size</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="Small, Medium, Large, 54cm, etc."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="2022"
                    min="1900"
                    max="2025"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-light text-black mb-2">location *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Vancouver, BC"
                      required
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black placeholder-gray-600 focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locationLoading}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black hover:bg-gray-100 text-sm font-light disabled:opacity-50 transition-colors"
                    >
                      {locationLoading ? '...' : '📍'}
                    </button>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      location coordinates saved for better search results
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-black mb-2">bike photos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-black focus:outline-none focus:border-black"
              />
              <p className="text-xs text-gray-500 mt-1">Upload up to 5 photos (JPG, PNG, etc.)</p>
              
              {imagePreview.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 font-light text-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'creating listing...' : 'create listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}