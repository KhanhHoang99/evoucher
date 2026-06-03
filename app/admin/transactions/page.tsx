'use client'

import { useEffect, useState } from 'react'
import { Coins, CreditCard } from 'lucide-react'

interface Transaction {
  id: string
  orderCode: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  type: string
  reason: string | null
  createdAt: string
  voucher: {
    voucherCode: string
    holderName: string
    partner: { name: string }
  }
  store: { name: string; storeCode: string } | null
}

interface Store {
  id: string
  name: string
  storeCode: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  // Filter
  const [storeId, setStoreId] = useState('')
  const [type, setType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [searchCode, setSearchCode] = useState('')

  useEffect(() => { fetchStores() }, [])
  useEffect(() => { fetchTransactions() }, [page, storeId, type, dateFrom, dateTo, searchCode])

  function getToken() { return localStorage.getItem('token') || '' }

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setStores(data)
    } catch {}
  }

  async function fetchTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (storeId) params.append('storeId', storeId)
      if (type) params.append('type', type)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      if (searchCode) params.append('voucherCode', searchCode)

      const res = await fetch(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) {
        setTransactions(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setTotalRevenue(data.totalRevenue)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatMoney(n: number) { return n.toLocaleString('vi-VN') + 'đ' }
  function formatDate(s: string) { return new Date(s).toLocaleString('vi-VN') }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Lịch sử giao dịch</h1>
          <p style={{ color: '#999', marginTop: 4 }}>
            Tổng cộng <strong style={{ color: '#1a1a1a' }}>{total}</strong> giao dịch
          </p>
          <p style={{ color: '#999', marginTop: 4 }}> 
            Tổng tiền: <strong style={{ color: '#E8440A' }}>{formatMoney(totalRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #eee',
        padding: 20, marginBottom: 20,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* Tìm mã thẻ */}
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={labelStyle}>Mã thẻ</label>
          <input
            value={voucherCode}
            onChange={e => setVoucherCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearchCode(voucherCode); setPage(1) } }}
            placeholder="Tìm theo mã thẻ..."
            style={inputStyle}
          />
        </div>

        {/* Cửa hàng */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>Cửa hàng</label>
          <select value={storeId} onChange={e => { setStoreId(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="">Tất cả</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Loại giao dịch */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Loại</label>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="">Tất cả</option>
            <option value="PAYMENT">💳 Thanh toán</option>
            <option value="ADJUSTMENT">💰 Điều chỉnh</option>
          </select>
        </div>

        {/* Từ ngày */}
        <div style={{ minWidth: 140 }}>
          <label style={labelStyle}>Từ ngày</label>
          <input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            style={inputStyle} />
        </div>

        {/* Đến ngày */}
        <div style={{ minWidth: 140 }}>
          <label style={labelStyle}>Đến ngày</label>
          <input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            style={inputStyle} />
        </div>

        <button onClick={() => { setSearchCode(voucherCode); setPage(1) }} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600,
          fontSize: 14, cursor: 'pointer', height: 42,
        }}>
          Tìm
        </button>

        {/* Nút xóa filter */}
        {(storeId || type || dateFrom || dateTo || searchCode) && (
          <button onClick={() => {
            setStoreId(''); setType(''); setDateFrom(''); setDateTo('')
            setVoucherCode(''); setSearchCode(''); setPage(1)
          }} style={{
            padding: '10px 16px', borderRadius: 10, border: '1px solid #eee',
            background: 'white', color: '#666', fontSize: 14, cursor: 'pointer', height: 42,
          }}>
            Xóa lọc
          </button>
        )}
      </div>

     

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Không có giao dịch nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Th>Mã đơn</Th>
                <Th>Mã thẻ</Th>
                <Th>Chủ thẻ</Th>
                <Th>Partner</Th>
                <Th>Cửa hàng</Th>
                <Th>Số tiền</Th>
                <Th>Số dư còn lại</Th>
                <Th>Loại</Th>
                <Th>Lý do</Th>
                <Th>Thời gian</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={tx.id} style={{
                  borderBottom: '1px solid #f5f5f5',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                }}>
                  <Td>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
                      {tx.orderCode}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                      {tx.voucher.voucherCode}
                    </span>
                  </Td>
                  <Td>{tx.voucher.holderName}</Td>
                  <Td>
                    <span style={{
                      background: '#fff1ec', color: '#E8440A',
                      padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {tx.voucher.partner.name}
                    </span>
                  </Td>
                  <Td>
                    {tx.store ? tx.store.name : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Admin điều chỉnh</span>
                    )}
                  </Td>
                  <Td>
                    <span style={{
                      color: tx.type === 'ADJUSTMENT' && tx.balanceAfter > tx.balanceBefore ? '#16a34a' : '#E8440A',
                      fontWeight: 700,
                    }}>
                      {tx.type === 'ADJUSTMENT' && tx.balanceAfter > tx.balanceBefore ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      {formatMoney(tx.balanceAfter)}
                    </span>
                  </Td>
                  <Td>
                    <span style={{
                      background: tx.type === 'ADJUSTMENT' ? '#fffbeb' : '#f0fdf4',
                      color: tx.type === 'ADJUSTMENT' ? '#d97706' : '#16a34a',
                      padding: '4px 8px', // Tăng nhẹ padding dọc lên 4px nhìn nhãn sẽ cân đối hơn
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 600,
                      // Cấu hình flex để icon và chữ thẳng hàng
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      {tx.type === 'ADJUSTMENT' ? (
                        <>
                          <Coins size={14} strokeWidth={2} />
                          <span>Điều chỉnh</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={14} strokeWidth={2} />
                          <span>Thanh toán</span>
                        </>
                      )}
                    </span>
                  </Td>
                  <Td style={{ color: '#666', fontSize: 12, maxWidth: 150 }}>
                    {tx.reason || '—'}
                  </Td>
                  <Td style={{ color: '#999', fontSize: 12 }}>{formatDate(tx.createdAt)}</Td>
                </tr>
              ))}
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
  padding: '10px 14px', borderRadius: 10, border: '2px solid #eee',
  fontSize: 14, color: '#1a1a1a', outline: 'none',
  background: 'white', boxSizing: 'border-box', width: '100%',
}
const btnPage: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #eee',
  background: 'white', fontSize: 14, cursor: 'pointer', color: '#666',
}