import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../config/api'

const AdminPaymentsPageStripe = () => {
  const [payments, setPayments] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0,
    pendingPayouts: 0
  })
  const [activeTab, setActiveTab] = useState('payments')

  useEffect(() => {
    fetchPayments()
    fetchPayouts()
    fetchStats()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await api.get('/stripe/admin/payments')
      if (response.success) {
        setPayments(response.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    }
  }

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/stripe/admin/payouts')
      if (response.success) {
        setPayouts(response.payouts || [])
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
      // Don't show error for payouts as endpoint might not exist yet
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Calculate stats from payments
      const paymentsResponse = await api.get('/stripe/admin/payments')
      if (paymentsResponse.success) {
        const allPayments = paymentsResponse.payments || []
        
        const totalRevenue = allPayments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + (p.amount || 0), 0)
        
        const totalCommission = totalRevenue * 0.15 // 15% commission
        
        setStats({
          totalRevenue: totalRevenue / 100, // Convert from cents
          totalCommission: totalCommission / 100,
          totalPayouts: 0, // Will be calculated from actual payouts
          pendingPayouts: 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayout = async (payoutId) => {
    try {
      const response = await api.post(`/stripe/admin/payout/${payoutId}/approve`)
      if (response.success) {
        toast.success('Payout approved successfully')
        fetchPayouts()
      } else {
        toast.error(response.error || 'Failed to approve payout')
      }
    } catch (error) {
      toast.error('Failed to approve payout')
      console.error('Error approving payout:', error)
    }
  }

  const handleProcessRefund = async (paymentId, amount) => {
    try {
      const response = await api.post(`/stripe/refund/${paymentId}`, {
        amount: amount,
        reason: 'requested_by_customer'
      })
      
      if (response.success) {
        toast.success('Refund processed successfully')
        fetchPayments()
      } else {
        toast.error(response.error || 'Failed to process refund')
      }
    } catch (error) {
      toast.error('Failed to process refund')
      console.error('Error processing refund:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto mb-4"></div>
          <p className="text-[#565959]">Loading payment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Header */}
      <div className="bg-white border-b border-[#D5D9D9]">
        <div className="max-w-[1200px] mx-auto px-5 py-6">
          <h1 className="text-3xl font-normal text-[#0F1111]">Payment Management</h1>
          <p className="text-[#565959] mt-2">Manage Stripe payments, commissions, and seller payouts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold text-[#0F1111]">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-[#007600] mt-1">All successful payments</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Commission Earned</h3>
            <p className="text-2xl font-bold text-[#FF9900]">{formatCurrency(stats.totalCommission)}</p>
            <p className="text-sm text-[#565959] mt-1">15% of all sales</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Seller Payouts</h3>
            <p className="text-2xl font-bold text-[#0F1111]">{formatCurrency(stats.totalPayouts)}</p>
            <p className="text-sm text-[#565959] mt-1">Total paid to sellers</p>
          </div>
          
          <div className="bg-white border border-[#D5D9D9] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#565959] mb-2">Pending Payouts</h3>
            <p className="text-2xl font-bold text-[#B12704]">{formatCurrency(stats.pendingPayouts)}</p>
            <p className="text-sm text-[#565959] mt-1">Awaiting approval</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-[#D5D9D9] rounded-lg">
          <div className="border-b border-[#D5D9D9]">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-[#FF9900] text-[#FF9900]'
                    : 'border-transparent text-[#565959] hover:text-[#0F1111]'
                }`}
              >
                Payments ({payments.length})
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
            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#0F1111]">Recent Payments</h2>
                  <button
                    onClick={fetchPayments}
                    className="bg-[#FF9900] hover:bg-[#F08804] text-white px-4 py-2 rounded font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#565959] text-lg">No payments found</p>
                    <p className="text-[#565959] text-sm mt-2">Payments will appear here once customers make purchases</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D5D9D9]">
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Payment ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Customer</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{payment.stripe_payment_intent_id || payment.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">{formatCurrency((payment.amount || 0) / 100)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                payment.status === 'succeeded' 
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#565959]">
                              {formatDate(payment.created_at)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {payment.user_id ? `User ${payment.user_id.slice(0, 8)}...` : 'Guest'}
                            </td>
                            <td className="py-3 px-4">
                              {payment.status === 'succeeded' && (
                                <button
                                  onClick={() => handleProcessRefund(payment.id, (payment.amount || 0) / 100)}
                                  className="text-[#B12704] hover:underline text-sm"
                                >
                                  Refund
                                </button>
                              )}
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
                  <h2 className="text-xl font-bold text-[#0F1111]">Seller Payouts</h2>
                  <button
                    onClick={fetchPayouts}
                    className="bg-[#FF9900] hover:bg-[#F08804] text-white px-4 py-2 rounded font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#565959] text-lg">No payout requests found</p>
                    <p className="text-[#565959] text-sm mt-2">Seller payout requests will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D5D9D9]">
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Payout ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Seller</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Requested</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#0F1111]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout) => (
                          <tr key={payout.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{payout.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{payout.seller_id?.slice(0, 8)}...</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">{formatCurrency((payout.amount || 0) / 100)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                payout.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : payout.status === 'pending_approval'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {payout.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#565959]">
                              {formatDate(payout.requested_at)}
                            </td>
                            <td className="py-3 px-4">
                              {payout.status === 'pending_approval' && (
                                <button
                                  onClick={() => handleApprovePayout(payout.id)}
                                  className="bg-[#007600] hover:bg-[#005A00] text-white px-3 py-1 rounded text-sm"
                                >
                                  Approve
                                </button>
                              )}
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
    </div>
  )
}

export default AdminPaymentsPageStripe