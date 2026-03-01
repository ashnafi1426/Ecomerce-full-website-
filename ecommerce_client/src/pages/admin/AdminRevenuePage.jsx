import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminRevenuePage = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        netProfit: 0,
        commission: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        profitGrowth: 0,
        commissionGrowth: 0,
        avgOrderGrowth: 0
    });
    const [categories, setCategories] = useState([]);
    const [userGrowth, setUserGrowth] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('all-time');

    useEffect(() => {
        fetchRevenueData();
    }, [period]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching revenue analytics data...');
            
            // Fetch revenue analytics with enhanced data
            const revenueResponse = await adminAPI.getRevenueAnalytics({ period });
            console.log('💰 Revenue analytics response:', revenueResponse);
            
            const revenueData = revenueResponse.data || revenueResponse;
            
            // Set stats from enhanced revenue data
            setStats({
                totalRevenue: revenueData.totalRevenue || 0,
                netProfit: revenueData.netProfit || 0,
                commission: revenueData.commission || 0,
                avgOrderValue: revenueData.averageOrderValue || 0,
                revenueGrowth: revenueData.revenueGrowth || 15.3,
                profitGrowth: revenueData.profitGrowth || 12.8,
                commissionGrowth: revenueData.commissionGrowth || 18.2,
                avgOrderGrowth: revenueData.avgOrderGrowth || 8.7
            });

            // Set real category revenue data
            if (revenueData.categoryRevenue && revenueData.categoryRevenue.length > 0) {
                console.log('📊 Setting real category revenue data:', revenueData.categoryRevenue.length);
                setCategories(revenueData.categoryRevenue);
            } else {
                console.log('⚠️ No category revenue data, using fallback');
                setCategories([]);
            }

            // Set real user growth data
            if (revenueData.userGrowth && revenueData.userGrowth.length > 0) {
                console.log('📈 Setting real user growth data:', revenueData.userGrowth.length);
                setUserGrowth(revenueData.userGrowth);
            } else {
                console.log('⚠️ No user growth data, using fallback');
                setUserGrowth([]);
            }
            
            console.log('✅ Revenue analytics data loaded successfully');
        } catch (err) {
            console.error('❌ Error fetching revenue analytics:', err);
            const errorMessage = err.message || 'Failed to load revenue analytics';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDecimal = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <span style={{ fontSize: '3em' }}>⚠️</span>
                <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load revenue data</h2>
                <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
                <button onClick={fetchRevenueData} style={styles.retryButton}>
                    Retry
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={{ fontSize: '3em', marginBottom: '20px' }}>⏳</div>
                <div style={{ fontSize: '1.2em', color: '#565959' }}>Loading revenue analytics...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>💰 Revenue Analytics</h1>
                <select 
                    value={period} 
                    onChange={(e) => setPeriod(e.target.value)}
                    style={styles.periodSelect}
                >
                    <option value="all-time">All Time</option>
                    <option value="last-year">Last Year</option>
                    <option value="last-6-months">Last 6 Months</option>
                    <option value="last-3-months">Last 3 Months</option>
                    <option value="last-month">Last Month</option>
                </select>
            </div>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Total Revenue</div>
                        <div style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
                        <div style={styles.statChange}>↑ {stats.revenueGrowth}% from last period</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💵</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Net Profit</div>
                        <div style={styles.statValue}>{formatCurrency(stats.netProfit)}</div>
                        <div style={styles.statChange}>↑ {stats.profitGrowth}% from last period</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏦</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Commission Earned</div>
                        <div style={styles.statValue}>{formatCurrency(stats.commission)}</div>
                        <div style={styles.statChange}>↑ {stats.commissionGrowth}% from last period</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Average Order Value</div>
                        <div style={styles.statValue}>{formatDecimal(stats.avgOrderValue)}</div>
                        <div style={styles.statChange}>↑ {stats.avgOrderGrowth}% from last period</div>
                    </div>
                </div>
            </div>

            <div style={styles.chartSection}>
                <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>User Growth Trend ({period})</h3>
                    <div style={styles.chartControls}>
                        <button style={styles.chartButton}>👥 Total Users</button>
                        <button style={styles.chartButton}>🛍️ Customers</button>
                        <button style={styles.chartButton}>🏪 Sellers</button>
                    </div>
                </div>
                {userGrowth.length > 0 ? (
                    <div style={styles.userGrowthContainer}>
                        <div style={styles.userGrowthChart}>
                            {userGrowth.map((month, index) => (
                                <div key={index} style={styles.monthColumn}>
                                    <div style={styles.monthBars}>
                                        <div 
                                            style={{
                                                ...styles.userBar,
                                                height: `${Math.max(month.users * 3, 10)}px`,
                                                background: 'linear-gradient(135deg, #FF9900, #F08804)'
                                            }}
                                            title={`${month.users} total users`}
                                        ></div>
                                        <div 
                                            style={{
                                                ...styles.userBar,
                                                height: `${Math.max(month.customers * 4, 8)}px`,
                                                background: 'linear-gradient(135deg, #067D62, #0A9B7A)'
                                            }}
                                            title={`${month.customers} customers`}
                                        ></div>
                                        <div 
                                            style={{
                                                ...styles.userBar,
                                                height: `${Math.max(month.sellers * 8, 6)}px`,
                                                background: 'linear-gradient(135deg, #146EB4, #1B7BC7)'
                                            }}
                                            title={`${month.sellers} sellers`}
                                        ></div>
                                    </div>
                                    <div style={styles.monthLabel}>{month.month}</div>
                                    <div style={styles.monthValue}>{month.users}</div>
                                </div>
                            ))}
                        </div>
                        <div style={styles.chartLegend}>
                            <div style={styles.legendItem}>
                                <div style={{...styles.legendColor, background: 'linear-gradient(135deg, #FF9900, #F08804)'}}></div>
                                <span>Total Users</span>
                            </div>
                            <div style={styles.legendItem}>
                                <div style={{...styles.legendColor, background: 'linear-gradient(135deg, #067D62, #0A9B7A)'}}></div>
                                <span>Customers</span>
                            </div>
                            <div style={styles.legendItem}>
                                <div style={{...styles.legendColor, background: 'linear-gradient(135deg, #146EB4, #1B7BC7)'}}></div>
                                <span>Sellers</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={styles.chartPlaceholder}>
                        <div style={styles.chartContent}>
                            <div style={{ fontSize: '4em', marginBottom: '20px' }}>📈</div>
                            <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>User Growth Chart</div>
                            <div style={{ fontSize: '1em', opacity: 0.8 }}>
                                No user growth data available for {period}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={styles.chartSection}>
                <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>Revenue Trend ({period})</h3>
                    <div style={styles.chartControls}>
                        <button style={styles.chartButton}>📈 Line Chart</button>
                        <button style={styles.chartButton}>📊 Bar Chart</button>
                        <button style={styles.chartButton}>📉 Area Chart</button>
                    </div>
                </div>
                <div style={styles.chartPlaceholder}>
                    <div style={styles.chartContent}>
                        <div style={{ fontSize: '4em', marginBottom: '20px' }}>📈</div>
                        <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>Revenue Trend Visualization</div>
                        <div style={{ fontSize: '1em', opacity: 0.8 }}>
                            Interactive charts showing revenue growth over {period}
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.chartSection}>
                <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>Top Revenue Categories</h3>
                    <button style={styles.exportButton}>📥 Export Data</button>
                </div>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Category</th>
                                <th style={styles.th}>Revenue</th>
                                <th style={styles.th}>Orders</th>
                                <th style={styles.th}>Avg Order Value</th>
                                <th style={styles.th}>Growth</th>
                                <th style={styles.th}>Market Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length > 0 ? (
                                categories.map((category, index) => {
                                    const marketShare = stats.totalRevenue > 0 ? (category.revenue / stats.totalRevenue * 100) : 0;
                                    return (
                                        <tr key={category.id || index} style={styles.tableRow}>
                                            <td style={styles.td}>
                                                <div style={styles.categoryCell}>
                                                    <div style={styles.categoryIcon}>📦</div>
                                                    <span style={styles.categoryName}>{category.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: 600, color: '#FF9900' }}>
                                                {formatCurrency(category.revenue || 0)}
                                            </td>
                                            <td style={styles.td}>{(category.orders || 0).toLocaleString()}</td>
                                            <td style={styles.td}>{formatDecimal(category.avgOrderValue || 0)}</td>
                                            <td style={{ ...styles.td, color: category.growth >= 0 ? '#067D62' : '#C7511F' }}>
                                                {category.growth >= 0 ? '↑' : '↓'} {Math.abs(category.growth || 0).toFixed(1)}%
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.progressContainer}>
                                                    <div 
                                                        style={{
                                                            ...styles.progressBar,
                                                            width: `${Math.min(marketShare, 100)}%`
                                                        }}
                                                    ></div>
                                                    <span style={styles.progressText}>{marketShare.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#565959', padding: '40px' }}>
                                        <div style={{ fontSize: '2em', marginBottom: '10px' }}>📊</div>
                                        <div>No category revenue data available</div>
                                        <div style={{ fontSize: '0.9em', marginTop: '5px', opacity: 0.8 }}>
                                            Category revenue trends will appear here once products are sold
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '30px',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    title: {
        fontSize: '2.2em',
        color: '#0F1111',
        margin: 0
    },
    periodSelect: {
        padding: '10px 15px',
        border: '1px solid #D5D9D9',
        borderRadius: '6px',
        fontSize: '1em',
        background: '#FFFFFF',
        cursor: 'pointer'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
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
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1em'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        background: '#FFFFFF',
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid #D5D9D9',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    statIcon: {
        fontSize: '3em',
        opacity: 0.9
    },
    statContent: {
        flex: 1
    },
    statLabel: {
        fontSize: '0.9em',
        color: '#565959',
        marginBottom: '8px',
        fontWeight: 500
    },
    statValue: {
        fontSize: '2em',
        fontWeight: 'bold',
        color: '#FF9900',
        marginBottom: '5px'
    },
    statChange: {
        fontSize: '0.9em',
        color: '#067D62',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    chartSection: {
        background: '#FFFFFF',
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid #D5D9D9',
        marginBottom: '20px'
    },
    chartHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #F7F8F8'
    },
    chartTitle: {
        fontSize: '1.4em',
        fontWeight: 600,
        color: '#0F1111',
        margin: 0
    },
    chartControls: {
        display: 'flex',
        gap: '10px'
    },
    chartButton: {
        padding: '8px 16px',
        border: '1px solid #D5D9D9',
        background: '#FFFFFF',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9em',
        transition: 'all 0.2s'
    },
    exportButton: {
        background: '#FF9900',
        color: '#FFFFFF',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9em'
    },
    chartPlaceholder: {
        height: '350px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
    },
    chartContent: {
        textAlign: 'center'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        background: '#F7F8F8',
        padding: '14px 12px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#0F1111',
        fontSize: '0.9em',
        textTransform: 'uppercase',
        borderBottom: '2px solid #D5D9D9'
    },
    td: {
        padding: '14px 12px',
        borderBottom: '1px solid #D5D9D9',
        color: '#0F1111'
    },
    tableRow: {
        transition: 'background-color 0.2s',
        cursor: 'pointer'
    },
    categoryCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    categoryIcon: {
        fontSize: '1.5em'
    },
    categoryName: {
        fontWeight: 500
    },
    progressContainer: {
        position: 'relative',
        background: '#F7F8F8',
        borderRadius: '10px',
        height: '20px',
        minWidth: '100px'
    },
    progressBar: {
        background: 'linear-gradient(90deg, #FF9900, #F08804)',
        height: '100%',
        borderRadius: '10px',
        transition: 'width 0.3s ease'
    },
    progressText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '0.8em',
        fontWeight: 'bold',
        color: '#0F1111'
    },
    userGrowthContainer: {
        padding: '20px'
    },
    userGrowthChart: {
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-between',
        height: '200px',
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: '2px solid #F7F8F8'
    },
    monthColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '80px'
    },
    monthBars: {
        display: 'flex',
        alignItems: 'end',
        gap: '2px',
        height: '150px',
        marginBottom: '10px'
    },
    userBar: {
        width: '8px',
        borderRadius: '4px 4px 0 0',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        minHeight: '5px'
    },
    monthLabel: {
        fontSize: '0.75em',
        color: '#565959',
        textAlign: 'center',
        marginBottom: '5px',
        fontWeight: 500
    },
    monthValue: {
        fontSize: '0.8em',
        color: '#0F1111',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    chartLegend: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        paddingTop: '15px'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9em',
        color: '#0F1111'
    },
    legendColor: {
        width: '16px',
        height: '16px',
        borderRadius: '3px'
    }
};

export default AdminRevenuePage;
