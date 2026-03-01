import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api.service';

// ─── Helpers ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:    { bg: '#FFF4E5', color: '#F08804' },
  approved:   { bg: '#E6F4F1', color: '#067D62' },
  rejected:   { bg: '#FFE5E5', color: '#C7511F' },
  processing: { bg: '#E7F3FF', color: '#146EB4' },
  completed:  { bg: '#E6F4F1', color: '#067D62' },
  goodwill:   { bg: '#F3E8FF', color: '#6B21A8' },
};

const Badge = ({ status }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] || STATUS_STYLE.pending;
  return (
    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '0.82em', background: s.bg, color: s.color }}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const fmtAmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const fmt = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

// ─── Modal ────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, maxW = 480 }) => (
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

// Partial Refund
const PartialModal = ({ refund, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const max = parseFloat(refund?.refund_amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > max) { toast.error(`Amount must be 0.01 – ${fmtAmt(max)}`); return; }
    try {
      setSubmitting(true);
      await adminAPI.processPartialRefund(refund.id, { amount: amt, reason });
      toast.success('Partial refund processed!');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); } finally { setSubmitting(false); }
  };

  return (
    <Modal title="½ Process Partial Refund" onClose={onClose}>
      <p style={{ color: '#565959', marginBottom: 14, fontSize: '0.9em' }}>Requested: <strong>{fmtAmt(max)}</strong></p>
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Amount ($) *</label>
        <input style={inp} type="number" min="0.01" max={max} step="0.01" placeholder={`Max: ${fmtAmt(max)}`} value={amount} onChange={e => setAmount(e.target.value)} required />
        <label style={{ ...lbl, marginTop: 12 }}>Reason</label>
        <textarea style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Why partial?" value={reason} onChange={e => setReason(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ ...primaryBtn, background: '#146EB4' }}>{submitting ? 'Processing...' : 'Process Partial'}</button>
        </div>
      </form>
    </Modal>
  );
};

// Reject
const RejectModal = ({ refund, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    try {
      setSubmitting(true);
      await adminAPI.rejectRefund(refund.id, reason.trim());
      toast.success('Refund rejected');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); } finally { setSubmitting(false); }
  };

  return (
    <Modal title="✕ Reject Refund" onClose={onClose}>
      <p style={{ color: '#565959', marginBottom: 14, fontSize: '0.9em' }}>
        #{refund.id?.slice(0, 8)}... – {fmtAmt(refund.refund_amount)}
      </p>
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Rejection Reason *</label>
        <textarea style={{ ...inp, height: 90, resize: 'vertical' }} placeholder="Provide a clear reason..." value={reason} onChange={e => setReason(e.target.value)} required />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ ...primaryBtn, background: '#C7511F' }}>{submitting ? 'Rejecting...' : 'Reject'}</button>
        </div>
      </form>
    </Modal>
  );
};

// Goodwill
const GoodwillModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ order_id: '', amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.amount || !form.reason) { toast.error('All fields required'); return; }
    try {
      setSubmitting(true);
      await adminAPI.issueGoodwillRefund({ ...form, amount: parseFloat(form.amount) });
      toast.success('Goodwill refund issued!');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); } finally { setSubmitting(false); }
  };

  return (
    <Modal title="🎁 Issue Goodwill Refund" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Order ID *</label>
        <input style={inp} placeholder="Order UUID" value={form.order_id} onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))} required />
        <label style={{ ...lbl, marginTop: 12 }}>Amount ($) *</label>
        <input style={inp} type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
        <label style={{ ...lbl, marginTop: 12 }}>Reason *</label>
        <textarea style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Why is this goodwill refund being issued?" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ ...primaryBtn, background: '#6B21A8' }}>{submitting ? 'Issuing...' : 'Issue Goodwill'}</button>
        </div>
      </form>
    </Modal>
  );
};

