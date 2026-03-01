import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';

const AdminOrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/orders/${orderId}`);
            setOrder(response.data.data || response.data.order || mockOrder);
        } catch (error) {
            console.error('Error fetching order detail:', error);
            setOrder(mockOrder);
        } finally {
            setLoading(false);
        }
    };

    const mockOrder = {
        id: 'ORD-12345',
        status: 'delivered',
        customer: {
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1 234 567 8900'
        },
        seller: {
            name: 'TechStore Pro',
            email: 'contact@techstore.com'
        },
        items: [
            {
                id: 1,
                name: 'Premium Wireless Headphones',
                quantity: 1,
                price: 79.99,
                icon: '🎧'
            }
        ],
        shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
        },
        payment: {
            method: 'Credit Card',
            transactionId: 'TXN-12345',
            status: 'completed'
        },
        subtotal: 79.99,
        tax: 6.40,
        shipping: 5.99,
        total: 92.38,
        orderDate: '2026-02-08T14:30:00',
        deliveredDate: '2026-02-09T10:15:00'
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'delivered') return 'badge-delivered';
        if (statusLower === 'processing' || statusLower === 'pending') return 'badge-processing';
        if (statusLower === 'cancelled') return 'badge-cancelled';
        if (statusLower === 'shipped') return 'badge-shipped';
        return 'badge-processing';
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading order details...</div>;
    }

    if (!order) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Order not found</div>;
    }

    return (
        <div className="admin-order-detail-page">
            <style>{`
                h1 { font-size: 2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; }
                
                .back-link { display: inline-flex; align-items: center; gap: 8px; color: #146EB4; text-decoration: none; margin-bottom: 20px; }
                .back-link:hover { text-decoration: underline; }
                
                .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                
                .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; font-weight: bold; }
                .badge-delivered { background: #E6F4F1; color: #067D62; }
                .badge-processing { background: #FFF4E5; color: #F08804; }
                .badge-cancelled { background: #FFE5E5; color: #C7511F; }
                .badge-shipped { background: #E7F3FF; color: #146EB4; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .section { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
                .section-title { font-size: 1.2em; font-weight: 600; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #F7F8F8; }
                
                .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F7F8F8; }
                .info-label { color: #565959; font-weight: 500; }
                .info-value { font-weight: 600; }
                
                .item-row { display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid #F7F8F8; }
                .item-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2em; }
                .item-details { flex: 1; }
                .item-name { font-weight: 600; margin-bottom: 5px; }
                .item-price { color: #565959; }
                
                .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 1.1em; }
                .total-row.grand { font-size: 1.3em; font-weight: bold; color: #FF9900; border-top: 2px solid #D5D9D9; padding-top: 15px; margin-top: 10px; }
                
                @media (max-width: 768px) {
                    .grid-2 { grid-template-columns: 1fr; }
                }
            `}</style>

            <Link to="/admin/orders" className="back-link">
                ← Back to Orders
            </Link>

            <div className="order-header">
                <div>
                    <h1>Order {order.id}</h1>
                    <p className="subtitle">
                        Placed on {new Date(order.orderDate).toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </div>

            <div className="grid-2">
                <div className="section">
                    <h2 className="section-title">Customer Information</h2>
                    <div className="info-row">
                        <span className="info-label">Name</span>
                        <span className="info-value">{order.customer.name}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{order.customer.email}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{order.customer.phone}</span>
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">Seller Information</h2>
                    <div className="info-row">
                        <span className="info-label">Store Name</span>
                        <span className="info-value">{order.seller.name}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{order.seller.email}</span>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="section">
                    <h2 className="section-title">Shipping Address</h2>
                    <div style={{ lineHeight: '1.8' }}>
                        <div>{order.shippingAddress.street}</div>
                        <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                        <div>{order.shippingAddress.country}</div>
                    </div>
                </div>

                <div className="section">
                    <h2 className="section-title">Payment Information</h2>
                    <div className="info-row">
                        <span className="info-label">Method</span>
                        <span className="info-value">{order.payment.method}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Transaction ID</span>
                        <span className="info-value">{order.payment.transactionId}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Status</span>
                        <span className="info-value" style={{ color: '#067D62' }}>
                            {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">Order Items</h2>
                {order.items.map((item) => (
                    <div key={item.id} className="item-row">
                        <div className="item-icon">{item.icon}</div>
                        <div className="item-details">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">Quantity: {item.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '1.1em' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="section">
                <h2 className="section-title">Order Summary</h2>
                <div className="total-row">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="total-row">
                    <span>Shipping</span>
                    <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="total-row grand">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
