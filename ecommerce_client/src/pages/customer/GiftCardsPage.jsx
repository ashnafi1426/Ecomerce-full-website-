import { useState } from 'react'
import toast from 'react-hot-toast'

const GiftCardsPage = () => {
  const [amount, setAmount] = useState(50)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')

  const predefinedAmounts = [25, 50, 100, 200, 500]

  const handlePurchase = (e) => {
    e.preventDefault()
    toast.success('Gift card feature coming soon!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💳 Gift Cards</h1>
          <p className="text-gray-600">Give the gift of choice</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Purchase Gift Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Gift Card</h2>
            
            <form onSubmit={handlePurchase} className="space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {predefinedAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                        amount === amt
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Custom amount"
                />
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Add a personal message..."
                />
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-orange-600">${amount}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Purchase Gift Card
              </button>
            </form>
          </div>

          {/* Gift Card Preview */}
          <div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-2xl p-8 text-white mb-6">
              <div className="text-2xl font-bold mb-4">🛒 FastShop</div>
              <div className="text-4xl font-bold mb-2">${amount}</div>
              <div className="text-sm opacity-90">Gift Card</div>
              <div className="mt-8 text-xs opacity-75">
                Valid for all products on FastShop
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Gift Card Features</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>No expiration date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Can be used for any product</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Instant email delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Reloadable balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Check balance anytime</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Gift card feature coming soon! This page is under development.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GiftCardsPage
