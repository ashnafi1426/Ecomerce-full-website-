import { Link } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'

const PrimePage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  const benefits = [
    {
      icon: '🚚',
      title: 'FREE 2-Day Shipping',
      description: 'Unlimited free two-day shipping on millions of items'
    },
    {
      icon: '📺',
      title: 'Prime Video',
      description: 'Stream thousands of movies and TV shows'
    },
    {
      icon: '🎵',
      title: 'Prime Music',
      description: 'Ad-free music streaming with millions of songs'
    },
    {
      icon: '📚',
      title: 'Prime Reading',
      description: 'Access to thousands of books and magazines'
    },
    {
      icon: '🎮',
      title: 'Prime Gaming',
      description: 'Free games and in-game content every month'
    },
    {
      icon: '💰',
      title: 'Exclusive Deals',
      description: 'Early access to Lightning Deals and special offers'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-5xl font-bold mb-4">FastShop Prime</h1>
          <p className="text-xl mb-8">All the benefits you love, and more</p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-4xl font-bold">$12.99</div>
            <div className="text-lg">/month</div>
          </div>
          {isAuthenticated ? (
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors">
              Start Your 30-Day Free Trial
            </button>
          ) : (
            <Link
              to="/register"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors no-underline"
            >
              Sign Up for Prime
            </Link>
          )}
          <p className="text-sm mt-4 opacity-90">Cancel anytime. Terms apply.</p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Prime Benefits
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Choose Your Plan
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Monthly</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold">$12.99</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">All Prime benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Cancel anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">30-day free trial</span>
                </li>
              </ul>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                Start Free Trial
              </button>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-orange-500 relative">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-bold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Annual</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold">$139</span>
                <span className="text-gray-600 ml-2">/year</span>
              </div>
              <p className="text-sm text-green-600 font-medium mb-6">Save $16.88 per year</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">All Prime benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Best value</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">30-day free trial</span>
                </li>
              </ul>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <details className="bg-white rounded-lg shadow p-6">
            <summary className="font-bold text-gray-900 cursor-pointer">
              What is FastShop Prime?
            </summary>
            <p className="mt-4 text-gray-600">
              FastShop Prime is a membership program that gives you access to free two-day shipping, streaming services, exclusive deals, and more.
            </p>
          </details>

          <details className="bg-white rounded-lg shadow p-6">
            <summary className="font-bold text-gray-900 cursor-pointer">
              How much does Prime cost?
            </summary>
            <p className="mt-4 text-gray-600">
              Prime costs $12.99/month or $139/year. New members get a 30-day free trial.
            </p>
          </details>

          <details className="bg-white rounded-lg shadow p-6">
            <summary className="font-bold text-gray-900 cursor-pointer">
              Can I cancel anytime?
            </summary>
            <p className="mt-4 text-gray-600">
              Yes! You can cancel your Prime membership at any time. If you cancel during the free trial, you won't be charged.
            </p>
          </details>

          <details className="bg-white rounded-lg shadow p-6">
            <summary className="font-bold text-gray-900 cursor-pointer">
              What's included in the free trial?
            </summary>
            <p className="mt-4 text-gray-600">
              The free trial includes all Prime benefits: free shipping, Prime Video, Prime Music, and more.
            </p>
          </details>
        </div>
      </div>

      <div className="text-center pb-16">
        <p className="text-gray-500 text-sm">
          Prime membership feature coming soon! This page is under development.
        </p>
      </div>
    </div>
  )
}

export default PrimePage
