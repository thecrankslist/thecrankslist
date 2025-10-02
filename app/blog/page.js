'use client'

import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-100 border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-light text-black" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>crankslist</h1>
            <nav className="flex items-center space-x-8">
              <Link href="/browse" className="text-gray-700 hover:text-black transition-colors">browse</Link>
              <Link href="/blog" className="text-gray-900 font-medium">blog</Link>
              <Link href="/login" className="text-gray-700 hover:text-black transition-colors">sign in</Link>
              <Link href="/sell" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">sell</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-light text-black mb-8 text-center">crankslist blog</h2>
        <p className="text-lg text-gray-700 font-light mb-12 text-center">
          Updates, tips, and stories from the cycling community.
        </p>

        {/* Example blog posts (replace later with dynamic content) */}
        <div className="space-y-8">
          <article className="border-b border-gray-300 pb-6">
            <h3 className="text-2xl font-light text-black mb-2">How to Choose the Right Bike</h3>
            <p className="text-gray-700 font-light mb-4">Finding the perfect ride depends on where you’ll ride, your budget, and personal preferences...</p>
            <Link href="#" className="text-black hover:underline">Read more →</Link>
          </article>

          <article className="border-b border-gray-300 pb-6">
            <h3 className="text-2xl font-light text-black mb-2">Top 5 Mountain Biking Trails in BC</h3>
            <p className="text-gray-700 font-light mb-4">British Columbia is home to some of the best trails in the world. Here are our top picks...</p>
            <Link href="#" className="text-black hover:underline">Read more →</Link>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 font-light">© 2025 crankslist</p>
        </div>
      </footer>
    </div>
  )
}