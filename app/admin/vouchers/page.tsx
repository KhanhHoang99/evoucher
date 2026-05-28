'use client'

import { useEffect, useState } from 'react'

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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Danh sách thẻ</h1>
        <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {total} thẻ</p>
      </div>

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