import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'addSub'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_id: null
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getCategories();
            setCategories(response.categories || response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            const errorMessage = error.message || 'Failed to load categories';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedCategory(null);
        setFormData({ name: '', description: '', parent_id: null });
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id
        });
        setShowModal(true);
    };

    const openAddSubModal = (parentCategory) => {
        setModalMode('addSub');
        setSelectedCategory(parentCategory);
        setFormData({ name: '', description: '', parent_id: parentCategory.id });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
        setFormData({ name: '', description: '', parent_id: null });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            if (modalMode === 'edit') {
                await adminAPI.updateCategory(selectedCategory.id, formData);
                toast.success('Category updated successfully');
            } else {
                await adminAPI.createCategory(formData);
                toast.success('Category created successfully');
            }
            closeModal();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await adminAPI.deleteCategory(categoryId);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading categories...</div>
            </div>
        );
    }

    if (error && categories.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchCategories} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-categories-page">
            <style>{`
                h1 { font-size: 2.2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; font-size: 1.05em; }
                
                .section { background: #FFFFFF; padding: 25px; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
                .section-title { font-size: 1.4em; font-weight: 600; }
                .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; transition: all 0.2s; }
                .btn-primary:hover { background: #F08804; }
                
                .category-tree { padding-left: 0; }
                .category-item { margin-bottom: 10px; }
                .category-main { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #F7F8F8; border-radius: 8px; border: 2px solid #D5D9D9; transition: all 0.2s; }
                .category-main:hover { border-color: #FF9900; }
                .category-info { display: flex; align-items: center; gap: 15px; }
                .category-icon { font-size: 2em; }
                .category-name { font-size: 1.1em; font-weight: 600; }
                .category-stats { display: flex; gap: 20px; font-size: 0.9em; color: #565959; }
                .category-actions { display: flex; gap: 8px; }
                .btn-sm { padding: 6px 14px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; font-size: 0.85em; text-decoration: none; color: #0F1111; transition: all 0.2s; }
                .btn-sm:hover { background: #F7F8F8; }
                .btn-delete { color: #C7511F; border-color: #C7511F; }
                .btn-delete:hover { background: #FEE; }
                
                .subcategories { margin-left: 40px; margin-top: 10px; }
                .subcategory-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #FFFFFF; border: 1px solid #D5D9D9; border-radius: 6px; margin-bottom: 8px; }
                .subcategory-item:hover { background: #F7F8F8; }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
                .modal-title { font-size: 1.5em; font-weight: 600; }
                .modal-close { background: none; border: none; font-size: 1.5em; cursor: pointer; color: #565959; }
                .modal-close:hover { color: #0F1111; }
                .form-group { margin-bottom: 20px; }
                .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #0F1111; }
                .form-input { width: 100%; padding: 10px; border: 1px solid #D5D9D9; border-radius: 6px; font-size: 1em; }
                .form-input:focus { outline: none; border-color: #FF9900; }
                .form-textarea { width: 100%; padding: 10px; border: 1px solid #D5D9D9; border-radius: 6px; font-size: 1em; min-height: 100px; resize: vertical; }
                .form-textarea:focus { outline: none; border-color: #FF9900; }
                .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; }
                .btn-secondary { background: #FFFFFF; color: #0F1111; border: 1px solid #D5D9D9; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                .btn-secondary:hover { background: #F7F8F8; }
            `}</style>

            <h1>Category Management</h1>
            <p className="subtitle">Organize and manage product categories</p>

            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">All Categories</h2>
                    <button className="btn-primary" onClick={openCreateModal}>+ Add Category</button>
                </div>

                <div className="category-tree">
                    {categories.length > 0 ? categories.map((category) => (
                        <div key={category.id} className="category-item">
                            <div className="category-main">
                                <div className="category-info">
                                    <div className="category-icon">{category.icon}</div>
                                    <div>
                                        <div className="category-name">{category.name}</div>
                                        <div className="category-stats">
                                            <span>{category.productCount.toLocaleString()} Products</span>
                                            <span>{category.subcategoryCount} Subcategories</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="category-actions">
                                    <button className="btn-sm" onClick={() => openEditModal(category)}>Edit</button>
                                    <button className="btn-sm" onClick={() => openAddSubModal(category)}>Add Sub</button>
                                    <button className="btn-sm btn-delete" onClick={() => handleDelete(category.id, category.name)}>Delete</button>
                                </div>
                            </div>
                            {category.subcategories && category.subcategories.length > 0 && (
                                <div className="subcategories">
                                    {category.subcategories.map((sub) => (
                                        <div key={sub.id} className="subcategory-item">
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{sub.name}</div>
                                                <div style={{ fontSize: '0.85em', color: '#565959' }}>
                                                    {sub.productCount.toLocaleString()} products
                                                </div>
                                            </div>
                                            <div className="category-actions">
                                                <button className="btn-sm" onClick={() => openEditModal(sub)}>Edit</button>
                                                <button className="btn-sm btn-delete" onClick={() => handleDelete(sub.id, sub.name)}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                            <div style={{fontSize: '2em', marginBottom: '10px'}}>📂</div>
                            <div>No categories found</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalMode === 'create' && 'Create New Category'}
                                {modalMode === 'edit' && 'Edit Category'}
                                {modalMode === 'addSub' && `Add Subcategory to ${selectedCategory?.name}`}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter category name"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter category description (optional)"
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {modalMode === 'edit' ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoriesPage;
