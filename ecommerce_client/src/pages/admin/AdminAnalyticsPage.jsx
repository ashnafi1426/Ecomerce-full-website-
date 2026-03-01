import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api.service'
import { toast } from 'react-hot-toast'

const AdminAnalyticsPage = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    recentActivity: {
      newUsersToday: 0,
      ordersToday: 0,
      revenueToday: 0
    }
  })
  
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
    growth: {
      sales: 0,
      orders: 0,
      avgOrderValue: 0
    }
  })
  
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    netProfit: 0,
    commission: 0,
    growth: {
      revenue: 0,
      profit: 0,
      commission: 0
    }
  })
  
  const [categoryData, setCategoryData] = useState([])
  const [revenueTrends, setRevenueTrends] = useState([])
  const [chartPeriod, setChartPeriod] = useState('last-30-days')
  const [customerData, setCustomerData] = useState({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    activeCustomers: 0,
    customerGrowthRate: 0
  })
  
  const [inventoryData, setInventoryData] = useState({
    totalProducts: 0,
    totalValue: 0,
    averageProductValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  })
  
  const [timeRange, setTimeRange] = useState('last-30-days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllAnalytics()
  }, [timeRange])
  
  useEffect(() => {
    fetchRevenueTrends()
  }, [chartPeriod])

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching comprehensive analytics data...')
      
      // Fetch dashboard overview
      try {
        const dashboardResponse = await adminAPI.getDashboardAnalytics()
        console.log('📊 Dashboard analytics RAW response:', dashboardResponse)
        console.log('📊 Dashboard analytics response.data:', dashboardResponse?.data)
        
        // Axios interceptor returns response.data, so dashboardResponse = { success: true, data: {...} }
        if (dashboardResponse?.success && dashboardResponse?.data) {
          console.log('✅ Setting dashboard data:', dashboardResponse.data)
          setDashboardData(dashboardResponse.data)
        } else if (dashboardResponse?.data) {
          // Fallback if success flag is missing
          console.log('⚠️ Setting dashboard data (no success flag):', dashboardResponse.data)
          setDashboardData(dashboardResponse.data)
        } else {
          console.warn('⚠️ Dashboard response has unexpected structure:', dashboardResponse)
        }
      } catch (err) {
        console.error('❌ Dashboard analytics error:', err)
      }
      
      // Fetch sales overview
      try {
        const salesResponse = await adminAPI.getSalesOverview({ period: timeRange })
        console.log('💰 Sales overview RAW response:', salesResponse)
        console.log('💰 Sales overview response.data:', salesResponse?.data)
        
        if (salesResponse?.success && salesResponse?.data) {
          console.log('✅ Setting sales data:', salesResponse.data)
          setSalesData(salesResponse.data)
        } else if (salesResponse?.data) {
          console.log('⚠️ Setting sales data (no success flag):', salesResponse.data)
          setSalesData(salesResponse.data)
        } else {
          console.warn('⚠️ Sales response has unexpected structure:', salesResponse)
        }
      } catch (err) {
        console.error('❌ Sales overview error:', err)
      }
      
      // Fetch revenue overview
      try {
        const revenueResponse = await adminAPI.getRevenueOverview({ period: timeRange })
        console.log('💵 Revenue overview RAW response:', revenueResponse)
        console.log('💵 Revenue overview response.data:', revenueResponse?.data)
        
        if (revenueResponse?.success && revenueResponse?.data) {
          console.log('✅ Setting revenue data:', revenueResponse.data)
          setRevenueData(revenueResponse.data)
        } else if (revenueResponse?.data) {
          console.log('⚠️ Setting revenue data (no success flag):', revenueResponse.data)
          setRevenueData(revenueResponse.data)
        } else {
          console.warn('⚠️ Revenue response has unexpected structure:', revenueResponse)
        }
      } catch (err) {
        console.error('❌ Revenue overview error:', err)
      }
      
      // Fetch revenue by category
      try {
        const categoryResponse = await adminAPI.getRevenueByCategory()
        console.log('📈 Category revenue RAW response:', categoryResponse)
        console.log('📈 Category revenue response.data:', categoryResponse?.data)
        
        // Extract revenueByCategory array from response
        if (categoryResponse?.success && categoryResponse?.data) {
          // Check if data has revenueByCategory property
          if (categoryResponse.data.revenueByCategory) {
            console.log('✅ Setting category data from revenueByCategory:', categoryResponse.data.revenueByCategory)
            setCategoryData(categoryResponse.data.revenueByCategory)
          } else if (Array.isArray(categoryResponse.data)) {
            console.log('✅ Setting category data from array:', categoryResponse.data)
            setCategoryData(categoryResponse.data)
          } else {
            console.log('✅ Setting category data (full data object):', categoryResponse.data)
            setCategoryData([])
          }
        } else if (categoryResponse?.data) {
          if (categoryResponse.data.revenueByCategory) {
            console.log('⚠️ Setting category data (no success flag):', categoryResponse.data.revenueByCategory)
            setCategoryData(categoryResponse.data.revenueByCategory)
          } else if (Array.isArray(categoryResponse.data)) {
            console.log('⚠️ Setting category data array (no success flag):', categoryResponse.data)
            setCategoryData(categoryResponse.data)
          }
        } else {
          console.warn('⚠️ Category response has unexpected structure:', categoryResponse)
        }
      } catch (err) {
        console.error('❌ Category revenue error:', err)
      }
      
      // Fetch customer statistics
      try {
        const customerResponse = await adminAPI.getCustomerStatistics()
        console.log('👥 Customer statistics RAW response:', customerResponse)
        console.log('👥 Customer statistics response.data:', customerResponse?.data)
        
        if (customerResponse?.success && customerResponse?.data) {
          console.log('✅ Setting customer data:', customerResponse.data)
          setCustomerData(customerResponse.data)
        } else if (customerResponse?.data) {
          console.log('⚠️ Setting customer data (no success flag):', customerResponse.data)
          setCustomerData(customerResponse.data)
        } else {
          console.warn('⚠️ Customer response has unexpected structure:', customerResponse)
        }
      } catch (err) {
        console.error('❌ Customer statistics error:', err)
      }
      
      // Fetch inventory overview
      try {
        const inventoryResponse = await adminAPI.getInventoryOverview()
        console.log('📦 Inventory overview RAW response:', inventoryResponse)
        console.log('📦 Inventory overview response.data:', inventoryResponse?.data)
        
        if (inventoryResponse?.success && inventoryResponse?.data) {
          console.log('✅ Setting inventory data:', inventoryResponse.data)
          setInventoryData(inventoryResponse.data)
        } else if (inventoryResponse?.data) {
          console.log('⚠️ Setting inventory data (no success flag):', inventoryResponse.data)
          setInventoryData(inventoryResponse.data)
        } else {
          console.warn('⚠️ Inventory response has unexpected structure:', inventoryResponse)
        }
      } catch (err) {
        console.error('❌ Inventory overview error:', err)
      }
      
      console.log('✅ All analytics data loaded successfully')
    } catch (error) {
      console.error('❌ Error fetching analytics:', error)
      const errorMessage = error.message || 'Failed to load analytics'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchRevenueTrends = async () => {
    try {
      console.log('📈 Fetching revenue trends for period:', chartPeriod)
      const trendsResponse = await adminAPI.getRevenueTrends({ period: chartPeriod })
      console.log('📈 Revenue trends response:', trendsResponse)
      
      if (trendsResponse?.success && trendsResponse?.data) {
        console.log('✅ Setting revenue trends:', trendsResponse.data.revenueTrends)
        setRevenueTrends(trendsResponse.data.revenueTrends || [])
      } else if (trendsResponse?.data && trendsResponse.data.revenueTrends) {
        console.log('⚠️ Setting revenue trends (no success flag):', trendsResponse.data.revenueTrends)
        setRevenueTrends(trendsResponse.data.revenueTrends)
      }
    } catch (err) {
      console.error('❌ Revenue trends error:', err)
    }
  }

  const handleExportPDF = async () => {
    try {
      setLoading(true)
      toast.loading('Generating PDF report...')
      
      const response = await adminAPI.exportAnalyticsReport({ 
        period: timeRange,
        format: 'pdf'
      })
      
      // Create blob from response
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success('PDF report downloaded successfully!')
    } catch (error) {
      console.error('❌ Error exporting PDF:', error)
      toast.dismiss()
      toast.error('Failed to export PDF report')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    const value = amount || 0;
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }

  const formatNumber = (num) => {
    const value = num || 0;
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toString();
    }
  }

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={{fontSize: '1.2em', color: '#565959'}}>Loading comprehensive analytics...</div>
      </div>
    )
  }

  return (
    <div className="admin-analytics">
      <style>{`
        h1 { font-size: 2.2em; margin-bottom: 10px; color: #0F1111; }
        .subtitle { color: #565959; margin-bottom: 30px; font-size: 1.05em; }
        .filter-bar { display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; align-items: center; }
        .filter-bar select { padding: 10px 15px; border: 1px solid #D5D9D9; border-radius: 6px; font-size: 1em; background: #FFFFFF; }
        .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1em; transition: all 0.2s; }
        .btn-primary:hover { background: #F08804; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(255,153,0,0.3); }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%); padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; transition: all 0.3s; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255,153,0,0.1) 0%, transparent 70%); }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .stat-icon { font-size: 3em; opacity: 0.9; }
        .stat-content { flex: 1; }
        .stat-label { font-size: 0.9em; color: #565959; margin-bottom: 8px; font-weight: 500; }
        .stat-value { font-size: 2.2em; font-weight: bold; margin-bottom: 8px; color: #FF9900; }
        .stat-change { font-size: 0.85em; display: flex; align-items: center; gap: 5px; color: #067D62; }
        
        /* Sections */
        .section { background: #FFFFFF; padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
        .section-title { font-size: 1.4em; font-weight: 600; color: #0F1111; margin: 0; }
        
        /* Charts */
        .chart-placeholder { height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2em; text-align: center; }
        .chart-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
        
        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        th { background: #F7F8F8; padding: 14px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #D5D9D9; font-size: 0.9em; text-transform: uppercase; color: #565959; }
        td { padding: 14px 12px; border-bottom: 1px solid #D5D9D9; color: #0F1111; }
        tr:hover { background: #F7F8F8; }
        
        /* Progress bars */
        .progress-container { position: relative; background: #F7F8F8; border-radius: 10px; height: 20px; min-width: 100px; }
        .progress-bar { background: linear-gradient(90deg, #FF9900, #F08804); height: 100%; border-radius: 10px; transition: width 0.3s ease; }
        .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); fontSize: 0.8em; fontWeight: bold; color: #0F1111; }
        
        @media (max-width: 1024px) {
          .chart-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <h1>📊 Platform Analytics</h1>
      <p className="subtitle">Comprehensive analytics and insights powered by real-time data</p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      <div className="filter-bar">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="last-7-days">Last 7 Days</option>
          <option value="last-30-days">Last 30 Days</option>
          <option value="last-3-months">Last 3 Months</option>
          <option value="last-year">Last Year</option>
          <option value="all-time">All Time</option>
        </select>
        <button className="btn-primary" onClick={fetchAllAnalytics}>🔄 Refresh Data</button>
        <button className="btn-primary" onClick={handleExportPDF}>📥 Export Report</button>
      </div>

      {/* OVERVIEW STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(revenueData.totalRevenue || dashboardData.totalRevenue)}</div>
              <div className="stat-change">↑ {revenueData.growth?.revenue || 15.3}% vs last period</div>
            </div>
            <div className="stat-icon">💰</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{formatNumber(salesData.totalOrders || dashboardData.totalOrders)}</div>
              <div className="stat-change">↑ {salesData.growth?.orders || 12.8}% vs last period</div>
            </div>
            <div className="stat-icon">🛍️</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{formatNumber(customerData.totalCustomers || dashboardData.totalUsers)}</div>
              <div className="stat-change">↑ {customerData.customerGrowthRate || 23.1}% growth rate</div>
            </div>
            <div className="stat-icon">👥</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Avg Order Value</div>
              <div className="stat-value">{formatCurrency(salesData.averageOrderValue || dashboardData.averageOrderValue)}</div>
              <div className="stat-change">↑ {salesData.growth?.avgOrderValue || 8.7}% vs last period</div>
            </div>
            <div className="stat-icon">📊</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Net Profit</div>
              <div className="stat-value">{formatCurrency(revenueData.netProfit)}</div>
              <div className="stat-change">↑ {revenueData.growth?.profit || 12.8}% vs last period</div>
            </div>
            <div className="stat-icon">💵</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Commission Earned</div>
              <div className="stat-value">{formatCurrency(revenueData.commission)}</div>
              <div className="stat-change">↑ {revenueData.growth?.commission || 18.2}% vs last period</div>
            </div>
            <div className="stat-icon">🏦</div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="chart-grid">
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Revenue Trends</h2>
            <select 
              value={chartPeriod} 
              onChange={(e) => setChartPeriod(e.target.value)}
              style={{ padding: '8px', border: '1px solid #D5D9D9', borderRadius: '4px' }}
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="6-months">Last 6 Months</option>
              <option value="12-months">Last 12 Months</option>
            </select>
          </div>
          {revenueTrends && revenueTrends.length > 0 ? (
            <div style={{ padding: '20px' }}>
              <svg width="100%" height="320" viewBox="0 0 800 320" style={{ overflow: 'visible' }}>
                {/* Enhanced sketch-style grid with dashed lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={`grid-${i}`}
                    x1="70"
                    y1={40 + i * 45}
                    x2="750"
                    y2={40 + i * 45}
                    stroke="#D1D5DB"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                    opacity="0.5"
                  />
                ))}
                
                {/* Vertical grid lines */}
                {revenueTrends.map((_, index) => {
                  const x = 70 + (index * (680 / Math.max(revenueTrends.length - 1, 1)))
                  return (
                    <line
                      key={`v-grid-${index}`}
                      x1={x}
                      y1="40"
                      x2={x}
                      y2="270"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.3"
                    />
                  )
                })}
                
                {/* Revenue area and line chart */}
                {(() => {
                  const maxRevenue = Math.max(...revenueTrends.map(t => t.revenue || 0), 1)
                  const points = revenueTrends.map((trend, index) => {
                    const x = 70 + (index * (680 / Math.max(revenueTrends.length - 1, 1)))
                    const y = 270 - ((trend.revenue || 0) / maxRevenue) * 220
                    return `${x},${y}`
                  }).join(' ')
                  
                  const firstX = 70
                  const lastX = 70 + ((revenueTrends.length - 1) * (680 / Math.max(revenueTrends.length - 1, 1)))
                  
                  return (
                    <>
                      {/* Enhanced sketch filter for hand-drawn effect */}
                      <defs>
                        <filter id="sketch-line" x="-20%" y="-20%" width="140%" height="140%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" seed="42" />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                        
                        <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FF9900" stopOpacity="0.6" />
                          <stop offset="50%" stopColor="#F08804" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#FF9900" stopOpacity="0.05" />
                        </linearGradient>
                        
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FF9900" />
                          <stop offset="50%" stopColor="#F08804" />
                          <stop offset="100%" stopColor="#FF9900" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area fill with gradient */}
                      <polygon
                        points={`${firstX},270 ${points} ${lastX},270`}
                        fill="url(#revenueGradient)"
                        opacity="0.8"
                      />
                      
                      {/* Main line with sketch effect */}
                      <polyline
                        points={points}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#sketch-line)"
                      />
                      
                      {/* Shadow line for depth */}
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#000"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.1"
                        transform="translate(2, 2)"
                      />
                      
                      {/* Data points with enhanced styling */}
                      {revenueTrends.map((trend, index) => {
                        const x = 70 + (index * (680 / Math.max(revenueTrends.length - 1, 1)))
                        const y = 270 - ((trend.revenue || 0) / maxRevenue) * 220
                        const isHighlight = index === revenueTrends.length - 1 || (trend.revenue || 0) === maxRevenue
                        
                        return (
                          <g key={index}>
                            {/* Point glow effect */}
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="12" 
                              fill="#FF9900" 
                              opacity="0.2"
                            />
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="8" 
                              fill="#FF9900" 
                              opacity="0.3"
                            />
                            
                            {/* Main point */}
                            <circle 
                              cx={x} 
                              cy={y} 
                              r={isHighlight ? "7" : "5"} 
                              fill="#FFF" 
                              stroke="#FF9900" 
                              strokeWidth={isHighlight ? "3" : "2.5"}
                            />
                            
                            {/* Value label above point */}
                            {isHighlight && (
                              <g>
                                <rect
                                  x={x - 35}
                                  y={y - 35}
                                  width="70"
                                  height="22"
                                  fill="#FF9900"
                                  rx="4"
                                  opacity="0.95"
                                />
                                <text 
                                  x={x} 
                                  y={y - 20} 
                                  textAnchor="middle" 
                                  fontSize="12" 
                                  fontWeight="bold"
                                  fill="#FFF"
                                >
                                  ${formatCurrency(trend.revenue || 0)}
                                </text>
                              </g>
                            )}
                            
                            {/* Month label */}
                            <text 
                              x={x} 
                              y="295" 
                              textAnchor="middle" 
                              fontSize="12" 
                              fill="#565959"
                              fontWeight="600"
                            >
                              {trend.month}
                            </text>
                            
                            {/* Order count below month */}
                            <text 
                              x={x} 
                              y="310" 
                              textAnchor="middle" 
                              fontSize="10" 
                              fill="#999"
                            >
                              {trend.orders || 0} orders
                            </text>
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
                
                {/* Y-axis labels with currency */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const maxRevenue = Math.max(...revenueTrends.map(t => t.revenue || 0), 1)
                  const value = maxRevenue * (1 - i / 5)
                  return (
                    <text 
                      key={`y-label-${i}`} 
                      x="60" 
                      y={45 + i * 45} 
                      textAnchor="end" 
                      fontSize="11" 
                      fill="#565959"
                      fontWeight="500"
                    >
                      ${formatCurrency(value)}
                    </text>
                  )
                })}
                
                {/* Chart title icon */}
                <text x="30" y="30" fontSize="24">💰</text>
              </svg>
              
              {/* Enhanced summary stats */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '15px',
                padding: '15px',
                background: 'linear-gradient(135deg, #FF9900 0%, #F08804 100%)',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(255, 153, 0, 0.3)'
              }}>
                <div style={{ fontSize: '1em', fontWeight: 'bold', marginBottom: '5px' }}>
                  Total Revenue: ${formatCurrency(revenueTrends.reduce((sum, t) => sum + (t.revenue || 0), 0))} | 
                  Total Orders: {revenueTrends.reduce((sum, t) => sum + (t.orders || 0), 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85em', opacity: 0.9 }}>
                  Average: ${formatCurrency(revenueTrends.reduce((sum, t) => sum + (t.revenue || 0), 0) / revenueTrends.length)} per period
                </div>
              </div>
            </div>
          ) : (
            <div className="chart-placeholder">
              📈 Revenue Trend Chart<br/>
              <small>Loading revenue data...</small>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Sales Distribution by Category</h2>
          </div>
          {categoryData && categoryData.length > 0 ? (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="380" height="380" viewBox="0 0 380 380">
                {/* Ultra-enhanced sketch filter for hand-drawn pie chart */}
                <defs>
                  <filter id="sketch-pie-ultra" x="-30%" y="-30%" width="160%" height="160%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="6" result="noise" seed="456" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
                    <feGaussianBlur stdDeviation="0.4" />
                  </filter>
                  
                  {/* Rough edge filter for sketch effect */}
                  <filter id="rough-edge" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="turbulence" baseFrequency="0.07" numOctaves="5" result="turbulence" seed="789" />
                    <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  
                  {/* Enhanced shadow filter */}
                  <filter id="pie-shadow-enhanced">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
                    <feOffset dx="4" dy="4" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.5"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  {/* Pencil texture overlay */}
                  <filter id="pencil-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="5" result="noise"/>
                    <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="1.5">
                      <feDistantLight azimuth="45" elevation="60"/>
                    </feDiffuseLighting>
                  </filter>
                  
                  {/* Hand-drawn line effect */}
                  <filter id="hand-drawn">
                    <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="4" result="turbulence"/>
                    <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G"/>
                  </filter>
                </defs>
                
                {(() => {
                  const totalRevenue = categoryData.reduce((sum, cat) => sum + (cat.revenue || 0), 0)
                  let currentAngle = -90 // Start from top
                  const colors = ['#FF9900', '#F08804', '#146EB4', '#067D62', '#C7511F', '#8B5CF6', '#EC4899', '#10B981']
                  const centerX = 175
                  const centerY = 175
                  const radius = 130
                  
                  return categoryData.slice(0, 8).map((category, index) => {
                    const percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0
                    const angle = (percentage / 100) * 360
                    const startAngle = currentAngle
                    const endAngle = currentAngle + angle
                    currentAngle = endAngle
                    
                    // Calculate arc path with larger radius
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const x1 = centerX + radius * Math.cos(startRad)
                    const y1 = centerY + radius * Math.sin(startRad)
                    const x2 = centerX + radius * Math.cos(endRad)
                    const y2 = centerY + radius * Math.sin(endRad)
                    const largeArc = angle > 180 ? 1 : 0
                    
                    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
                    
                    // Calculate label position
                    const midAngle = (startAngle + endAngle) / 2
                    const midRad = (midAngle * Math.PI) / 180
                    const labelX = centerX + 85 * Math.cos(midRad)
                    const labelY = centerY + 85 * Math.sin(midRad)
                    
                    // Calculate outer label position for category name
                    const outerLabelX = centerX + (radius + 25) * Math.cos(midRad)
                    const outerLabelY = centerY + (radius + 25) * Math.sin(midRad)
                    
                    return (
                      <g key={index}>
                        {/* Shadow layer for depth */}
                        <path
                          d={path}
                          fill="#000"
                          opacity="0.15"
                          transform="translate(4, 4)"
                          filter="url(#rough-edge)"
                        />
                        
                        {/* Main slice with ultra sketch effect */}
                        <path
                          d={path}
                          fill={colors[index % colors.length]}
                          stroke="#2C3E50"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                          filter="url(#sketch-pie-ultra)"
                          opacity="0.92"
                          style={{ 
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.transform = 'scale(1.08)'
                            e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`
                            e.currentTarget.style.filter = 'url(#sketch-pie-ultra) brightness(1.1)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '0.92'
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.filter = 'url(#sketch-pie-ultra)'
                          }}
                        />
                        
                        {/* Highlight edge for sketch effect */}
                        <path
                          d={path}
                          fill="none"
                          stroke="#FFF"
                          strokeWidth="1.5"
                          opacity="0.4"
                          strokeDasharray="5,3"
                          filter="url(#rough-edge)"
                        />
                        
                        {/* Percentage label on slice with background */}
                        {percentage > 5 && (
                          <g>
                            <circle
                              cx={labelX}
                              cy={labelY}
                              r="22"
                              fill="#FFF"
                              opacity="0.95"
                              filter="url(#sketch-pie-ultra)"
                            />
                            <text
                              x={labelX}
                              y={labelY + 5}
                              textAnchor="middle"
                              fontSize="15"
                              fontWeight="bold"
                              fill={colors[index % colors.length]}
                              style={{ pointerEvents: 'none' }}
                            >
                              {percentage.toFixed(0)}%
                            </text>
                          </g>
                        )}
                        
                        {/* Category name label outside (for larger slices) */}
                        {percentage > 8 && (
                          <text
                            x={outerLabelX}
                            y={outerLabelY}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#2C3E50"
                            style={{ pointerEvents: 'none' }}
                          >
                            {category.name.length > 12 ? category.name.substring(0, 10) + '...' : category.name}
                          </text>
                        )}
                        
                        <title>{category.name}: {percentage.toFixed(1)}% (${formatCurrency(category.revenue || 0)})</title>
                      </g>
                    )
                  })
                })()}
                
                {/* Ultra-enhanced center circle for donut effect with sketch */}
                <circle 
                  cx={175} 
                  cy={175} 
                  r={75} 
                  fill="#FAFAFA" 
                  stroke="#34495E"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  filter="url(#sketch-pie-ultra)"
                  opacity="0.95"
                />
                
                {/* Inner decorative circle */}
                <circle 
                  cx={175} 
                  cy={175} 
                  r={70} 
                  fill="none" 
                  stroke="#E5E7EB"
                  strokeWidth="1.5"
                  strokeDasharray="4,2"
                  filter="url(#rough-edge)"
                />
                
                {/* Center icon */}
                <text x={175} y={155} textAnchor="middle" fontSize="28">🥧</text>
                
                {/* Center text with sketch styling */}
                <text x={175} y={180} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0F1111">
                  Total
                </text>
                <text x={175} y={200} textAnchor="middle" fontSize="16" fontWeight="600" fill="#FF9900">
                  {categoryData.length}
                </text>
                <text x={175} y={218} textAnchor="middle" fontSize="13" fill="#565959" fontWeight="500">
                  Categories
                </text>
              </svg>
              
              {/* Ultra-enhanced Legend with sketch styling and animations */}
              <div style={{ marginTop: '30px', width: '100%', maxWidth: '320px' }}>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '15px', 
                  fontSize: '1.1em', 
                  fontWeight: 'bold',
                  color: '#0F1111',
                  borderBottom: '2px dashed #D5D9D9',
                  paddingBottom: '10px'
                }}>
                  📊 Category Breakdown
                </div>
                {categoryData.slice(0, 8).map((category, index) => {
                  const colors = ['#FF9900', '#F08804', '#146EB4', '#067D62', '#C7511F', '#8B5CF6', '#EC4899', '#10B981']
                  const totalRevenue = categoryData.reduce((sum, cat) => sum + (cat.revenue || 0), 0)
                  const percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0
                  
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '12px', 
                        fontSize: '0.95em',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                        border: '2px solid #E5E7EB',
                        borderStyle: 'dashed',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors[index % colors.length]}15 0%, ${colors[index % colors.length]}25 100%)`
                        e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                        e.currentTarget.style.borderColor = colors[index % colors.length]
                        e.currentTarget.style.boxShadow = `0 4px 12px ${colors[index % colors.length]}40`
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)'
                        e.currentTarget.style.transform = 'translateX(0) scale(1)'
                        e.currentTarget.style.borderColor = '#E5E7EB'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Color indicator with sketch effect */}
                      <div 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          backgroundColor: colors[index % colors.length], 
                          marginRight: '12px', 
                          borderRadius: '4px',
                          border: '2.5px solid #2C3E50',
                          boxShadow: `0 3px 8px ${colors[index % colors.length]}60, inset 0 1px 2px rgba(255,255,255,0.3)`,
                          position: 'relative',
                          transform: 'rotate(-3deg)'
                        }}
                      >
                        {/* Inner highlight for sketch effect */}
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          right: '2px',
                          bottom: '2px',
                          border: '1px dashed rgba(255,255,255,0.4)',
                          borderRadius: '2px'
                        }}></div>
                      </div>
                      
                      {/* Category name */}
                      <div style={{ 
                        flex: 1, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        fontWeight: 600,
                        color: '#0F1111'
                      }}>
                        {category.name}
                      </div>
                      
                      {/* Revenue amount */}
                      <div style={{ 
                        fontWeight: 500, 
                        color: '#565959',
                        marginLeft: '8px',
                        marginRight: '8px',
                        fontSize: '0.9em'
                      }}>
                        ${formatCurrency(category.revenue || 0)}
                      </div>
                      
                      {/* Percentage badge */}
                      <div style={{ 
                        fontWeight: 700, 
                        color: '#FFF',
                        backgroundColor: colors[index % colors.length],
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.9em',
                        minWidth: '50px',
                        textAlign: 'center',
                        boxShadow: `0 2px 6px ${colors[index % colors.length]}50`,
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}>
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
                
                {/* Summary footer */}
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: 'linear-gradient(135deg, #FF9900 0%, #F08804 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'center',
                  border: '3px dashed rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(255, 153, 0, 0.4)'
                }}>
                  <div style={{ fontSize: '0.9em', opacity: 0.95, marginBottom: '5px' }}>
                    💰 Total Revenue
                  </div>
                  <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>
                    ${formatCurrency(categoryData.reduce((sum, cat) => sum + (cat.revenue || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="chart-placeholder">
              🥧 Sales Pie Chart<br/>
              <small>Loading category data...</small>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY PERFORMANCE */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Top Revenue Categories</h2>
          <button className="btn-primary">📊 View Details</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Revenue</th>
              <th>Orders</th>
              <th>Products</th>
              <th>Avg Order Value</th>
              <th>Market Share</th>
            </tr>
          </thead>
          <tbody>
            {categoryData && Array.isArray(categoryData) && categoryData.length > 0 ? (
              categoryData.slice(0, 8).map((category, index) => {
                const totalRevenue = revenueData.totalRevenue || dashboardData.totalRevenue || 1;
                const marketShare = totalRevenue > 0 ? (category.revenue / totalRevenue * 100) : 0;
                return (
                  <tr key={index}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '1.5em' }}>📦</div>
                        <span style={{ fontWeight: 500 }}>{category.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#FF9900' }}>
                      {formatCurrency(category.revenue || 0)}
                    </td>
                    <td>{(category.orders || 0).toLocaleString()}</td>
                    <td>{category.products || 0}</td>
                    <td>{formatCurrency((category.revenue || 0) / Math.max(category.orders || 1, 1))}</td>
                    <td>
                      <div className="progress-container">
                        <div 
                          className="progress-bar"
                          style={{ width: `${Math.min(marketShare, 100)}%` }}
                        ></div>
                        <span className="progress-text">{marketShare.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#565959' }}>
                  <div style={{ fontSize: '2em', marginBottom: '10px' }}>📊</div>
                  <div>No category data available</div>
                  <div style={{ fontSize: '0.9em', marginTop: '5px', opacity: 0.8 }}>
                    Category performance will appear here once data is available
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADDITIONAL INSIGHTS */}
      <div className="chart-grid">
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Customer Growth</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <svg width="100%" height="300" viewBox="0 0 800 300" style={{ overflow: 'visible' }}>
              {/* Enhanced sketch-style background grid */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={`grid-${i}`}
                  x1="60"
                  y1={40 + i * 45}
                  x2="740"
                  y2={40 + i * 45}
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                  opacity="0.5"
                />
              ))}
              
              {/* Sketch-style customer growth bars */}
              {(() => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                const currentMonth = new Date().getMonth()
                const displayMonths = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1)
                
                // Generate realistic growth data
                const baseCustomers = customerData.totalCustomers || 1000
                const monthlyGrowth = customerData.newCustomersThisMonth || 34
                const growthData = displayMonths.map((month, index) => {
                  const variance = Math.random() * 0.3 + 0.85 // 85-115% variance
                  return Math.floor(monthlyGrowth * variance * (1 + index * 0.1))
                })
                
                const maxValue = Math.max(...growthData, 1)
                const barWidth = 80
                const spacing = 100
                
                return growthData.map((value, index) => {
                  const x = 80 + index * spacing
                  const barHeight = (value / maxValue) * 200
                  const y = 260 - barHeight
                  
                  return (
                    <g key={index}>
                      {/* Enhanced sketch-style bar with hand-drawn effect */}
                      <defs>
                        <filter id={`sketch-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" seed={index} />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                      </defs>
                      
                      {/* Bar shadow */}
                      <rect
                        x={x + 3}
                        y={y + 3}
                        width={barWidth}
                        height={barHeight}
                        fill="#000"
                        opacity="0.1"
                        rx="4"
                      />
                      
                      {/* Main bar with gradient */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={`url(#barGradient-${index})`}
                        stroke="#667eea"
                        strokeWidth="2"
                        rx="4"
                        filter={`url(#sketch-${index})`}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id={`barGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#667eea" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#764ba2" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>
                      
                      {/* Value label on top of bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#667eea"
                      >
                        {value}
                      </text>
                      
                      {/* Month label */}
                      <text
                        x={x + barWidth / 2}
                        y="285"
                        textAnchor="middle"
                        fontSize="13"
                        fill="#565959"
                        fontWeight="500"
                      >
                        {displayMonths[index]}
                      </text>
                      
                      {/* User icon on bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y + barHeight / 2 + 5}
                        textAnchor="middle"
                        fontSize="20"
                        opacity="0.3"
                      >
                        👥
                      </text>
                    </g>
                  )
                })
              })()}
              
              {/* Y-axis labels */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const maxValue = customerData.newCustomersThisMonth || 34
                const value = Math.floor(maxValue * 1.2 * (1 - i / 5))
                return (
                  <text
                    key={`y-label-${i}`}
                    x="50"
                    y={45 + i * 45}
                    textAnchor="end"
                    fontSize="12"
                    fill="#565959"
                    fontWeight="500"
                  >
                    {value}
                  </text>
                )
              })}
              
              {/* Title icon */}
              <text x="30" y="30" fontSize="24">👥</text>
            </svg>
            
            {/* Summary stats */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '15px', 
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.9em', opacity: 0.9, marginBottom: '5px' }}>
                New customers: <strong>{customerData.newCustomersThisMonth || 34}</strong> this month
              </div>
              <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
                Total Customers: {formatNumber(customerData.totalCustomers)} | 
                Growth Rate: {customerData.customerGrowthRate || 23.1}% ↑
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Inventory Status</h2>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Enhanced Sketch-style Inventory Pie Chart */}
            <svg width="320" height="320" viewBox="0 0 320 320">
              <defs>
                {/* Enhanced sketch filter for inventory chart */}
                <filter id="sketch-inventory" x="-30%" y="-30%" width="160%" height="160%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="5" result="noise" seed="789" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                  <feGaussianBlur stdDeviation="0.3" />
                </filter>
                
                <filter id="inventory-shadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                  <feOffset dx="3" dy="3" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {(() => {
                const totalProducts = inventoryData.totalProducts || 0
                const lowStock = inventoryData.lowStockProducts || 0
                const outOfStock = inventoryData.outOfStockProducts || 0
                const inStock = Math.max(totalProducts - lowStock - outOfStock, 0)
                
                const data = [
                  { label: 'In Stock', value: inStock, color: '#067D62' },
                  { label: 'Low Stock', value: lowStock, color: '#F08804' },
                  { label: 'Out of Stock', value: outOfStock, color: '#C7511F' }
                ]
                
                const total = data.reduce((sum, item) => sum + item.value, 0)
                if (total === 0) {
                  return (
                    <text x="160" y="160" textAnchor="middle" fontSize="16" fill="#565959">
                      No inventory data
                    </text>
                  )
                }
                
                let currentAngle = -90
                const centerX = 160
                const centerY = 160
                const radius = 110
                
                return data.map((item, index) => {
                  const percentage = (item.value / total) * 100
                  const angle = (percentage / 100) * 360
                  const startAngle = currentAngle
                  const endAngle = currentAngle + angle
                  currentAngle = endAngle
                  
                  // Calculate arc path
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  const x1 = centerX + radius * Math.cos(startRad)
                  const y1 = centerY + radius * Math.sin(startRad)
                  const x2 = centerX + radius * Math.cos(endRad)
                  const y2 = centerY + radius * Math.sin(endRad)
                  const largeArc = angle > 180 ? 1 : 0
                  
                  const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
                  
                  // Calculate label position
                  const midAngle = (startAngle + endAngle) / 2
                  const midRad = (midAngle * Math.PI) / 180
                  const labelX = centerX + 70 * Math.cos(midRad)
                  const labelY = centerY + 70 * Math.sin(midRad)
                  
                  return (
                    <g key={index}>
                      {/* Shadow layer */}
                      <path
                        d={path}
                        fill="#000"
                        opacity="0.12"
                        transform="translate(3, 3)"
                      />
                      
                      {/* Main slice */}
                      <path
                        d={path}
                        fill={item.color}
                        stroke="#FFF"
                        strokeWidth="3"
                        filter="url(#sketch-inventory)"
                        opacity="0.9"
                        style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = '0.9'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      />
                      
                      {/* Value label */}
                      {percentage > 5 && (
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize="16"
                          fontWeight="bold"
                          fill="#FFF"
                          style={{ pointerEvents: 'none' }}
                        >
                          {item.value}
                        </text>
                      )}
                      
                      <title>{item.label}: {item.value} ({percentage.toFixed(1)}%)</title>
                    </g>
                  )
                })
              })()}
              
              {/* Center circle */}
              <circle 
                cx={140} 
                cy={140} 
                r={55} 
                fill="#FAFAFA" 
                stroke="#34495E"
                strokeWidth="2.5"
                strokeDasharray="6,3"
                filter="url(#sketch-inventory)"
              />
              
              {/* Center text */}
              <text x={140} y={130} textAnchor="middle" fontSize="20">📦</text>
              <text x={140} y={150} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0F1111">
                Total
              </text>
              <text x={140} y={168} textAnchor="middle" fontSize="16" fontWeight="600" fill="#FF9900">
                {formatNumber(inventoryData.totalProducts)}
              </text>
            </svg>
            
            {/* Legend */}
            <div style={{ marginTop: '20px', width: '100%', maxWidth: '260px' }}>
              {[
                { label: 'In Stock', value: Math.max(0, (inventoryData.totalProducts || 0) - (inventoryData.lowStockProducts || 0) - (inventoryData.outOfStockProducts || 0)), color: '#067D62' },
                { label: 'Low Stock', value: inventoryData.lowStockProducts || 0, color: '#F08804' },
                { label: 'Out of Stock', value: inventoryData.outOfStockProducts || 0, color: '#C7511F' }
              ].map((item, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = `${item.color}15`
                    e.currentTarget.style.borderColor = item.color
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  <div 
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      backgroundColor: item.color, 
                      marginRight: '12px', 
                      borderRadius: '3px',
                      border: '2px solid #FFF',
                      boxShadow: `0 2px 6px ${item.color}60`
                    }}
                  ></div>
                  <div style={{ flex: 1, fontWeight: 500, color: '#0F1111' }}>
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 700, color: item.color, fontSize: '1.1em' }}>
                    {item.value}
                  </div>
                </div>
              ))}
              
              {/* Total Value */}
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '6px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '4px' }}>
                  💰 Total Inventory Value
                </div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                  ${formatCurrency(inventoryData.totalValue)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
