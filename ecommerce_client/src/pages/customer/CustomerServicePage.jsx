import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'
import axios from 'axios'
import toast from 'react-hot-toast'

const CustomerServicePage = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('faq')
  const [contactForm, setContactForm] = useState({
    name: user?.display_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/support/contact`, contactForm)
      toast.success('Your message has been sent! We\'ll get back to you soon.')
      setContactForm({ ...contactForm, subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by going to "Your Orders" in your account and clicking on the order you want to track. You\'ll see real-time updates on your shipment status.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be in original condition with tags attached. Visit our Returns page to initiate a return.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days. Prime members get free 2-day shipping on eligible items.'
    },
    {
      question: 'How do I cancel my order?',
      answer: 'You can cancel your order within 1 hour of placing it by going to "Your Orders" and clicking "Cancel Order". After that, please contact customer service.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. All payments are processed securely through Stripe.'
    },
    {
      question: 'How do I become a seller?',
      answer: 'Click on "Sell on FastShop" in the navigation menu to register as a seller. You\'ll need to provide business information and complete verification.'
    }
  ]

  const quickLinks = [
    { title: 'Track Your Order', icon: '📦', link: '/orders' },
    { title: 'Returns & Refunds', icon: '↩️', link: '/returns' },
    { title: 'Your Account', icon: '👤', link: '/account' },
    { title: 'Payment Methods', icon: '💳', link: '/account/payment-methods' },
    { title: 'Shipping Info', icon: '🚚', link: '/shipping-info' },
    { title: 'Seller Support', icon: '🏪', link: '/seller' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💬 Customer Service</h1>
          <p className="text-gray-600">How can we help you today?</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {quickLinks.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex flex-col items-center text-center no-underline group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                {item.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'faq'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 FAQs
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'contact'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✉️ Contact Us
              </button>
              <button
                onClick={() => setActiveTab('live-chat')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'live-chat'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                💬 Live Chat
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                {faqs.map((faq, index) => (
                  <details key={index} className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer hover:text-orange-600">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-gray-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}

            {/* Live Chat Tab */}
            {activeTab === 'live-chat' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Chat Support</h2>
                <p className="text-gray-600 mb-6">
                  Chat with our support team in real-time
                </p>
                {isAuthenticated ? (
                  <Link
                    to="/chat"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
                  >
                    Start Chat
                  </Link>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-4">Please sign in to use live chat</p>
                    <Link
                      to="/login"
                      className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 text-sm">support@fastshop.com</p>
            <p className="text-gray-500 text-xs mt-2">Response within 24 hours</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3">📞</div>
            <h3 className="font-bold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-600 text-sm">1-800-FASTSHOP</p>
            <p className="text-gray-500 text-xs mt-2">Mon-Fri 9AM-6PM EST</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-600 text-sm">Available 24/7</p>
            <p className="text-gray-500 text-xs mt-2">Instant responses</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerServicePage
