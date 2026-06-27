'use client'

import { useEffect, useState } from 'react'
import { Coins, Trash2 } from 'lucide-react'

interface Voucher {
  id: string
  voucherCode: string
  holderName: string
  holderPhone: string | null
  initialAmount: number
  balance: number
  status: string
  expiresAt: string
  createdAt: string
  partner: { name: string }
}

interface Partner {
  id: string
  name: string
}

interface AdjustForm {
  voucherCode: string
  holderName: string
  balance: number
  initialAmount: number
}

interface DeleteTarget {
  id: string
  voucherCode: string
  holderName: string
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [adjustVoucher, setAdjustVoucher] = useState<AdjustForm | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [reason, setReason] = useState('')
  const [adjustSaving, setAdjustSaving] = useState(false)
  const [adjustError, setAdjustError] = useState('')
  const [adjustSuccess, setAdjustSuccess] = useState('')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => { fetchPartners() }, [])
  useEffect(() => { fetchVouchers() }, [page, partnerId, status])

  function getToken() { return localStorage.getItem('token') || '' }

  async function fetchVouchers(s = search) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        search: s, partnerId, status,
      })
      const res = await fetch(`/api/vouchers?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) {
        setVouchers(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchPartners() {
    const res = await fetch('/api/partners', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (res.ok) setPartners(data)
  }

  async function handleAdjust() {
    if (!adjustVoucher) return
    setAdjustError('')
    setAdjustSuccess('')

    const amt = parseInt(String(adjustAmount).replace(/\D/g, ''))
    if (isNaN(amt) || amt <= 0) { setAdjustError('Số tiền không hợp lệ'); return }
    if (!reason.trim()) { setAdjustError('Vui lòng nhập lý do'); return }

    const finalAmount = adjustType === 'add' ? amt : -amt

    setAdjustSaving(true)
    try {
      const res = await fetch(`/api/vouchers/${adjustVoucher.voucherCode}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ adjustAmount: finalAmount, reason }),
      })
      const data = await res.json()
      if (!res.ok) { setAdjustError(data.error); return }
      setAdjustSuccess(`✅ ${data.message} — Số dư mới: ${data.balanceAfter.toLocaleString('vi-VN')}đ`)
      setTimeout(() => {
        setAdjustVoucher(null)
        setAdjustAmount('')
        setReason('')
        setAdjustSuccess('')
        fetchVouchers()
      }, 2000)
    } finally {
      setAdjustSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleteConfirmText !== 'XÓA') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/vouchers/${deleteTarget.voucherCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error); return }
      setDeleteTarget(null)
      setDeleteConfirmText('')
      fetchVouchers()
    } catch {
      setDeleteError('Lỗi kết nối server')
    } finally {
      setDeleteLoading(false)
    }
  }

  function formatMoney(n: number) {
    return n.toLocaleString('vi-VN') + 'đ'
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Còn hạn', EXPIRED: 'Hết hạn',
    DISABLED: 'Đã khóa', USED: 'Đã dùng hết',
  }

  const statusColor: Record<string, { bg: string, text: string }> = {
    ACTIVE: { bg: '#f0fdf4', text: '#16a34a' },
    EXPIRED: { bg: '#fef9c3', text: '#a16207' },
    DISABLED: { bg: '#fef2f2', text: '#dc2626' },
    USED: { bg: '#f3f4f6', text: '#6b7280' },
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Danh Sách Thẻ</h1>
        <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {total} thẻ</p>
      </div>

      {/* Modal điều chỉnh số dư */}
      {adjustVoucher && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 460, width: '90%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Điều chỉnh số dư thẻ
            </h3>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
              {adjustVoucher.voucherCode} — {adjustVoucher.holderName}
            </p>

            <div style={{ background: '#f8f7f5', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#999' }}>Số dư hiện tại</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#E8440A' }}>
                  {adjustVoucher.balance.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 13, color: '#999' }}>Giá trị ban đầu</span>
                <span style={{ fontSize: 13, color: '#666' }}>
                  {adjustVoucher.initialAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Loại điều chỉnh</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setAdjustType('add')} style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                    border: '2px solid ' + (adjustType === 'add' ? '#16a34a' : '#eee'),
                    background: adjustType === 'add' ? '#f0fdf4' : 'white',
                    color: adjustType === 'add' ? '#16a34a' : '#666', cursor: 'pointer',
                  }}>➕ Hoàn tiền (cộng thêm)</button>
                  <button onClick={() => setAdjustType('subtract')} style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                    border: '2px solid ' + (adjustType === 'subtract' ? '#dc2626' : '#eee'),
                    background: adjustType === 'subtract' ? '#fef2f2' : 'white',
                    color: adjustType === 'subtract' ? '#dc2626' : '#666', cursor: 'pointer',
                  }}>➖ Trừ thêm</button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Số tiền điều chỉnh</label>
                <input
                  value={adjustAmount}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setAdjustAmount(raw ? parseInt(raw).toLocaleString('vi-VN') : '')
                  }}
                  placeholder="Nhập số tiền..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Lý do điều chỉnh <span style={{ color: '#E8440A' }}>*</span></label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="VD: Hoàn tiền do thu nhầm ngày 30/5 tại CH57"
                  style={inputStyle}
                />
              </div>
            </div>

            {adjustError && (
              <div style={{ background: '#fff1f0', color: '#cf1322', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12 }}>
                ⚠️ {adjustError}
              </div>
            )}
            {adjustSuccess && (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12, fontWeight: 600 }}>
                {adjustSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleAdjust} disabled={adjustSaving} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                background: '#E8440A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14,
              }}>
                {adjustSaving ? 'Đang xử lý...' : 'Xác nhận điều chỉnh'}
              </button>
              <button onClick={() => {
                setAdjustVoucher(null)
                setAdjustAmount('')
                setReason('')
                setAdjustError('')
              }} style={{
                padding: '12px 20px', borderRadius: 10, border: '1px solid #eee',
                background: 'white', color: '#666', fontWeight: 600, cursor: 'pointer',
              }}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa thẻ */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 440, width: '90%' }}>
            {/* Icon cảnh báo */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#fef2f2', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
              Xóa thẻ này?
            </h3>
            <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 }}>
              Thao tác này sẽ xóa vĩnh viễn thẻ và toàn bộ lịch sử giao dịch liên quan. Không thể hoàn tác.
            </p>

           {/* Thông tin thẻ */}
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>Mã thẻ</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{deleteTarget.voucherCode}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>Chủ thẻ</div>
              <div style={{ fontWeight: 600 }}>{deleteTarget.holderName}</div>
            </div>
          </div>

            {/* Ô xác nhận gõ XÓA */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 8 }}>
                Gõ <strong style={{ color: '#dc2626' }}>XÓA</strong> để xác nhận
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder='Nhập "XÓA"'
                style={{
                  ...inputStyle,
                  border: deleteConfirmText === 'XÓA' ? '2px solid #dc2626' : '2px solid #eee',
                }}
                autoFocus
              />
            </div>

            {deleteError && (
              <div style={{ background: '#fff1f0', color: '#cf1322', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteConfirmText('')
                  setDeleteError('')
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1px solid #eee', background: 'white',
                  color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'XÓA' || deleteLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: deleteConfirmText === 'XÓA' ? '#dc2626' : '#f5f5f5',
                  color: deleteConfirmText === 'XÓA' ? 'white' : '#bbb',
                  fontWeight: 700, fontSize: 14,
                  cursor: deleteConfirmText === 'XÓA' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #eee',
        padding: 20, marginBottom: 20,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={labelStyle}>Tìm kiếm</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchVouchers(search) } }}
            placeholder="Mã thẻ, tên, SĐT..."
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>Partner</label>
          <select value={partnerId} onChange={e => { setPartnerId(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="">Tất cả</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Trạng thái</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="">Tất cả</option>
            <option value="ACTIVE">Còn hạn</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="DISABLED">Đã khóa</option>
            <option value="USED">Đã dùng hết</option>
          </select>
        </div>
        <button onClick={() => { setPage(1); fetchVouchers(search) }} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600,
          fontSize: 14, cursor: 'pointer', height: 42,
        }}>
          Tìm
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : vouchers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Không có thẻ nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Th>Mã thẻ</Th>
                <Th>Chủ thẻ</Th>
                <Th>SĐT</Th>
                <Th>Partner</Th>
                <Th>Số tiền ban đầu</Th>
                <Th>Số dư còn lại</Th>
                <Th>Hạn sử dụng</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v, i) => {
                const sc = statusColor[v.status] || statusColor.ACTIVE
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <Td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                        {v.voucherCode}
                      </span>
                    </Td>
                    <Td><span style={{ fontWeight: 600 }}>{v.holderName}</span></Td>
                    <Td style={{ color: '#666' }}>{v.holderPhone || '—'}</Td>
                    <Td>
                      <span style={{
                        background: '#fff1ec', color: '#E8440A',
                        padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      }}>
                        {v.partner.name}
                      </span>
                    </Td>
                    <Td style={{ color: '#666' }}>{formatMoney(v.initialAmount)}</Td>
                    <Td>
                      <span style={{ fontWeight: 700, color: v.balance === 0 ? '#999' : '#16a34a' }}>
                        {formatMoney(v.balance)}
                      </span>
                    </Td>
                    <Td style={{ color: '#666', fontSize: 13 }}>
                      {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                    </Td>
                    <Td>
                      <span style={{
                        background: sc.bg, color: sc.text,
                        padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      }}>
                        {statusLabel[v.status]}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* Nút Điều chỉnh */}
                        <button onClick={() => {
                          setAdjustVoucher({
                            voucherCode: v.voucherCode,
                            holderName: v.holderName,
                            balance: v.balance,
                            initialAmount: v.initialAmount,
                          })
                          setAdjustAmount('')
                          setReason('')
                          setAdjustError('')
                          setAdjustSuccess('')
                          setAdjustType('add')
                        }} style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', border: '1px solid #fde68a',
                          background: '#fffbeb', color: '#d97706',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; e.currentTarget.style.borderColor = '#fcd34d' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fde68a' }}
                        >
                          <Coins size={14} strokeWidth={2} />
                          <span>Điều chỉnh</span>
                        </button>

                        {/* Nút Xóa */}
                        <button onClick={() => {
                          setDeleteTarget({ id: v.id, voucherCode: v.voucherCode, holderName: v.holderName })
                          setDeleteConfirmText('')
                          setDeleteError('')
                        }} style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', border: '1px solid #fecaca',
                          background: '#fef2f2', color: '#dc2626',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
                        >
                          <Trash2 size={14} strokeWidth={2} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnPage}>
            ← Trước
          </button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#666' }}>
            Trang {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnPage}>
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>{children}</th>
}

function Td({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a', whiteSpace: 'nowrap', ...style }}>{children}</td>
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', boxSizing: 'border-box', background: 'white',
}

const btnPage: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #eee',
  background: 'white', fontSize: 14, cursor: 'pointer', color: '#666',
}
