import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerCustomerFeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerFeedback();
  }, []);

  const fetchCustomerFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getCustomerFeedback();
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error('Error fetching customer feedback:', err);
      setError(err.message || 'Failed to load customer feedback');
      toast.error('Failed to load customer feedback');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-[#067D62]';
    if (rating >= 3) return 'text-[#FF9900]';
    return 'text-[#C7511F]';
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading customer feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">💬 Customer Feedback</h1>
        <p className="text-[#565959]">View and analyze customer feedback</p>
      </div>

      {error ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Feedback</h2>
          <p className="text-[#565959] mb-6">{error}</p>
          <button
            onClick={fetchCustomerFeedback}
            className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]"
          >
            Try Again
          </button>
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#D5D9D9]">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-[#0F1111] mb-2">No Feedback Yet</h2>
          <p className="text-[#565959]">No customer feedback available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-[#D5D9D9] p-6">
              <div className={`text-xl mb-3 ${getRatingColor(item.rating)}`}>
                {'⭐'.repeat(item.rating || 5)} {item.rating || 5}/5
              </div>

              <div className="text-[#565959] leading-relaxed mb-4">
                "{item.comment || item.feedback_text || 'Great experience!'}"
              </div>

              <div className="text-sm text-[#565959] space-y-1 mb-4">
                <div className="font-semibold text-[#0F1111]">{item.customer_name || 'Anonymous Customer'}</div>
                <div>Order #{item.order_id || 'N/A'} • {item.created_at || 'Recently'}</div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 border border-[#D5D9D9] px-3 py-2 rounded text-sm hover:bg-[#F7F8F8] transition-colors">
                  View Order
                </button>
                {item.rating < 3 && (
                  <button className="flex-1 bg-[#FF9900] text-white px-3 py-2 rounded text-sm hover:bg-[#F08804] transition-colors">
                    Follow Up
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ManagerCustomerFeedbackPage;
