import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api.service'
import { toast } from 'react-toastify'

// Chart Components
const RevenueChart = () => {
  const [revenueData, setRevenueData] = useState(null)
  const [period, setPeriod] = useState('last-30-days')
  const [loading, setLoading] = useState(false)

  const fetchRevenueData = async (selectedPeriod = period) => {
    try {
      setLoading(true)
      console.log('📊 Fetching revenue trends for period:', selectedPeriod)
      const response = await adminAPI.getRevenueTrends({ period: selectedPeriod })
      console.log('📈 Revenue trends response:', response)
      
      // Handle both direct data and nested data structure
      const data = response.data || response
      setRevenueData(data)
    } catch (error) {
      console.error('❌ Error fetching revenue trends:', error)
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value
    setPeriod(newPeriod)
    fetchRevenueData(newPeriod)
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Revenue Overview</h3>
        <select 
          style={{ padding: '8px', border: '1px solid #D5D9D9', borderRadius: '4px' }}
          value={period}
          onChange={handlePeriodChange}
        >
          <option value="last-7-days">Last 7 days</option>
          <option value="last-30-days">Last 30 days</option>
          <option value="last-3-months">Last 3 months</option>
          <option value="last-year">Last year</option>
        </select>
      </div>
      <div style={{ height: '300px', background: loading ? '#F7F8F8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '1.2em', flexDirection: 'column' }}>
        {loading ? (
          <>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>⏳</div>
            <div style={{ color: '#565959' }}>Loading revenue data...</div>
          </>
        ) : revenueData?.revenueTrends?.length > 0 ? (
          <>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📈</div>
            <div style={{ fontSize: '1.4em', marginBottom: '5px' }}>
              ${revenueData.revenueTrends.reduce((sum, trend) => sum + (trend.revenue || 0), 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
              {revenueData.revenueTrends.reduce((sum, trend) => sum + (trend.orders || 0), 0)} orders • {period.replace('-', ' ')}
            </div>
            <div style={{ fontSize: '0.8em', marginTop: '10px', opacity: 0.7 }}>
              Latest: ${revenueData.revenueTrends[revenueData.revenueTrends.length - 1]?.revenue?.toLocaleString() || '0'}
            </div>
          </>
        ) : revenueData?.data ? (
          <>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📈</div>
            <div style={{ fontSize: '1.4em', marginBottom: '5px' }}>
              ${revenueData.data.totalRevenue?.toLocaleString() || '0'}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
              {revenueData.data.totalOrders || 0} orders • {period.replace('-', ' ')}
            </div>
            <div style={{ fontSize: '0.8em', marginTop: '10px', opacity: 0.7 }}>
              Avg: ${revenueData.data.averageOrderValue?.toFixed(2) || '0.00'} per order
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>📈</div>
            <div>Revenue Chart</div>
            <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Real-time data</div>
          </>
        )}
      </div>
    </div>
  )
}

const CategoryChart = () => {
  const [categoryData, setCategoryData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCategoryData = async () => {
    try {
      setLoading(true)
      console.log('📊 Fetching category revenue data...')
      const response = await adminAPI.getRevenueByCategory()
      console.log('📈 Category revenue response:', response)
      
      // Handle both direct data and nested data structure
      const data = response.data || response
      setCategoryData(data)
    } catch (error) {
      console.error('❌ Error fetching category data:', error)
      toast.error('Failed to load category data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoryData()
  }, [])

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Top Categories</h3>
        <button 
          style={{ padding: '6px 12px', border: '1px solid #D5D9D9', borderRadius: '4px', background: '#FFFFFF', cursor: 'pointer' }}
          onClick={fetchCategoryData}
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>
      <div style={{ height: '300px', background: loading ? '#F7F8F8' : 'linear-gradient(135deg, #FF9900 0%, #FF6B35 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '1.2em', flexDirection: 'column' }}>
        {loading ? (
          <>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>⏳</div>
            <div style={{ color: '#565959' }}>Loading category data...</div>
          </>
        ) : categoryData?.revenueByCategory?.length > 0 ? (
          <div style={{ width: '100%', padding: '20px' }}>
            <div style={{ fontSize: '2em', marginBottom: '15px', textAlign: 'center' }}>📊</div>
            <div style={{ fontSize: '1.1em', marginBottom: '15px', textAlign: 'center' }}>Top Categories by Revenue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryData.revenueByCategory.slice(0, 4).map((category, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.9em' }}>{category.name}</span>
                  <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>${category.revenue?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : categoryData?.data?.revenueByCategory?.length > 0 ? (
          <div style={{ width: '100%', padding: '20px' }}>
            <div style={{ fontSize: '2em', marginBottom: '15px', textAlign: 'center' }}>📊</div>
            <div style={{ fontSize: '1.1em', marginBottom: '15px', textAlign: 'center' }}>Top Categories by Revenue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryData.data.revenueByCategory.slice(0, 4).map((category, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.9em' }}>{category.name}</span>
                  <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>${category.revenue?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>📊</div>
            <div>Category Revenue Chart</div>
            <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Real-time data</div>
          </>
        )}
      </div>
    </div>
  )
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeSellers: 0,
    totalCustomers: 0
  })
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Debug effect to log stats changes
  useEffect(() => {
    console.log('📊 Stats updated:', stats);
  }, [stats])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching admin dashboard data...');
      
      // Use adminAPI service instead of direct fetch
      const response = await adminAPI.getDashboardStats();
      
      console.log('📊 Dashboard API response:', response);
      
      // Handle both direct data and nested data structure
      const data = response.data || response;
      
      // Set stats from response
      if (data.stats) {
        console.log('✅ Setting stats:', data.stats);
        setStats(data.stats);
      } else {
        console.log('⚠️ No stats in response, using defaults');
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          activeSellers: 0,
          totalCustomers: 0
        });
      }
      
      // Set pending approvals if available
      if (data.pendingApprovals) {
        console.log('✅ Setting pending approvals:', data.pendingApprovals.length);
        setPendingApprovals(data.pendingApprovals.slice(0, 3));
      }
      
      // Set recent activity if available
      if (data.recentActivity) {
        console.log('✅ Setting recent activity:', data.recentActivity.length);
        setRecentActivity(data.recentActivity.slice(0, 4));
      }
      
      console.log('🎉 Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      const errorMessage = error.message || 'Failed to load dashboard data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase()
    if (statusLower === 'pending') return 'badge-pending'
    if (statusLower === 'approved' || statusLower === 'approval') return 'badge-approved'
    if (statusLower === 'rejected') return 'badge-rejected'
    if (statusLower === 'active' || statusLower === 'system') return 'badge-active'
    if (statusLower === 'payment') return 'badge-approved'
    return 'badge-pending'
  }

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={{fontSize: '1.2em', color: '#565959'}}>Loading dashboard...</div>
      </div>
    )
  }

  if (error && stats.totalRevenue === 0) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
        <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
        <button 
          onClick={fetchDashboardData} 
          style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <style>{`
        h1 { font-size: 2.2em; margin-bottom: 10px; }
        .subtitle { color: #565959; margin-bottom: 30px; font-size: 1.05em; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%); padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; transition: all 0.3s; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255,153,0,0.1) 0%, transparent 70%); }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .stat-icon { font-size: 3em; opacity: 0.9; }
        .stat-label { font-size: 0.9em; color: #565959; margin-bottom: 8px; font-weight: 500; }
        .stat-value { font-size: 2.2em; font-weight: bold; margin-bottom: 8px; }
        .stat-change { font-size: 0.85em; display: flex; align-items: center; gap: 5px; }
        .stat-change.positive { color: #067D62; }
        
        /* Chart Section */
        .chart-section { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
        .chart-card { background: #FFFFFF; padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
        .chart-title { font-size: 1.3em; font-weight: 600; }
        .chart-placeholder { height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 1.2em; }
        
        /* Section */
        .section { background: #FFFFFF; padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
        .section-title { font-size: 1.4em; font-weight: 600; }
        .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .btn-primary:hover { background: #F08804; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(255,153,0,0.3); }
        
        /* Table */
        table { width: 100%; border-collapse: collapse; }
        th { background: #F7F8F8; padding: 14px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #D5D9D9; font-size: 0.9em; text-transform: uppercase; color: #565959; }
        td { padding: 14px 12px; border-bottom: 1px solid #D5D9D9; }
        tr:hover { background: #F7F8F8; }
        
        /* Status Badge */
        .badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
        .badge-pending { background: #FFF4E5; color: #F08804; }
        .badge-approved { background: #E6F4F1; color: #067D62; }
        .badge-rejected { background: #FFE5E5; color: #C7511F; }
        .badge-active { background: #E7F3FF; color: #146EB4; }
        
        /* Action Buttons */
        .action-btns { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 14px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; font-size: 0.85em; text-decoration: none; color: #0F1111; transition: all 0.2s; }
        .btn-sm:hover { background: #F7F8F8; transform: translateY(-1px); }
        
        @media (max-width: 1024px) {
          .chart-section { grid-template-columns: 1fr; }
        }
      `}</style>

      <h1>Admin Dashboard</h1>
      <p className="subtitle">Platform overview and key metrics</p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">
                {stats.totalRevenue >= 1000000 
                  ? `$${(stats.totalRevenue / 1000000).toFixed(2)}M`
                  : stats.totalRevenue >= 1000
                  ? `$${(stats.totalRevenue / 1000).toFixed(1)}K`
                  : `$${(stats.totalRevenue || 0).toFixed(2)}`
                }
              </div>
              <div className="stat-change positive">↑ 15.3% <span style={{ color: '#565959' }}>vs last month</span></div>
            </div>
            <div className="stat-icon">💰</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders?.toLocaleString()}</div>
              <div className="stat-change positive">↑ 8.7% <span style={{ color: '#565959' }}>vs last month</span></div>
            </div>
            <div className="stat-icon">🛍️</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Active Sellers</div>
              <div className="stat-value">{stats.activeSellers?.toLocaleString()}</div>
              <div className="stat-change positive">↑ 12 <span style={{ color: '#565959' }}>new this month</span></div>
            </div>
            <div className="stat-icon">🏪</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{stats.totalCustomers?.toLocaleString()}</div>
              <div className="stat-change positive">↑ 23.1% <span style={{ color: '#565959' }}>vs last month</span></div>
            </div>
            <div className="stat-icon">👥</div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="chart-section">
        <RevenueChart />
        <CategoryChart />
      </div>

      {/* PENDING APPROVALS */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Pending Product Approvals</h2>
          <Link to="/admin/products" className="btn-primary">View All</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sellerName || product.seller?.name || 'Unknown Seller'}</td>
                  <td>{product.category || 'Uncategorized'}</td>
                  <td>${product.price}</td>
                  <td>{new Date(product.createdAt || product.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</td>
                  <td><span className={`badge ${getStatusBadge(product.status)}`}>{product.status}</span></td>
                  <td>
                    <div className="action-btns">
                      <Link to={`/admin/products/${product.id}`} className="btn-sm">Review</Link>
                      <button className="btn-sm" onClick={() => toast.success('Approve feature coming soon')}>Approve</button>
                      <button className="btn-sm" onClick={() => toast.error('Reject feature coming soon')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                  <div style={{fontSize: '2em', marginBottom: '10px'}}>✅</div>
                  <div>No pending approvals</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <Link to="/admin/logs" className="btn-primary">View All Logs</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>User</th>
              <th>Type</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.description || activity.action}</td>
                  <td>{activity.userName || activity.user?.name || 'System'}</td>
                  <td><span className={`badge ${getStatusBadge(activity.type || activity.category)}`}>{activity.type || activity.category}</span></td>
                  <td>{new Date(activity.createdAt || activity.timestamp).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                  <div style={{fontSize: '2em', marginBottom: '10px'}}>📋</div>
                  <div>No recent activity</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboardPage
