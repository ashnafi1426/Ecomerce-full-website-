const Pagination = ({ pagination, onPageChange, onPageSizeChange }) => {
    const { currentPage, totalPages, totalCount, limit, hasNext, hasPrev } = pagination;

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisible = 7;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const startItem = ((currentPage - 1) * limit) + 1;
    const endItem = Math.min(currentPage * limit, totalCount);

    return (
        <div className="pagination-container">
            <style>{`
                .pagination-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    background: #FAFAFA;
                    border-top: 1px solid #D5D9D9;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .pagination-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: #565959;
                    font-size: 0.9em;
                }
                
                .page-size-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .page-size-select {
                    padding: 6px 8px;
                    border: 1px solid #D5D9D9;
                    border-radius: 4px;
                    font-size: 0.9em;
                    background: #FFFFFF;
                    cursor: pointer;
                }
                
                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .pagination-nav {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .page-btn {
                    padding: 8px 12px;
                    border: 1px solid #D5D9D9;
                    background: #FFFFFF;
                    color: #0F1111;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    min-width: 40px;
                    text-align: center;
                }
                
                .page-btn:hover:not(:disabled) {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                }
                
                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #F7F8F8;
                }
                
                .page-btn.active {
                    background: #FF9900;
                    color: #FFFFFF;
                    border-color: #FF9900;
                }
                
                .page-btn.ellipsis {
                    border: none;
                    background: transparent;
                    cursor: default;
                    color: #565959;
                }
                
                .nav-btn {
                    padding: 8px 16px;
                    border: 1px solid #D5D9D9;
                    background: #FFFFFF;
                    color: #0F1111;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .nav-btn:hover:not(:disabled) {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                }
                
                .nav-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #F7F8F8;
                }
                
                .results-summary {
                    font-weight: 500;
                    color: #0F1111;
                }
                
                @media (max-width: 768px) {
                    .pagination-container {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    
                    .pagination-info {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    
                    .pagination-controls {
                        justify-content: center;
                    }
                    
                    .pagination-nav {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .page-btn,
                    .nav-btn {
                        padding: 6px 10px;
                        font-size: 0.8em;
                    }
                }
                
                @media (max-width: 480px) {
                    .pagination-nav {
                        gap: 2px;
                    }
                    
                    .page-btn {
                        min-width: 32px;
                        padding: 6px 8px;
                    }
                }
            `}</style>

            <div className="pagination-info">
                <div className="results-summary">
                    Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalCount.toLocaleString()} users
                </div>
                
                <div className="page-size-selector">
                    <span>Show:</span>
                    <select
                        className="page-size-select"
                        value={limit}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                    <span>per page</span>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className="nav-btn"
                        onClick={() => onPageChange(1)}
                        disabled={!hasPrev}
                    >
                        ⏮️ First
                    </button>
                    
                    <button
                        className="nav-btn"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!hasPrev}
                    >
                        ◀️ Previous
                    </button>

                    <div className="pagination-nav">
                        {generatePageNumbers().map((page, index) => (
                            <button
                                key={index}
                                className={`page-btn ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
                                onClick={() => typeof page === 'number' && onPageChange(page)}
                                disabled={page === '...'}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className="nav-btn"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!hasNext}
                    >
                        Next ▶️
                    </button>
                    
                    <button
                        className="nav-btn"
                        onClick={() => onPageChange(totalPages)}
                        disabled={!hasNext}
                    >
                        Last ⏭️
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pagination;