// Detail
const DetailModal = ({ refund, onClose }) => (
  <Modal title="📄 Refund Details" onClose={onClose} maxW={520}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.91em' }}>
      {[
        ['Refund ID', refund.id],
        ['Order ID', refund.order_id],
        ['Amount', fmtAmt(refund.refund_amount)],
        ['Type', refund.refund_type?.charAt(0).toUpperCase() + refund.refund_type?.slice(1)],
        ['Reason', refund.reason_category?.replace(/_/g, ' ')],
        ['Status', <Badge key="s" status={refund.status} />],
        ['Customer', refund.customers?.display_name || refund.customer_id?.slice(0, 8) || '—'],
        ['Seller', refund.sellers?.display_name || refund.seller_id?.slice(0, 8) || '—'],
        ['Requested', fmt(refund.created_at)],
        ['Reviewed By', refund.reviewers?.display_name || refund.reviewed_by?.slice(0, 8) || '—'],
        ['Processed', fmt(refund.processed_at)],
        ['Commission Adj.', fmtAmt(refund.commission_adjustment)],
        ['Seller Deduction', fmtAmt(refund.seller_deduction)],
        ['Rejection Reason', refund.rejection_reason || '—'],
      ].map(([k, v]) => (
        <tr key={k} style={{ borderBottom: '1px solid #F0F0F0' }}>
          <td style={{ padding: '7px 6px', fontWeight: 600, color: '#565959', whiteSpace: 'nowrap' }}>{k}</td>
          <td style={{ padding: '7px 6px', color: '#0F1111' }}>{v ?? '—'}</td>
        </tr>
      ))}
    </table>
    {refund.reason_description && (
      <div style={{ background: '#F7F8F8', borderRadius: 6, padding: '10px 14px', marginTop: 14, fontSize: '0.88em', color: '#565959' }}>
        <strong>Note: </strong>{refund.reason_description}
      </div>
    )}
  </Modal>
);

// ─── Main Page ────────────────────────────────────────────────────────────
const AdminRefundsPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '', dateRange: '30days' });
  const [activeTab, setActiveTab] = useState('list');

  // Modals
  const [partialModal, setPartialModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [goodwillModal, setGoodwillModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [refRes, anaRes] = await Promise.allSettled([
        adminAPI.getRefunds(),
        adminAPI.getRefundAnalytics()
      ]);
      if (refRes.status === 'fulfilled') {
        const d = refRes.value;
        setRefunds(d?.data || d?.refunds || (Array.isArray(d) ? d : []));
      }
      if (anaRes.status === 'fulfilled') {
        setAnalytics(anaRes.value?.data || anaRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to load refunds');
      toast.error('Failed to load refunds');
    } finally { setLoading(false); }
  };

  const handleApproveFull = async (refund) => {
    if (!window.confirm(`Approve full refund of ${fmtAmt(refund.refund_amount)}?`)) return;
    try {
      await adminAPI.approveRefund(refund.id);
      toast.success('Full refund approved!');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const filtered = refunds.filter(r => {
    const matchStatus = filters.status === 'all' || r.status === filters.status;
    const q = filters.search.toLowerCase();
    const matchSearch = !q || r.id?.toLowerCase().includes(q) || r.order_id?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalRefunded: refunds.filter(r => r.status === 'approved').reduce((s, r) => s + parseFloat(r.refund_amount || 0), 0)
  };

  if (loading && refunds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '3em', marginBottom: 16 }}>⏳</div>
        <p style={{ color: '#565959', fontSize: '1.1em' }}>Loading refunds...</p>
      </div>
    );
  }

  if (error && refunds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '3em', marginBottom: 16 }}>❌</div>
        <p style={{ color: '#C7511F', fontSize: '1.1em', marginBottom: 20 }}>{error}</p>
        <button onClick={fetchData} style={{ background: '#FF9900', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Modals */}
      {partialModal  && <PartialModal  refund={partialModal}  onClose={() => setPartialModal(null)}  onSuccess={fetchData} />}
      {rejectModal   && <RejectModal   refund={rejectModal}   onClose={() => setRejectModal(null)}   onSuccess={fetchData} />}
      {goodwillModal && <GoodwillModal onClose={() => setGoodwillModal(false)} onSuccess={fetchData} />}
      {detailModal   && <DetailModal   refund={detailModal}   onClose={() => setDetailModal(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 4 }}>Refund Management</h1>
          <p style={{ color: '#565959' }}>Process and manage all customer refund requests</p>
        </div>
        <button onClick={() => setGoodwillModal(true)} style={{ background: '#6B21A8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 7, fontWeight: 700, cursor: 'pointer' }}>
          🎁 Issue Goodwill Refund
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Requests', value: stats.total, color: '#0F1111' },
          { label: 'Pending', value: stats.pending, color: '#F08804' },
          { label: 'Approved', value: stats.approved, color: '#067D62' },
          { label: 'Rejected', value: stats.rejected, color: '#C7511F' },
          { label: 'Total Refunded', value: fmtAmt(stats.totalRefunded), color: '#146EB4' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.85em', color: '#565959', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #D5D9D9', marginBottom: 20 }}>
        {[{ key: 'list', label: '📋 Refund Requests' }, { key: 'analytics', label: '📊 Analytics' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontWeight: activeTab === t.key ? 700 : 400,
            color: activeTab === t.key ? '#FF9900' : '#565959',
            borderBottom: activeTab === t.key ? '3px solid #FF9900' : '3px solid transparent', marginBottom: -2
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── LIST TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid #D5D9D9', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
              placeholder="Search by refund or order ID..."
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
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
            </select>
            <select
              style={{ padding: '8px 12px', border: '1px solid #D5D9D9', borderRadius: 5 }}
              value={filters.dateRange}
              onChange={e => setFilters(p => ({ ...p, dateRange: e.target.value }))}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <button onClick={fetchData} style={{ background: '#F7F8F8', border: '1px solid #D5D9D9', padding: '8px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
              🔄 Refresh
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '3em', marginBottom: 12 }}>💰</div>
                <h3 style={{ marginBottom: 6 }}>No refunds found</h3>
                <p style={{ color: '#565959' }}>No refund requests match your filters</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F7F8F8' }}>
                  <tr>
                    {['Refund ID', 'Order ID', 'Customer', 'Amount', 'Type', 'Reason', 'Status', 'Requested', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.87em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #D5D9D9' }}>
                      <td style={tdSt}><code style={{ fontSize: '0.8em' }}>#{r.id?.slice(0, 8)}</code></td>
                      <td style={tdSt}><code style={{ fontSize: '0.8em' }}>#{r.order_id?.slice(0, 8)}</code></td>
                      <td style={tdSt}>{r.customers?.display_name || r.customer_name || r.customer_id?.slice(0, 8) || 'N/A'}</td>
                      <td style={{ ...tdSt, fontWeight: 700 }}>{fmtAmt(r.refund_amount)}</td>
                      <td style={tdSt}><span style={{ fontSize: '0.82em', textTransform: 'capitalize' }}>{r.refund_type || 'standard'}</span></td>
                      <td style={tdSt}><span style={{ fontSize: '0.82em' }}>{r.reason_category?.replace(/_/g, ' ') || '—'}</span></td>
                      <td style={tdSt}><Badge status={r.status} /></td>
                      <td style={{ ...tdSt, fontSize: '0.82em', whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                      <td style={tdSt}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button onClick={() => setDetailModal(r)} style={smBtn}>View</button>
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveFull(r)} style={{ ...smBtn, background: '#E6F4F1', color: '#067D62', borderColor: '#067D62' }}>
                                ✓ Full
                              </button>
                              <button onClick={() => setPartialModal(r)} style={{ ...smBtn, background: '#E7F3FF', color: '#146EB4', borderColor: '#146EB4' }}>
                                ½ Partial
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
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div>
          {!analytics ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#565959' }}>Analytics data not available</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <ACard title="📊 Overview">
                <AR label="Total Refunds" value={analytics.totalRefunds || 0} />
                <AR label="Total Amount" value={fmtAmt(analytics.totalAmount)} />
                <AR label="Avg Refund Amount" value={fmtAmt(analytics.avgRefundAmount)} />
                <AR label="Avg Processing Days" value={analytics.avgProcessingTimeDays?.toFixed(1) || '—'} />
              </ACard>
              <ACard title="📦 By Type">
                <AR label="Full Refunds"    value={analytics.refundsByType?.full || 0} />
                <AR label="Partial Refunds" value={analytics.refundsByType?.partial || 0} />
                <AR label="Goodwill"        value={analytics.refundsByType?.goodwill || 0} />
              </ACard>
              <ACard title="📋 Reason Distribution">
                {analytics.reasonDistribution && Object.entries(analytics.reasonDistribution).map(([k, v]) => (
                  <AR key={k} label={k.replace(/_/g, ' ')} value={v} />
                ))}
              </ACard>
              {analytics.sellerRefunds && Object.keys(analytics.sellerRefunds).length > 0 && (
                <ACard title="🏪 Top Sellers by Refunds">
                  {Object.entries(analytics.sellerRefunds).slice(0, 8).map(([id, data]) => (
                    <AR key={id} label={id.slice(0, 8) + '...'} value={`${data.count} / ${fmtAmt(data.amount)}`} />
                  ))}
                </ACard>
              )}
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
    <span style={{ color: '#565959', textTransform: 'capitalize' }}>{label}</span>
    <strong style={{ color: '#0F1111' }}>{value}</strong>
  </div>
);

// Shared styles
const tdSt = { padding: '12px 14px', color: '#0F1111', verticalAlign: 'middle' };
const smBtn = { padding: '5px 10px', border: '1px solid #D5D9D9', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: '0.8em', whiteSpace: 'nowrap' };
const lbl = { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: '0.9em', color: '#0F1111' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #D5D9D9', borderRadius: 5, fontSize: '0.95em', boxSizing: 'border-box' };
const cancelBtn = { background: '#fff', border: '1px solid #D5D9D9', padding: '9px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const primaryBtn = { background: '#FF9900', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 };

export default AdminRefundsPage;
