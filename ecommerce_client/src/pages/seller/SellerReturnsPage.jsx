import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

// ─── Helpers ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:   { bg: '#FFF4E5', color: '#F08804' },
  approved:  { bg: '#E6F4F1', color: '#067D62' },
  shipped:   { bg: '#E7F3FF', color: '#146EB4' },
  completed: { bg: '#E6F4F1', color: '#067D62' },
  rejected:  { bg: '#FFE5E5', color: '#C7511F' },
  cancelled: { bg: '#F7F8F8', color: '#565959' },
};

const REASON_LABELS = {
  defective_product: 'Defective Product',
  wrong_item:        'Wrong Item Received',
  damaged_shipping:  'Damaged in Shipping',
  missing_parts:     'Missing Parts',
  other:             'Other'
};

const Badge = ({ status }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] || STATUS_STYLE.pending;
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: '0.82em', background: s.bg, color: s.color }}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ─── Modal ────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, maxW = 500 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: maxW, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #D5D9D9' }}>
        <h3 style={{ margin: 0, fontSize: '1.05em' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#565959' }}>✕</button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

// Shipment Update Modal
const ShipmentModal = ({ item, onClose, onSuccess }) => {
  const existing = item.shipment || {};
  const [form, setForm] = useState({
    tracking_number: existing.tracking_number || '',
    carrier: existing.carrier || '',
    estimated_delivery: existing.estimated_delivery ? existing.estimated_delivery.split('T')[0] : '',
    notes: existing.notes || '',
    delivered_at: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const CARRIERS = ['FedEx', 'UPS', 'USPS', 'DHL', 'Amazon Logistics', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        tracking_number: form.tracking_number || null,
        carrier: form.carrier || null,
        estimated_delivery: form.estimated_delivery ? new Date(form.estimated_delivery).toISOString() : null,
        notes: form.notes || null,
        delivered_at: form.delivered_at ? new Date(form.delivered_at).toISOString() : null,
      };
      await sellerAPI.updateReplacementShipment(item.id, payload);
      toast.success('Shipment updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update shipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="📦 Update Replacement Shipment" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Tracking Number</label>
          <input style={inputSt} placeholder="e.g. 1Z999AA10123456784" value={form.tracking_number} onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Carrier</label>
          <select style={inputSt} value={form.carrier} onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))}>
            <option value="">Select carrier...</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Estimated Delivery</label>
          <input style={inputSt} type="date" value={form.estimated_delivery} onChange={e => setForm(p => ({ ...p, estimated_delivery: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Delivered At (if delivered)</label>
          <input style={inputSt} type="date" value={form.delivered_at} onChange={e => setForm(p => ({ ...p, delivered_at: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Notes</label>
          <textarea style={{ ...inputSt, height: 60, resize: 'vertical' }} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} style={primaryBtn}>
            {submitting ? 'Saving...' : 'Save Shipment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Detail view
const DetailModal = ({ item, onClose }) => (
  <Modal title="📋 Replacement Details" onClose={onClose} maxW={560}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 14 }}>
      {[
        ['Request ID', '#' + item.id?.slice(0, 8)],
        ['Order ID', item.order_id?.slice(0, 8) + '...'],
        ['Product', item.product?.title || '—'],
        ['Quantity', item.quantity],
        ['Status', <Badge key="s" status={item.status} />],
        ['Customer', item.customer?.full_name || item.customer?.email || '—'],
        ['Reason', REASON_LABELS[item.reason_category] || item.reason_category],
        ['Requested', fmt(item.created_at)],
        ['Return Tracking', item.return_tracking_number || '—'],
        ['Return Received', fmt(item.return_received_at)],
      ].map(([k, v]) => (
        <div key={k}>
          <div style={{ fontSize: '0.78em', color: '#565959', marginBottom: 2 }}>{k}</div>
          <div style={{ fontWeight: 500, color: '#0F1111', fontSize: '0.9em' }}>{v ?? '—'}</div>
        </div>
      ))}
    </div>
    <div style={{ background: '#F7F8F8', borderRadius: 6, padding: '10px 14px', fontSize: '0.88em', color: '#565959', marginBottom: 12 }}>
      <strong style={{ color: '#0F1111' }}>Description: </strong>{item.reason_description}
    </div>
    {item.rejection_reason && (
      <div style={{ background: '#FFF4F4', border: '1px solid #FFD5D5', borderRadius: 6, padding: '10px 14px', fontSize: '0.88em' }}>
        <strong style={{ color: '#C7511F' }}>Rejection: </strong>
        <span style={{ color: '#565959' }}>{item.rejection_reason}</span>
      </div>
    )}
  </Modal>
);

// ─── Main Page ────────────────────────────────────────────────────────────
const SellerReturnsPage = () => {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  // Modals
  const [shipmentModal, setShipmentModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sellerAPI.getReplacements();
      const d = res?.data || res?.replacements || (Array.isArray(res) ? res : []);
      setReplacements(d);
    } catch (err) {
      setError(err.message || 'Failed to load replacement requests');
      toast.error('Failed to load replacements');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturn = async (id) => {
    if (!window.confirm('Confirm that you have received the returned item?')) return;
    try {
      await sellerAPI.confirmReturnReceived(id);
      toast.success('Return confirmed! Replacement can now be shipped.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm return');
    }
  };

  const filtered = replacements.filter(r => {
    const matchStatus = filters.status === 'all' || r.status === filters.status;
    const q = filters.search.toLowerCase();
    const matchSearch = !q ||
      r.id?.toLowerCase().includes(q) ||
      r.order_id?.toLowerCase().includes(q) ||
      r.customer?.full_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total:     replacements.length,
    pending:   replacements.filter(r => r.status === 'pending').length,
    approved:  replacements.filter(r => r.status === 'approved').length,
    shipped:   replacements.filter(r => r.status === 'shipped').length,
    completed: replacements.filter(r => r.status === 'completed').length,
  };

  if (loading && replacements.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '3em', marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#565959' }}>Loading replacement requests...</p>
        </div>
      </div>
    );
  }

  if (error && replacements.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '3em', marginBottom: 12 }}>⚠️</div>
        <h2 style={{ marginBottom: 8 }}>Failed to load replacements</h2>
        <p style={{ color: '#565959', marginBottom: 20 }}>{error}</p>
        <button onClick={fetchData} style={primaryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 24px' }}>
      {/* Modals */}
      {shipmentModal && <ShipmentModal item={shipmentModal} onClose={() => setShipmentModal(null)} onSuccess={fetchData} />}
      {detailModal   && <DetailModal   item={detailModal}   onClose={() => setDetailModal(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 4 }}>Returns & Replacements</h1>
        <p style={{ color: '#565959' }}>Manage customer replacement requests and shipments</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 26 }}>
        {[
          { label: 'Total', value: stats.total, color: '#0F1111' },
          { label: 'Pending Approval', value: stats.pending, color: '#F08804' },
          { label: 'To Ship', value: stats.approved, color: '#146EB4' },
          { label: 'Shipped', value: stats.shipped, color: '#067D62' },
          { label: 'Completed', value: stats.completed, color: '#067D62' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.83em', color: '#565959', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: 220, padding: '9px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
          placeholder="Search by ID or customer..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
        />
        <select
          style={{ padding: '9px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved (To Ship)</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={fetchData} style={{ background: '#F7F8F8', border: '1px solid #D5D9D9', padding: '9px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8, overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: '3em', marginBottom: 12 }}>📦</div>
            <h3 style={{ marginBottom: 6 }}>No replacement requests</h3>
            <p style={{ color: '#565959' }}>No requests match your current filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F7F8F8' }}>
              <tr>
                {['Request ID', 'Customer', 'Product', 'Qty', 'Reason', 'Return Tracking', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.87em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #D5D9D9' }}>
                  <td style={tdSt}><code style={{ fontSize: '0.82em' }}>#{r.id?.slice(0, 8)}</code></td>
                  <td style={tdSt}>{r.customer?.full_name || r.customer?.email || '—'}</td>
                  <td style={tdSt}>{r.product?.title || '—'}</td>
                  <td style={tdSt}>{r.quantity}</td>
                  <td style={tdSt}><span style={{ fontSize: '0.85em' }}>{REASON_LABELS[r.reason_category] || r.reason_category}</span></td>
                  <td style={tdSt}>
                    {r.return_tracking_number ? (
                      <span style={{ fontSize: '0.82em', background: '#E7F3FF', color: '#146EB4', padding: '2px 8px', borderRadius: 4 }}>
                        {r.return_tracking_number}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={tdSt}><Badge status={r.status} /></td>
                  <td style={{ ...tdSt, fontSize: '0.82em', whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetailModal(r)} style={smBtn}>View</button>
                      {(r.status === 'approved' || r.status === 'shipped') && (
                        <button onClick={() => setShipmentModal(r)} style={{ ...smBtn, background: '#E7F3FF', color: '#146EB4', borderColor: '#146EB4' }}>
                          📦 Shipment
                        </button>
                      )}
                      {r.status === 'approved' && r.return_tracking_number && !r.return_received_at && (
                        <button onClick={() => handleConfirmReturn(r.id)} style={{ ...smBtn, background: '#E6F4F1', color: '#067D62', borderColor: '#067D62' }}>
                          ✓ Received
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Policy section */}
      <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 10, padding: 24, marginTop: 24 }}>
        <h2 style={{ fontSize: '1.2em', fontWeight: 700, marginBottom: 16 }}>📋 Replacement Policy Guidelines</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '📅', title: '30-Day Window', desc: 'Customers must request within 30 days of delivery' },
            { icon: '📦', title: 'Ship Promptly', desc: 'Ship approved replacements within 3 business days' },
            { icon: '✅', title: 'Confirm Return', desc: 'Confirm receipt of returned items before shipping replacement' },
            { icon: '🔢', title: 'Track Everything', desc: 'Always provide tracking numbers for replacement shipments' },
          ].map(p => (
            <div key={p.title} style={{ background: '#F7F8F8', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '1.8em', marginBottom: 8 }}>{p.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95em' }}>{p.title}</h3>
              <p style={{ margin: 0, color: '#565959', fontSize: '0.85em' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Shared styles
const tdSt = { padding: '12px 14px', color: '#0F1111', verticalAlign: 'middle' };
const smBtn = { padding: '5px 11px', border: '1px solid #D5D9D9', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: '0.82em', whiteSpace: 'nowrap' };
const labelSt = { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: '0.9em', color: '#0F1111' };
const inputSt = { width: '100%', padding: '9px 12px', border: '1px solid #D5D9D9', borderRadius: 5, fontSize: '0.95em', boxSizing: 'border-box' };
const cancelBtn = { background: '#fff', border: '1px solid #D5D9D9', padding: '9px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const primaryBtn = { background: '#FF9900', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 };

export default SellerReturnsPage;
