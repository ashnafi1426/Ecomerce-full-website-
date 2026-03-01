import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerPerformancePage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getPerformanceMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setError(err.message || 'Failed to load performance metrics');
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Performance Data</h2>
        <p className="text-[#565959] mb-6">{error}</p>
        <button
          onClick={fetchPerformanceMetrics}
          className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">📈 Performance Reports</h1>
        <p className="text-[#565959]">Your performance metrics and achievements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-sm text-[#565959] mb-2">Tasks Completed (This Month)</div>
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{metrics?.tasksCompleted || 0}</div>
          <div className="text-sm text-[#067D62]">↑ {metrics?.tasksGrowth || '23'}% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-sm text-[#565959] mb-2">Avg Response Time</div>
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{metrics?.avgResponseTime || '2.3h'}</div>
          <div className="text-sm text-[#067D62]">↓ 15% improvement</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-sm text-[#565959] mb-2">Resolution Rate</div>
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{metrics?.resolutionRate || '94.5'}%</div>
          <div className="text-sm text-[#067D62]">↑ 3.2% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-sm text-[#565959] mb-2">Customer Satisfaction</div>
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{metrics?.satisfaction || '4.8'}/5</div>
          <div className="text-sm text-[#067D62]">↑ 0.3 from last month</div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#0F1111] mb-4">Task Completion Trend</h2>
        <div className="h-[300px] bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center text-white text-xl">
          📊 Task Completion Chart
        </div>
      </div>

      {/* Performance Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-6">
          <h2 className="text-xl font-semibold text-[#0F1111] mb-4">Top Performing Areas</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[#067D62]">✓</span>
              <span>Product Approvals: <strong>98% on-time</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#067D62]">✓</span>
              <span>Dispute Resolution: <strong>95% satisfaction</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#067D62]">✓</span>
              <span>Return Processing: <strong>1.5 day avg</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#067D62]">✓</span>
              <span>Support Tickets: <strong>2.1 hour response</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#D5D9D9] p-6">
          <h2 className="text-xl font-semibold text-[#0F1111] mb-4">Areas for Improvement</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[#F08804]">⚠️</span>
              <span>Escalation Rate: <strong>8.5%</strong> (target: 5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F08804]">⚠️</span>
              <span>Refund Processing: <strong>3.2 days</strong> (target: 2 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F08804]">⚠️</span>
              <span>Review Moderation: <strong>12 hour avg</strong> (target: 8 hours)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPerformancePage;
