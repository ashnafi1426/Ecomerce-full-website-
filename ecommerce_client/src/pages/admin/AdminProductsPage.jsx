import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        active: 0,
        pendingApproval: 0,
        outOfStock: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        status: 'all',
        seller: 'all'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 50,
        totalPages: 1,
        totalCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [filters, pagination.currentPage, pagination.pageSize]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔍 Fetching products with filters:', filters, 'page:', pagination.currentPage);
            
            const params = {
                ...filters,
                limit: pagination.pageSize,
                offset: (pagination.currentPage - 1) * pagination.pageSize
            };
            
            const data = await adminAPI.getProducts(params);
            console.log('✅ Products fetched successfully:', data);
            
            // Handle the response structure
            setProducts(data.products || []);
            if (data.stats) {
                setStats(data.stats);
            }
            
            // Update pagination info
            if (data.stats && data.stats.totalProducts) {
                setPagination(prev => ({
                    ...prev,
                    totalCount: data.stats.totalProducts,
                    totalPages: Math.ceil(data.stats.totalProducts / prev.pageSize)
                }));
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            const errorMessage = error.message || 'Failed to load products';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'active') return 'badge-active';
        if (statusLower === 'pending') return 'badge-pending';
        if (statusLower === 'rejected') return 'badge-rejected';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({
            ...prev,
            pageSize: parseInt(newSize),
            currentPage: 1,
            totalPages: Math.ceil(prev.totalCount / parseInt(newSize))
        }));
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                console.log('🗑️ Deleting product:', productId);
                await adminAPI.deleteProduct(productId);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error('❌ Delete product error:', error);
                toast.error(error.message || 'Failed to delete product');
            }
        }
    };

    const handleApprove = async (productId) => {
        try {
            console.log('✅ Approving product:', productId);
            await adminAPI.approveProduct(productId);
            toast.success('Product approved successfully');
            fetchProducts();
        } catch (error) {
            console.error('❌ Approve product error:', error);
            toast.error(error.message || 'Failed to approve product');
        }
    };

    const handleReject = async (productId) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            try {
                console.log('❌ Rejecting product:', productId, 'Reason:', reason);
                await adminAPI.rejectProduct(productId, reason);
                toast.success('Product rejected');
                fetchProducts();
            } catch (error) {
                console.error('❌ Reject product error:', error);
                toast.error(error.message || 'Failed to reject product');
            }
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            console.log('📥 Starting PDF export...');
            
            // Show loading toast
            toast.info('Preparing export...', { autoClose: 2000 });
            
            // Fetch ALL products (no pagination limit)
            console.log('Fetching all products for export...');
            const allProductsData = await adminAPI.getProducts({
                ...filters,
                limit: 10000, // Large limit instead of null
                offset: 0
            });
            
            const allProducts = allProductsData.products || [];
            console.log(`✅ Fetched ${allProducts.length} products for export`);
            
            if (allProducts.length === 0) {
                toast.warning('No products to export');
                setExporting(false);
                return;
            }

            toast.info(`Generating PDF with ${allProducts.length} products...`, { autoClose: 2000 });

            // Create new PDF document
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Add title
            doc.setFontSize(18);
            doc.setTextColor(255, 153, 0);
            doc.text('FastShop - Products Export', 14, 15);
            
            // Add export info
            doc.setFontSize(10);
            doc.setTextColor(86, 89, 89);
            doc.text(`Export Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);
            doc.text(`Total Products: ${allProducts.length}`, 14, 27);
            if (filters.status !== 'all') {
                doc.text(`Filter: Status = ${filters.status}`, 14, 32);
            }
            
            // Prepare table data
            const tableHeaders = [['#', 'Product Name', 'SKU', 'Seller', 'Price', 'Stock', 'Status']];
            
            const tableData = allProducts.map((product, index) => [
                index + 1,
                (product.name || product.title || '').substring(0, 40),
                product.sku || 'N/A',
                (product.sellerName || 'Unknown').substring(0, 25),
                `$${product.price?.toFixed(2) || '0.00'}`,
                product.stock || product.quantity || 0,
                (product.status || '').toUpperCase()
            ]);

            // Add table using autoTable
            autoTable(doc, {
                head: tableHeaders,
                body: tableData,
                startY: filters.status !== 'all' ? 37 : 32,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [255, 153, 0],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 70 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 50 },
                    4: { cellWidth: 25, halign: 'right' },
                    5: { cellWidth: 20, halign: 'center' },
                    6: { cellWidth: 25, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [247, 248, 248]
                }
            });

            // Add footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
                doc.text(
                    'FastShop Admin Portal',
                    14,
                    doc.internal.pageSize.getHeight() - 10
                );
            }

            // Save the PDF
            const filename = `products-export-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            toast.success(`✅ Exported ${allProducts.length} products successfully!`);
            console.log('✅ PDF Export completed:', allProducts.length, 'products');
        } catch (error) {
            console.error('❌ Export error:', error);
            console.error('Error details:', error.message, error.stack);
            toast.error(`Failed to export: ${error.message}`);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading products...</div>
            </div>
        );
    }

    return (
        <div className="admin-products-page">
            <style>{`
                h1 { font-size: 2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #D5D9D9; }
                .stat-value { font-size: 2.5em; font-weight: bold; color: #FF9900; }
                .stat-label { font-size: 0.9em; color: #565959; margin-top: 8px; }
                
                .section { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
                .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; }
                
                .filter-bar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .filter-bar input, .filter-bar select { padding: 8px 12px; border: 1px solid #D5D9D9; border-radius: 4px; }
                .filter-bar input { flex: 1; min-width: 250px; }
                .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                
                table { width: 100%; border-collapse: collapse; }
                th { background: #F7F8F8; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #D5D9D9; }
                
                .product-cell { display: flex; align-items: center; gap: 12px; }
                .product-thumb { width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; }
                
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
                .badge-active { background: #E6F4F1; color: #067D62; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                .badge-rejected { background: #FFE5E5; color: #C7511F; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; }
                .btn-sm:hover { background: #F7F8F8; }
                
                .pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding: 15px; background: #F7F8F8; border-radius: 8px; }
                .pagination-info { color: #565959; font-size: 0.9em; }
                .pagination-controls { display: flex; gap: 10px; align-items: center; }
                .pagination-btn { padding: 8px 16px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; font-weight: 500; }
                .pagination-btn:hover:not(:disabled) { background: #FF9900; color: #FFFFFF; border-color: #FF9900; }
                .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-btn.active { background: #FF9900; color: #FFFFFF; border-color: #FF9900; }
                .page-size-selector { padding: 8px; border: 1px solid #D5D9D9; border-radius: 4px; }
            `}</style>

            <h1>Product Management</h1>
            <p className="subtitle">Manage all products across the platform</p>

            {error && (
                <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalProducts.toLocaleString()}</div>
                    <div className="stat-label">Total Products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.active.toLocaleString()}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingApproval.toLocaleString()}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.outOfStock}</div>
                    <div className="stat-label">Out of Stock</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Products</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="home">Home & Garden</option>
                    </select>
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select value={filters.seller} onChange={(e) => handleFilterChange('seller', e.target.value)}>
                        <option value="all">All Sellers</option>
                    </select>
                    <button 
                        className="btn-primary" 
                        onClick={handleExport}
                        disabled={exporting || loading}
                    >
                        {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div className="product-cell">
                                        <div className="product-thumb">{product.icon || '📦'}</div>
                                        <span>{product.name}</span>
                                    </div>
                                </td>
                                <td>{product.sku}</td>
                                <td>{product.seller?.name || product.sellerName || 'Unknown'}</td>
                                <td>${product.price?.toFixed(2)}</td>
                                <td>{product.stock || product.quantity || 0}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(product.status)}`}>
                                        {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                                    </span>
                                </td>
                                <td>
                                    {product.status === 'pending' ? (
                                        <>
                                            <button className="btn-sm" onClick={() => handleApprove(product.id)}>Approve</button>
                                            <button className="btn-sm" onClick={() => handleReject(product.id)}>Reject</button>
                                        </>
                                    ) : (
                                        <>
                                            <Link to={`/admin/products/${product.id}`} className="btn-sm">View</Link>
                                            <button className="btn-sm" onClick={() => toast.success('Edit feature coming soon')}>Edit</button>
                                            <button className="btn-sm" onClick={() => handleDelete(product.id)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>📦</div>
                                    <div>No products found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {!loading && products.length > 0 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} products
                        </div>
                        <div className="pagination-controls">
                            <select 
                                className="page-size-selector"
                                value={pagination.pageSize}
                                onChange={(e) => handlePageSizeChange(e.target.value)}
                            >
                                <option value="25">25 per page</option>
                                <option value="50">50 per page</option>
                                <option value="100">100 per page</option>
                                <option value="200">200 per page</option>
                            </select>
                            
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.currentPage === 1}
                            >
                                ⏮ First
                            </button>
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                ← Prev
                            </button>
                            <span style={{padding: '0 10px', color: '#565959'}}>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                Next →
                            </button>
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                Last ⏭
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProductsPage;
