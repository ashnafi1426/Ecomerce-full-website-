import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { customerAPI } from '../../services/api.service'

const STATUS_COLORS = {
  pending:   { bg: '#FFF4E5', text: '#F08804' },
  approved:  { bg: '#E6F4F1', text: '#067D62' },
  shipped:   { bg: '#E7F3FF', text: '#146EB4' },
  completed: { bg: '#E6F4F1', text: '#067D62' },
  rejected:  { bg: '#FFE5E5', text: '#C7511F' },
  cancelled: { bg: '#F7F8F8', text: '#565959' },
}

const REASON_LABELS = {
  defective_product: 'Defective Product',
  wrong_item:        'Wrong Item Received',
  damaged_shipping:  'Damaged in Shipping',
  missing_parts:     'Missing Parts',
  other:             'Other'
}

// ─── Small reusable badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      background: c.bg, color: c.text, fontWeight: 700, fontSize: '0.82em'
    }}>
      {status?.toUpperCase()}
    </span>
  )
}

// ─── Request Replacement Modal ────────────────────────────────────────────
const RequestReplacementModal = ({ orders, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    order_id: '',
    product_id: '',
    variant_id: '',
    quantity: 1,
    reason_category: '',
    reason_description: '',
    images: []
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.order_id || !form.product_id || !form.reason_category || !form.reason_description) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      setSubmitting(true)
      await customerAPI.createReplacement(form)
      toast.success('Replacement request submitted successfully!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to submit replacement request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: '1.3em' }}>🔄 Request Replacement</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Order ID *</label>
            <input
              style={modalStyles.input}
              placeholder="e.g. order-uuid-here"
              value={form.order_id}
              onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))}
              required
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Product ID *</label>
            <input
              style={modalStyles.input}
              placeholder="e.g. product-uuid-here"
              value={form.product_id}
              onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}
              required
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Quantity</label>
            <input
              style={modalStyles.input}
              type="number" min="1"
              value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Reason *</label>
            <select
              style={modalStyles.input}
              value={form.reason_category}
              onChange={e => setForm(p => ({ ...p, reason_category: e.target.value }))}
              required
            >
              <option value="">Select reason...</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Description *</label>
            <textarea
              style={{ ...modalStyles.input, height: 80, resize: 'vertical' }}
              placeholder="Please describe the issue in detail..."
              value={form.reason_description}
              onChange={e => setForm(p => ({ ...p, reason_description: e.target.value }))}
              required
            />
          </div>
          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={modalStyles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Request Refund Modal ─────────────────────────────────────────────────
const RequestRefundModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    order_id: '',
    refund_amount: '',
    reason_category: '',
    reason_description: '',
    images: []
  })
  const [submitting, setSubmitting] = useState(false)

  const REFUND_REASONS = [
    'not_as_described', 'damaged_item', 'late_delivery',
    'missing_item', 'changed_mind', 'other'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.order_id || !form.refund_amount || !form.reason_category) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      setSubmitting(true)
      await customerAPI.createRefund({ ...form, refund_amount: parseFloat(form.refund_amount) })
      toast.success('Refund request submitted successfully!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to submit refund request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: '1.3em' }}>💰 Request Refund</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Order ID *</label>
            <input
              style={modalStyles.input}
              placeholder="e.g. order-uuid-here"
              value={form.order_id}
              onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))}
              required
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Refund Amount ($) *</label>
            <input
              style={modalStyles.input}
              type="number" min="0.01" step="0.01"
              placeholder="0.00"
              value={form.refund_amount}
              onChange={e => setForm(p => ({ ...p, refund_amount: e.target.value }))}
              required
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Reason *</label>
            <select
              style={modalStyles.input}
              value={form.reason_category}
              onChange={e => setForm(p => ({ ...p, reason_category: e.target.value }))}
              required
            >
              <option value="">Select reason...</option>
              {REFUND_REASONS.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Description</label>
            <textarea
              style={{ ...modalStyles.input, height: 80, resize: 'vertical' }}
              placeholder="Optional: provide additional details..."
              value={form.reason_description}
              onChange={e => setForm(p => ({ ...p, reason_description: e.target.value }))}
            />
          </div>
          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={modalStyles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Return Tracking Modal ────────────────────────────────────────────────
const ReturnTrackingModal = ({ replacementId, onClose, onSuccess }) => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number')
      return
    }
    try {
      setSubmitting(true)
      await customerAPI.updateReturnTracking(replacementId, trackingNumber.trim())
      toast.success('Return tracking number updated!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update tracking number')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.box, maxWidth: 420 }}>
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: '1.2em' }}>📦 Add Return Tracking</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <p style={{ color: '#565959', marginBottom: 16 }}>
            Enter the tracking number from your return shipment label.
          </p>
          <input
            style={modalStyles.input}
            placeholder="e.g. 1Z999AA10123456784"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            required
          />
          <div style={{ ...modalStyles.actions, marginTop: 16 }}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={modalStyles.submitBtn}>
              {submitting ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
const CustomerReturnsPage = () => {
  const [activeTab, setActiveTab] = useState('replacements')
  const [replacements, setReplacements] = useState([])
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [trackingModal, setTrackingModal] = useState(null) // replacementId

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [repRes, refRes] = await Promise.allSettled([
        customerAPI.getReplacements(),
        customerAPI.getRefunds()
      ])

      if (repRes.status === 'fulfilled') {
        const d = repRes.value
        setReplacements(d?.data || d?.replacements || (Array.isArray(d) ? d : []))
      }
      if (refRes.status === 'fulfilled') {
        const d = refRes.value
        setRefunds(d?.data || d?.refunds || (Array.isArray(d) ? d : []))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReplacement = async (id) => {
    if (!window.confirm('Cancel this replacement request?')) return
    try {
      await customerAPI.cancelReplacement(id)
      toast.success('Replacement request cancelled')
      fetchAll()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel')
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5em', marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#565959' }}>Loading your requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 20px' }}>
      {/* Modals */}
      {showReplacementModal && (
        <RequestReplacementModal
          onClose={() => setShowReplacementModal(false)}
          onSuccess={fetchAll}
        />
      )}
      {showRefundModal && (
        <RequestRefundModal
          onClose={() => setShowRefundModal(false)}
          onSuccess={fetchAll}
        />
      )}
      {trackingModal && (
        <ReturnTrackingModal
          replacementId={trackingModal}
          onClose={() => setTrackingModal(null)}
          onSuccess={fetchAll}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 6 }}>Returns & Refunds</h1>
        <p style={{ color: '#565959' }}>Manage your replacement and refund requests</p>
      </div>

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #D5D9D9', gap: 0 }}>
          {[
            { key: 'replacements', label: `🔄 Replacements (${replacements.length})` },
            { key: 'refunds',      label: `💰 Refunds (${refunds.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 22px', border: 'none', background: 'transparent',
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#FF9900' : '#565959',
                borderBottom: activeTab === tab.key ? '3px solid #FF9900' : '3px solid transparent',
                cursor: 'pointer', fontSize: '0.97em', marginBottom: -2
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowReplacementModal(true)} style={actionBtnStyle('#FF9900', '#fff')}>
            + New Replacement
          </button>
          <button onClick={() => setShowRefundModal(true)} style={actionBtnStyle('#fff', '#0F1111', '1px solid #D5D9D9')}>
            + New Refund
          </button>
        </div>
      </div>

      {/* ── REPLACEMENTS TAB ─────────────────────────────────────────── */}
      {activeTab === 'replacements' && (
        <div>
          {replacements.length === 0 ? (
            <EmptyState icon="🔄" title="No replacement requests" desc="You haven't requested any product replacements yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {replacements.map(rep => (
                <div key={rep.id} style={cardStyle}>
                  {/* Card Header */}
                  <div style={cardHeader}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05em' }}>
                        {rep.product?.title || 'Product'}
                      </div>
                      <div style={{ color: '#565959', fontSize: '0.85em', marginTop: 2 }}>
                        Replacement #{rep.id?.slice(0, 8)}... · Requested {fmt(rep.created_at)}
                      </div>
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>

                  {/* Details Grid */}
                  <div style={detailsGrid}>
                    <DetailRow label="Order ID" value={rep.order_id?.slice(0, 8) + '...'} />
                    <DetailRow label="Reason" value={REASON_LABELS[rep.reason_category] || rep.reason_category} />
                    <DetailRow label="Quantity" value={rep.quantity} />
                    <DetailRow label="Reviewed" value={rep.reviewed_at ? fmt(rep.reviewed_at) : 'Pending'} />
                    {rep.return_tracking_number && (
                      <DetailRow label="Return Tracking" value={rep.return_tracking_number} />
                    )}
                    {rep.shipment && (
                      <>
                        <DetailRow label="Replacement Tracking" value={rep.shipment.tracking_number || '—'} />
                        <DetailRow label="Carrier" value={rep.shipment.carrier || '—'} />
                        <DetailRow label="Est. Delivery" value={fmt(rep.shipment.estimated_delivery)} />
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ background: '#F7F8F8', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: '0.9em', color: '#565959' }}>
                    <strong style={{ color: '#0F1111' }}>Description: </strong>
                    {rep.reason_description}
                  </div>

                  {/* Rejection reason */}
                  {rep.rejection_reason && (
                    <div style={{ background: '#FFF4F4', border: '1px solid #FFD5D5', borderRadius: 6, padding: '10px 14px', marginTop: 8, fontSize: '0.9em' }}>
                      <strong style={{ color: '#C7511F' }}>Rejection Reason: </strong>
                      <span style={{ color: '#565959' }}>{rep.rejection_reason}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    {rep.status === 'approved' && !rep.return_tracking_number && (
                      <button
                        onClick={() => setTrackingModal(rep.id)}
                        style={actionBtnStyle('#FF9900', '#fff')}
                      >
                        📦 Add Return Tracking
                      </button>
                    )}
                    {rep.status === 'pending' && (
                      <button
                        onClick={() => handleCancelReplacement(rep.id)}
                        style={actionBtnStyle('#fff', '#C7511F', '1px solid #C7511F')}
                      >
                        ✕ Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REFUNDS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'refunds' && (
        <div>
          {refunds.length === 0 ? (
            <EmptyState icon="💰" title="No refund requests" desc="You haven't requested any refunds yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {refunds.map(ref => (
                <div key={ref.id} style={cardStyle}>
                  <div style={cardHeader}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05em' }}>
                        Refund #{ref.id?.slice(0, 8)}...
                      </div>
                      <div style={{ color: '#565959', fontSize: '0.85em', marginTop: 2 }}>
                        Requested {fmt(ref.created_at)} · Order {ref.order_id?.slice(0, 8)}...
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4em', fontWeight: 700, color: '#067D62' }}>
                        ${parseFloat(ref.refund_amount || 0).toFixed(2)}
                      </div>
                      <StatusBadge status={ref.status} />
                    </div>
                  </div>

                  <div style={detailsGrid}>
                    <DetailRow label="Type" value={(ref.refund_type || 'standard').replace(/\b\w/g, l => l.toUpperCase())} />
                    <DetailRow label="Reason" value={ref.reason_category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '—'} />
                    <DetailRow label="Original Amount" value={`$${parseFloat(ref.original_order_amount || 0).toFixed(2)}`} />
                    <DetailRow label="Processed" value={ref.processed_at ? fmt(ref.processed_at) : '—'} />
                  </div>

                  {ref.reason_description && (
                    <div style={{ background: '#F7F8F8', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: '0.9em', color: '#565959' }}>
                      <strong style={{ color: '#0F1111' }}>Note: </strong>
                      {ref.reason_description}
                    </div>
                  )}

                  {ref.rejection_reason && (
                    <div style={{ background: '#FFF4F4', border: '1px solid #FFD5D5', borderRadius: 6, padding: '10px 14px', marginTop: 8, fontSize: '0.9em' }}>
                      <strong style={{ color: '#C7511F' }}>Rejection Reason: </strong>
                      <span style={{ color: '#565959' }}>{ref.rejection_reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Helper sub-components & styles ───────────────────────────────────────
const EmptyState = ({ icon, title, desc }) => (
  <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: 10, padding: 60, textAlign: 'center' }}>
    <div style={{ fontSize: '4em', marginBottom: 12 }}>{icon}</div>
    <h3 style={{ fontSize: '1.3em', fontWeight: 600, marginBottom: 6 }}>{title}</h3>
    <p style={{ color: '#565959' }}>{desc}</p>
  </div>
)

const DetailRow = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '0.78em', color: '#565959', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: '0.9em', fontWeight: 500, color: '#0F1111' }}>{value ?? '—'}</div>
  </div>
)

const actionBtnStyle = (bg, color, border = 'none') => ({
  background: bg, color, border, padding: '8px 18px',
  borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em'
})

const cardStyle = {
  background: '#fff', border: '1px solid #D5D9D9', borderRadius: 10, padding: 20
}

const cardHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  paddingBottom: 14, borderBottom: '1px solid #F0F0F0', marginBottom: 14
}

const detailsGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '12px 20px'
}

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  box: {
    background: '#fff', borderRadius: 10, width: '100%', maxWidth: 520,
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #D5D9D9'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.2em',
    cursor: 'pointer', color: '#565959', padding: '0 4px'
  },
  field: { marginBottom: 14 },
  label: { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: '0.9em', color: '#0F1111' },
  input: {
    width: '100%', padding: '9px 12px', border: '1px solid #D5D9D9',
    borderRadius: 5, fontSize: '0.95em', boxSizing: 'border-box'
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    background: '#fff', border: '1px solid #D5D9D9', padding: '9px 20px',
    borderRadius: 6, cursor: 'pointer', fontWeight: 600
  },
  submitBtn: {
    background: '#FF9900', color: '#fff', border: 'none', padding: '9px 24px',
    borderRadius: 6, cursor: 'pointer', fontWeight: 700
  }
}

export default CustomerReturnsPage
