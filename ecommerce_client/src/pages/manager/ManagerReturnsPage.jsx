import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

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
const fmtFull = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

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

// Reject replacement
const RejectModal = ({ item, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
    try {
      setSubmitting(true);
      await managerAPI.rejectReplacement(item.id, reason.trim());
      toast.success('Replacement request rejected');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="✕ Reject Replacement" onClose={onClose}>
      <p style={{ color: '#565959', marginBottom: 14, fontSize: '0.9em' }}>
        Replacement #{item.id?.slice(0, 8)}... – {REASON_LABELS[item.reason_category] || item.reason_category}
      </p>
      <form onSubmit={handleSubmit}>
        <label style={labelSt}>Rejection Reason *</label>
        <textarea
          style={{ ...inputSt, height: 90, resize: 'vertical' }}
          placeholder="Please provide a clear reason..."
          value={reason} onChange={e => setReason(e.target.value)} required
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ ...primaryBtn, background: '#C7511F' }}>
            {submitting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Detail View
const DetailModal = ({ item, onClose }) => (
  <Modal title="📋 Replacement Details" onClose={onClose} maxW={560}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 14 }}>
      {[
        ['Request ID', item.id?.slice(0, 16) + '...'],
        ['Order ID', item.order_id?.slice(0, 16) + '...'],
        ['Product', item.product?.title || '—'],
        ['Quantity', item.quantity],
        ['Status', <Badge key="s" status={item.status} />],
        ['Customer', item.customer?.full_name || item.customer?.email || '—'],
        ['Seller', item.seller?.full_name || item.seller?.email || '—'],
        ['Reason', REASON_LABELS[item.reason_category] || item.reason_category],
        ['Requested', fmtFull(item.created_at)],
        ['Reviewed', fmtFull(item.reviewed_at)],
      ].map(([k, v]) => (
        <div key={k}>
          <div style={{ fontSize: '0.78em', color: '#565959', marginBottom: 2 }}>{k}</div>
          <div style={{ fontWeight: 500, color: '#0F1111', fontSize: '0.9em' }}>{v ?? '—'}</div>
        </div>
      ))}
    </div>

    <div style={{ background: '#F7F8F8', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: '0.88em', color: '#565959' }}>
      <strong style={{ color: '#0F1111' }}>Description: </strong>{item.reason_description}
    </div>

    {item.rejection_reason && (
      <div style={{ background: '#FFF4F4', border: '1px solid #FFD5D5', borderRadius: 6, padding: '10px 14px', fontSize: '0.88em' }}>
        <strong style={{ color: '#C7511F' }}>Rejection Reason: </strong>
        <span style={{ color: '#565959' }}>{item.rejection_reason}</span>
      </div>
    )}

    {item.shipment && (
      <div style={{ marginTop: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '0.95em' }}>📦 Shipment Info</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '0.88em' }}>
          {[
            ['Tracking', item.shipment.tracking_number || '—'],
            ['Carrier', item.shipment.carrier || '—'],
            ['Shipped', fmt(item.shipment.shipped_at)],
            ['Est. Delivery', fmt(item.shipment.estimated_delivery)],
            ['Delivered', fmt(item.shipment.delivered_at)],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ color: '#565959' }}>{k}: </span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>
    )}
  </Modal>
);

