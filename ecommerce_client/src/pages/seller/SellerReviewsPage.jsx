import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';

const SellerReviewsPage = () => {
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    positiveReviews: 0,
    pendingResponse: 0
  });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getReviews();
      const data = response.data || response;
      
      setStats(data.stats || {});
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyToReview = async (reviewId) => {
    const reply = prompt('Enter your reply:');
    if (!reply) return;
    
    try {
      await sellerAPI.replyToReview(reviewId, reply);
      toast.success('Reply posted successfully');
      fetchReviews();
    } catch (err) {
      console.error('Error replying to review:', err);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load reviews</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchReviews} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Customer Reviews</h1>
      <p style={styles.subtitle}>Monitor and respond to customer feedback</p>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.averageRating}</div>
          <div style={styles.statLabel}>Average Rating</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalReviews.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Reviews</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.positiveReviews}%</div>
          <div style={styles.statLabel}>Positive Reviews</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pendingResponse}</div>
          <div style={styles.statLabel}>Pending Response</div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Reviews</h2>

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id || review._id} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div>
                  <div style={styles.stars}>{renderStars(review.rating)}</div>
                  <div style={{ fontWeight: 'bold', marginTop: '5px' }}>{review.product || review.productName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{review.customer || review.customerName}</div>
                  <div style={{ fontSize: '0.85em', color: '#565959' }}>{review.date || new Date(review.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={styles.reviewText}>{review.text || review.comment}</div>
              <div style={styles.reviewFooter}>
                <div>{review.verified && 'Verified Purchase'}</div>
                <button
                  onClick={() => handleReplyToReview(review.id || review._id)}
                  style={styles.btnSm}
                >
                  Reply to Review
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#565959' }}>
            No reviews yet
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  },
  spinner: {
    fontSize: '1.2em',
    color: '#565959'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: '40px'
  },
  retryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  title: {
    fontSize: '2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '2.5em',
    fontWeight: 'bold',
    color: '#FF9900'
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#565959',
    marginTop: '8px'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#0F1111'
  },
  reviewCard: {
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  stars: {
    color: '#FFA41C',
    fontSize: '1.2em'
  },
  reviewText: {
    lineHeight: 1.6,
    marginBottom: '15px',
    color: '#0F1111'
  },
  reviewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85em',
    color: '#565959'
  },
  btnSm: {
    padding: '6px 12px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#0F1111'
  }
};

export default SellerReviewsPage;
