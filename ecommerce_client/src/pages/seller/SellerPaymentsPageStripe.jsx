import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../config/api'

const SellerPaymentsPageStripe = () => {
  const [earnings, setEarnings] = useState([])
  const [payouts, setPayouts] = useState([])
  const [stats, setStats] = useState({
    total_earnings: 0,
    available_balance: 0,
    pending_balance: 0,
    paid_balance: 0
  })
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [activeTab, setActiveTab] = useState('earnings')

  useEffect(() => {
    fetchEarnings()
    fetchPayouts()
  }, [])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stripe/seller/earnings')
      
      if (response.success) {
        setStats(response.stats || {})
        setEarnings(response.earnings || [])
      } else {
        toast.error(response.error || 'Failed to fetch earnings')
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
      toast.error('Failed to fetch earnings')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/stripe/seller/payouts')
      
      if (response.success) {
        setPayouts(response.payouts || [])
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
      // Don't show error toast as this might be expected if no payouts exist
    }
  }

  const handleRequestPayout = async () => {
    try {
      const amount = parseFloat(payoutAmount)
      
      if (!amount || amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      
      if (amount > stats.available_balance) {
        toast.error('Amount exceeds available balance')
        return
      }

      const response = await api.post('/stripe/seller/payout/request', {
        amount: amount,
        method: 'stripe_connect'
      })
      
      if (response.success) {
        toast.success('Payout request submitted successfully')
        setShowPayoutModal(false)
        setPayoutAmount('')
        fetchPayouts()
        fetchEarnings()
      } else {
        toast.error(response.error || 'Failed to request payout')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      toast.error('Failed to request payout')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto mb-4"></div>
          <p className="text-[#565959]">Loading earnings data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Header */}
      <div className="bg-white border-b border-[#D5D9D9]">
        <div className="max-w-[1200px] mx-auto px-5 py-6">
          <h1 className="text-3xl font-normal text-[#0F1111]">Payments & Earnings</h1>
          <p className="text-[#565959] mt-2">Track your earnings and manage payouts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Total Earnings</h3>
            <p className="text-2xl font-bold text-[#0F1111]">{formatCurrency(stats.total_earnings)}</p>
            <p className="text-sm text-[#565959] mt-1">All time earnings</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Available Balance</h3>
            <p className="text-2xl font-bold text-[#007600]">{formatCurrency(stats.available_balance)}</p>
            <p className="text-sm text-[#565959] mt-1">Ready for payout</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Pending Balance</h3>
            <p className="text-2xl font-bold text-[#FF9900]">{formatCurrency(stats.pending_balance)}</p>
            <p className="text-sm text-[#565959] mt-1">7-day holding period</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Paid Out</h3>
            <p className="text-2xl font-bold text-[#0F1111]">{formatCurrency(stats.paid_balance)}</p>
            <p className="text-sm text-[#565959] mt-1">Already received</p>
          </div>
        </div>

        {/* Payout Request Button */}
        {stats.available_balance > 0 && (
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#0F1111]">Request Payout</h3>
                <p className="text-[#565959]">You have {formatCurrency(stats.available_balance)} available for payout</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-[#FF9900] hover:bg-[#F08804] text-white px-6 py-3 rounded font-semibold"
              >
                Request Payout
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border border-[#D5D9D9] rounded-lg">
          <div className="border-b border-[#D5D9D9]">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('earnings')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 ${
                  activeTab === 'earnings'
                    ? 'border-[#FF9900] text-[#FF9900]'
                    : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                }`}
              >
                Earnings ({earnings.length})
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 ${
                  activeTab === 'payouts'
                    ? 'border-[#FF9900] text-[#FF9900]'
                    : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                }`}
              >
                Payouts ({payouts.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'earnings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#0F1111]">Earnings History</h2>
                  <button
                    onClick={fetchEarnings}
                    className="bg-[#FF9900] hover:bg-[#F08804] text-white px-4 py-2 rounded font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {earnings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#565959] text-lg">No earnings yet</p>
                    <p className="text-[#565959] text-sm mt-2">Earnings will appear here when customers purchase your products</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D5D9D9]">
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Order ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Gross Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Commission</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Net Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Available Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((earning) => (
                          <tr key={earning.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{earning.order_id?.slice(0, 8)}...</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">{formatCurrency((earning.gross_amount || 0) / 100)}</span>
                            </td>
                            <td className="py-3 px-4 text-[#B12704]">
                              -{formatCurrency((earning.commission_amount || 0) / 100)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#007600]">{formatCurrency((earning.net_amount || 0) / 100)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(earning.status)}`}>
                                {earning.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#565959]">
                              {earning.available_date ? formatDate(earning.available_date) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#0F1111]">Payout History</h2>
                  <button
                    onClick={fetchPayouts}
                    className="bg-[#FF9900] hover:bg-[#F08804] text-white px-4 py-2 rounded font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#565959] text-lg">No payouts yet</p>
                    <p className="text-[#565959] text-sm mt-2">Your payout requests will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D5D9D9]">
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Payout ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Method</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Requested</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout) => (
                          <tr key={payout.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{payout.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">{formatCurrency((payout.amount || 0) / 100)}</span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {payout.method || 'stripe_connect'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPayoutStatusColor(payout.status)}`}>
                                {payout.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#565959]">
                              {formatDate(payout.requested_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#565959]">
                              {payout.completed_at ? formatDate(payout.completed_at) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-[#0F1111] mb-4">Request Payout</h3>
            
            <div className="mb-4">
              <p className="text-sm text-[#565959] mb-2">Available Balance: {formatCurrency(stats.available_balance)}</p>
              <label className="block text-sm font-semibold text-[#0F1111] mb-2">
                Payout Amount
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                max={stats.available_balance}
                step="0.01"
                className="w-full border border-[#D5D9D9] rounded px-3 py-2 focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#0F1111] mb-2">
                Payout Method
              </label>
              <select className="w-full border border-[#D5D9D9] rounded px-3 py-2 focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] outline-none">
                <option value="stripe_connect">Stripe Connect</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 border border-[#D5D9D9] py-2 rounded font-semibold hover:bg-[#F7F8F8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="flex-1 bg-[#FF9900] hover:bg-[#F08804] text-white py-2 rounded font-semibold transition-colors"
              >
                Request Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerPaymentsPageStripe