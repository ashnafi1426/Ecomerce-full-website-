/**
 * Sellers List Page
 * Shows all available sellers that customers can chat with
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import StartChatButton from '../../components/chat/StartChatButton';

const SellersListPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      // Use public browse endpoint
      const response = await api.get('/sellers/browse');
      setSellers(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sellers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchSellers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Our Sellers
        </h1>
        <p className="text-gray-600">
          Browse our trusted sellers and start a conversation
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search sellers by name or store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Sellers Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredSellers.length} {filteredSellers.length === 1 ? 'seller' : 'sellers'} found
        </p>
      </div>

      {/* Sellers Grid */}
      {filteredSellers.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sellers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'No sellers available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      )}
    </div>
  );
};

// Seller Card Component
const SellerCard = ({ seller }) => {
  const navigate = useNavigate();

  const handleViewProducts = () => {
    navigate(`/seller/${seller.id}/products`);
  };

  const handleViewProfile = () => {
    navigate(`/seller/${seller.id}/profile`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Seller Avatar/Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>
      
      <div className="p-6 -mt-12">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {seller.display_name?.charAt(0) || seller.store_name?.charAt(0) || 'S'}
            </span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {seller.display_name || seller.store_name || 'Seller'}
          </h3>
          {seller.store_name && seller.display_name !== seller.store_name && (
            <p className="text-sm text-gray-600 mb-2">{seller.store_name}</p>
          )}
          
          {/* Rating */}
          {seller.rating && (
            <div className="flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-700">
                {seller.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Products Count */}
          <p className="text-sm text-gray-500">
            {seller.total_products || 0} {seller.total_products === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Chat Button */}
          <StartChatButton
            recipientId={seller.id}
            recipientName={seller.display_name || seller.store_name || 'Seller'}
            recipientRole="seller"
            metadata={{
              type: 'seller_inquiry',
              storeName: seller.store_name
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            Chat with Seller
          </StartChatButton>

          {/* View Products Button */}
          <button
            onClick={handleViewProducts}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            View Products
          </button>

          {/* View Profile Button */}
          <button
            onClick={handleViewProfile}
            className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellersListPage;
