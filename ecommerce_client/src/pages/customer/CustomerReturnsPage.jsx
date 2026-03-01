import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { customerAPI } from '../../services/api.service'

const CustomerReturnsPage = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getReturns()
      console.log('Returns response:', response)
      
      // The interceptor already returns response.data, so response IS the data
      // Handle different possible formats
      let returnsData = []
      
      if (Array.isArray(response)) {
        // Direct array
        returnsData = response
      } else if (response?.returns) {
        // { returns: [...] }
        returnsData = response.returns
      } else if (response?.data?.returns) {
        // { data: { returns: [...] } }
        returnsData = response.data.returns
      } else if (response?.data && Array.isArray(response.data)) {
        // { data: [...] }
        returnsData = response.data
      }
      
      setReturns(returnsData)
    } catch (error) {
      console.error('Failed to load returns:', error)
      toast.error(error.message || 'Failed to load returns')
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      refunded: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Returns & Refunds</h1>
      <p className="text-gray-600 mb-8">Track your return requests and refund status</p>

      <div className="space-y-6">
        {returns.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No returns yet</h3>
            <p className="text-gray-600">You haven't requested any returns</p>
          </div>
        ) : (
          returns.map((returnItem) => (
            <div key={returnItem.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-gray-100">
                <div>
                  <div className="text-sm text-gray-600">Return ID: #{returnItem.id}</div>
                  <div className="text-sm text-gray-600">
                    Requested on {new Date(returnItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${getStatusBadge(returnItem.status)}`}>
                  {returnItem.status.toUpperCase()}
                </span>
              </div>

              <div className="flex gap-4 mb-5">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-5xl">
                  {returnItem.product?.emoji || '📦'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{returnItem.product?.name || 'Product'}</h3>
                  <div className="text-sm text-gray-600">Order #{returnItem.orderId}</div>
                  <div className="text-sm text-gray-600">
                    Quantity: {returnItem.quantity} | Price: ${returnItem.amount?.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="font-semibold mb-1">Reason for Return:</div>
                <div className="text-gray-700">{returnItem.reason}</div>
              </div>

              <div className="mb-4 text-sm">
                <div><strong>Refund Status:</strong> {returnItem.refundStatus || 'Processing'}</div>
                <div><strong>Refund Amount:</strong> ${returnItem.amount?.toFixed(2)}</div>
                <div><strong>Refund Method:</strong> {returnItem.refundMethod || 'Original payment method'}</div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-2 bg-[#FF9900] text-white rounded hover:bg-[#F08804] transition-colors">
                  Track Return
                </button>
                <button className="px-6 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerReturnsPage
