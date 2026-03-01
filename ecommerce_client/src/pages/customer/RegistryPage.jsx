import { Link } from 'react-router-dom'

const RegistryPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎁 Gift Registry</h1>
          <p className="text-gray-600">Create and manage your gift registries</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">💍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wedding Registry</h2>
            <p className="text-gray-600 mb-6">Create a registry for your special day</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create Wedding Registry
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Baby Registry</h2>
            <p className="text-gray-600 mb-6">Prepare for your new arrival</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create Baby Registry
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎂</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Birthday Registry</h2>
            <p className="text-gray-600 mb-6">Share your birthday wishlist</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create Birthday Registry
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find a Registry</h2>
            <p className="text-gray-600 mb-6">Search for someone's registry</p>
            <Link
              to="/registry/search"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
            >
              Search Registries
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Registry feature coming soon! This page is under development.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegistryPage
