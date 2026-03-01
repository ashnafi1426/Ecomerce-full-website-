import { useState, useEffect } from 'react'
import api from '../../config/api'
import { toast } from 'react-toastify'

const CustomerAddressesPage = () => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses')
      setAddresses(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`)
      toast.success('Default address updated')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to update default address')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return
    
    try {
      await api.delete(`/addresses/${id}`)
      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Addresses</h1>
          <p className="text-gray-600">Manage your shipping and billing addresses</p>
        </div>
        <button className="px-6 py-3 bg-amazon-orange text-white rounded hover:bg-yellow-600 transition-colors">
          + Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`bg-white border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
              address.isDefault ? 'border-amazon-orange bg-orange-50' : 'border-gray-200'
            }`}
          >
            {address.isDefault && (
              <span className="absolute top-4 right-4 bg-amazon-orange text-white px-3 py-1 rounded-full text-xs font-bold">
                DEFAULT
              </span>
            )}
            
            <div className="text-lg font-semibold mb-3">{address.fullName}</div>
            <div className="text-gray-600 leading-relaxed mb-3">
              {address.addressLine1}<br />
              {address.addressLine2 && <>{address.addressLine2}<br /></>}
              {address.city}, {address.state} {address.postalCode}<br />
              {address.country}
            </div>
            <div className="font-medium mb-4">Phone: {address.phone}</div>
            
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Edit
              </button>
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Set as Default
                </button>
              )}
              <button
                onClick={() => handleDelete(address.id)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-16 flex flex-col items-center justify-center cursor-pointer hover:border-amazon-orange hover:bg-orange-50 transition-all">
          <div className="text-5xl text-amazon-orange mb-4">+</div>
          <div className="text-lg font-semibold">Add a new address</div>
        </div>
      </div>
    </div>
  )
}

export default CustomerAddressesPage
