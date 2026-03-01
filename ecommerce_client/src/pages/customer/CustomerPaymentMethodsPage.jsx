import { useState, useEffect } from 'react'
import api from '../../config/api'
import { toast } from 'react-toastify'

const CustomerPaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payments/methods')
      setPaymentMethods(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/payments/methods/${id}/default`)
      toast.success('Default payment method updated')
      fetchPaymentMethods()
    } catch (error) {
      toast.error('Failed to update default payment method')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return
    
    try {
      await api.delete(`/payments/methods/${id}`)
      toast.success('Payment method removed')
      fetchPaymentMethods()
    } catch (error) {
      toast.error('Failed to remove payment method')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your credit cards and payment options</p>
        </div>
        <button className="px-6 py-3 bg-amazon-orange text-white rounded hover:bg-yellow-600 transition-colors">
          + Add Payment Method
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
        <strong>🔒 Your payment information is secure</strong><br />
        We use industry-standard encryption to protect your payment details. Your card information is never stored on our servers.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`bg-white border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
              method.isDefault ? 'border-amazon-orange bg-orange-50' : 'border-gray-200'
            }`}
          >
            {method.isDefault && (
              <span className="absolute top-5 right-5 bg-amazon-orange text-white px-3 py-1 rounded-full text-xs font-bold">
                DEFAULT
              </span>
            )}
            
            <div className="flex items-center gap-4 mb-5">
              <div className="text-4xl">💳</div>
              <div className="text-lg font-semibold text-gray-600">{method.brand}</div>
            </div>
            
            <div className="text-xl font-semibold mb-4 tracking-wider">
              •••• •••• •••• {method.last4}
            </div>
            
            <div className="flex justify-between text-gray-600 text-sm mb-5">
              <div>Expires: {method.expMonth}/{method.expYear}</div>
              <div>{method.cardholderName}</div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Edit
              </button>
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Set as Default
                </button>
              )}
              <button
                onClick={() => handleDelete(method.id)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-16 flex flex-col items-center justify-center cursor-pointer hover:border-amazon-orange hover:bg-orange-50 transition-all">
          <div className="text-5xl text-amazon-orange mb-4">+</div>
          <div className="text-lg font-semibold">Add a new payment method</div>
        </div>
      </div>
    </div>
  )
}

export default CustomerPaymentMethodsPage
