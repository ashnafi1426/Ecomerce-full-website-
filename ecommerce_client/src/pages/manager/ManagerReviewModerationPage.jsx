import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerReviewModerationPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlaggedReviews();
  }, []);

  const fetchFlaggedReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getFlaggedReviews();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching flagged reviews:', err);
      setError(err.message || 'Failed to load flagged reviews');
      toast.error('Failed to load flagged reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await managerAPI.approveReview(reviewId);
      toast.success('Review approved');
      fetchFlaggedReviews();
    } catch (err) {
      console.error('Error approving review:', err);
      toast.error(err.message || 'Failed to approve review');
    }
  };

  const handleRemove = async (reviewId) => {
    const reason = prompt('Please provide a reason for removal:');
    if (!reason) return;

    try {
      await managerAPI.removeReview(reviewId, { reason });
      toast.success('Review removed');
      fetchFlaggedReviews();
    } catch (err) {
      console.error('Error removing review:', err);
      toast.error(err.message || 'Failed to remove review');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading flagged reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">⭐ Review Moderation</h1>
        <p className="text-[#565959]">Review and moderate flagged customer reviews</p>
      </div>

      {error ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Reviews</h2>
          <p className="text-[#565959] mb-6">{error}</p>
          <button
            onClick={fetchFlaggedReviews}
            className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#D5D9D9]">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Clear!</h2>
          <p className="text-[#565959]">No flagged reviews at the moment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-[#D5D9D9] p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[#FF9900] text-lg mb-2">
                    {'⭐'.repeat(review.rating || 1)} {review.rating || 1}/5
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E5] text-[#F08804]">
                    Flagged
                  </span>
                </div>
                <div className="text-right text-sm text-[#565959]">
                  Flagged {review.flagged_at || 'recently'}
                </div>
              </div>

              <div className="mb-4 text-[#0F1111] leading-relaxed">
                "{review.comment || review.review_text || 'No comment provided'}"
              </div>

              <div className="mb-4 text-sm text-[#565959] space-y-1">
                <div><strong>Product:</strong> {review.product_name || 'N/A'}</div>
                <div><strong>Reviewer:</strong> {review.customer_name || 'Anonymous'}</div>
                <div><strong>Reason:</strong> {review.flag_reason || 'Inappropriate content'}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(review.id)}
                  className="bg-[#067D62] text-white px-4 py-2 rounded-lg hover:bg-[#056d54] transition-colors font-medium"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleRemove(review.id)}
                  className="bg-[#C7511F] text-white px-4 py-2 rounded-lg hover:bg-[#b04619] transition-colors font-medium"
                >
                  ✗ Remove
                </button>
                <button className="border border-[#D5D9D9] px-4 py-2 rounded-lg hover:bg-[#F7F8F8] transition-colors font-medium">
                  ✏️ Edit
                </button>
                <button className="border border-[#D5D9D9] px-4 py-2 rounded-lg hover:bg-[#F7F8F8] transition-colors font-medium">
                  💬 Contact Reviewer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ManagerReviewModerationPage;