// ─── Main Page ────────────────────────────────────────────────────────────
const ManagerReturnsPage = () => {
  const [replacements, setReplacements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [activeTab, setActiveTab] = useState('list');

  // Modals
  const [rejectModal, setRejectModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [repRes, anaRes] = await Promise.allSettled([
        managerAPI.getReplacements(),
        managerAPI.getReplacementAnalytics()
      ]);
      if (repRes.status === 'fulfilled') {
        const d = repRes.value;
        setReplacements(d?.data || d?.replacements || (Array.isArray(d) ? d : []));
      }
      if (anaRes.status === 'fulfilled') {
        setAnalytics(anaRes.value?.data || anaRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to load replacement requests');
      toast.error('Failed to load replacements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this replacement request?')) return;
    try {
      await managerAPI.approveReplacement(id);
      toast.success('Replacement approved!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
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
    rejected:  replacements.filter(r => r.status === 'rejected').length,
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

  return (
    <div>
      {/* Modals */}
      {rejectModal && <RejectModal item={rejectModal} onClose={() => setRejectModal(null)} onSuccess={fetchData} />}
      {detailModal && <DetailModal item={detailModal} onClose={() => setDetailModal(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 4 }}>🔄 Replacement Requests</h1>
        <p style={{ color: '#565959' }}>Review, approve and track product replacement requests</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 26 }}>
        {[
          { label: 'Total', value: stats.total, color: '#0F1111' },
          { label: 'Pending', value: stats.pending, color: '#F08804' },
          { label: 'Approved', value: stats.approved, color: '#067D62' },
          { label: 'Shipped', value: stats.shipped, color: '#146EB4' },
          { label: 'Completed', value: stats.completed, color: '#067D62' },
          { label: 'Rejected', value: stats.rejected, color: '#C7511F' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.83em', color: '#565959', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #D5D9D9', marginBottom: 20 }}>
        {[{ key: 'list', label: '📋 All Requests' }, { key: 'analytics', label: '📊 Analytics' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontWeight: activeTab === t.key ? 700 : 400,
            color: activeTab === t.key ? '#FF9900' : '#565959',
            borderBottom: activeTab === t.key ? '3px solid #FF9900' : '3px solid transparent', marginBottom: -2
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── LIST TAB ────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8 }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid #D5D9D9', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
              placeholder="Search by ID, customer..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
            <select
              style={{ padding: '8px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
              value={filters.status}
              onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={fetchData} style={{ background: '#F7F8F8', border: '1px solid #D5D9D9', padding: '8px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
              🔄 Refresh
            </button>
          </div>

          {error ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: '3em', marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#C7511F', marginBottom: 16 }}>{error}</p>
              <button onClick={fetchData} style={{ background: '#FF9900', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: '3em', marginBottom: 12 }}>✅</div>
              <h3 style={{ marginBottom: 6 }}>No replacement requests found</h3>
              <p style={{ color: '#565959' }}>No requests match your current filters</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F7F8F8' }}>
                  <tr>
                    {['ID', 'Customer', 'Product', 'Qty', 'Reason', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.88em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #D5D9D9' }}>
                      <td style={tdSt}><code style={{ fontSize: '0.82em' }}>#{r.id?.slice(0, 8)}</code></td>
                      <td style={tdSt}>{r.customer?.full_name || r.customer?.email || r.customer_id?.slice(0, 8) || '—'}</td>
                      <td style={tdSt}>{r.product?.title || r.product_id?.slice(0, 8) || '—'}</td>
                      <td style={tdSt}>{r.quantity}</td>
                      <td style={tdSt}><span style={{ fontSize: '0.85em' }}>{REASON_LABELS[r.reason_category] || r.reason_category}</span></td>
                      <td style={tdSt}><Badge status={r.status} /></td>
                      <td style={{ ...tdSt, fontSize: '0.82em', whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                      <td style={tdSt}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => setDetailModal(r)} style={smBtn}>View</button>
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(r.id)} style={{ ...smBtn, background: '#E6F4F1', color: '#067D62', borderColor: '#067D62' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => setRejectModal(r)} style={{ ...smBtn, background: '#FFE5E5', color: '#C7511F', borderColor: '#C7511F' }}>
                                ✕ Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div>
          {!analytics ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#565959' }}>
              Analytics data not available
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              <ACard title="Overview">
                <AR label="Total Requests" value={analytics.total_requests || 0} />
                <AR label="Pending" value={analytics.pending_count || 0} />
                <AR label="Approved" value={analytics.approved_count || 0} />
                <AR label="Completed" value={analytics.completed_count || 0} />
                <AR label="Rejected" value={analytics.rejected_count || 0} />
                <AR label="Approval Rate" value={`${analytics.approval_rate || 0}%`} />
              </ACard>
              <ACard title="Common Reasons">
                {analytics.common_reasons && Object.entries(analytics.common_reasons).map(([k, v]) => (
                  <AR key={k} label={REASON_LABELS[k] || k} value={v} />
                ))}
              </ACard>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ACard = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8, padding: 20 }}>
    <h3 style={{ margin: '0 0 14px', fontSize: '0.98em', fontWeight: 700 }}>{title}</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
  </div>
);
const AR = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
    <span style={{ color: '#565959' }}>{label}</span>
    <strong style={{ color: '#0F1111' }}>{value}</strong>
  </div>
);

// Shared
const tdSt = { padding: '12px 14px', color: '#0F1111', verticalAlign: 'middle' };
const smBtn = { padding: '5px 11px', border: '1px solid #D5D9D9', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: '0.82em', whiteSpace: 'nowrap' };
const labelSt = { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: '0.9em', color: '#0F1111' };
const inputSt = { width: '100%', padding: '9px 12px', border: '1px solid #D5D9D9', borderRadius: 5, fontSize: '0.95em', boxSizing: 'border-box' };
const cancelBtn = { background: '#fff', border: '1px solid #D5D9D9', padding: '9px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const primaryBtn = { background: '#FF9900', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 };

export default ManagerReturnsPage;
