'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Transaction {
  id: string
  orderCode: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  createdAt: string
  voucher: {
    voucherCode: string
    holderName: string
    partner: { name: string }
  }
  store: { name: string; storeCode: string }
}

type DateFilter = 'today' | 'week' | 'month' | 'custom'

export default function CashierHistoryPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filter
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [searchCode, setSearchCode] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (!t || !u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'CASHIER') { router.push('/login'); return }
    setToken(t)
    setUser(parsed)
  }, [])

  useEffect(() => {
    if (token) fetchTransactions()
  }, [token, page, dateFilter, dateFrom, dateTo, searchCode])

  function getDateRange(filter: DateFilter) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    if (filter === 'today') return { from: today, to: today }
    if (filter === 'week') {
      const mon = new Date(now)
      mon.setDate(now.getDate() - now.getDay() + 1)
      return { from: mon.toISOString().split('T')[0], to: today }
    }
    if (filter === 'month') {
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today }
    }
    return { from: dateFrom, to: dateTo }
  }

  async function fetchTransactions() {
    setLoading(true)
    try {
      const { from, to } = getDateRange(dateFilter)
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(searchCode && { voucherCode: searchCode }),
        ...(from && { dateFrom: from }),
        ...(to && { dateTo: to }),
      })

      const res = await fetch(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setTransactions(data.data)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
        setTotalRevenue(data.totalRevenue)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatMoney(n: number) {
    return n.toLocaleString('vi-VN') + 'đ'
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleString('vi-VN')
  }

  const filterBtns: { key: DateFilter; label: string }[] = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng này' },
    { key: 'custom', label: 'Tùy chọn' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #eee',
        padding: '16px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#E8440A', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>BQ</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Lịch sử bán hàng</div>
            <div style={{ fontSize: 12, color: '#999' }}>{user?.storeName}</div>
          </div>
        </div>
        <Link href="/cashier" style={{
          fontSize: 13, color: '#E8440A', fontWeight: 600,
          textDecoration: 'none', padding: '8px 16px',
          border: '1px solid #E8440A', borderRadius: 8,
        }}>
          ← Quét thẻ
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>

        {/* Bộ lọc thời gian */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {filterBtns.map(btn => (
              <button key={btn.key} onClick={() => { setDateFilter(btn.key); setPage(1) }}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: dateFilter === btn.key ? '#E8440A' : '#f5f5f5',
                  color: dateFilter === btn.key ? 'white' : '#555',
                }}>
                {btn.label}
              </button>
            ))}
          </div>

          {/* Tùy chọn ngày */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Từ ngày</label>
                <input type="date" value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Đến ngày</label>
                <input type="date" value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(1) }}
                  style={inputStyle} />
              </div>
            </div>
          )}

          {/* Tìm theo mã thẻ */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={voucherCode}
              onChange={e => setVoucherCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearchCode(voucherCode); setPage(1) } }}
              placeholder="Tìm theo mã thẻ..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => { setSearchCode(voucherCode); setPage(1) }} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: '#E8440A', color: 'white', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}>
              Tìm
            </button>
            {searchCode && (
              <button onClick={() => { setVoucherCode(''); setSearchCode(''); setPage(1) }} style={{
                padding: '10px 16px', borderRadius: 10,
                border: '1px solid #eee', background: 'white',
                color: '#666', fontSize: 14, cursor: 'pointer',
              }}>
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Thống kê tổng — luôn theo bộ lọc hiện tại */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
              Tổng giao dịch {searchCode ? `có mã thẻ "${searchCode}"` : 'cửa hàng'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a' }}>{total}</div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
              Tổng doanh thu {searchCode ? `có mã thẻ "${searchCode}"` : 'cửa hàng'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E8440A' }}>{formatMoney(totalRevenue)}</div>
          </div>
        </div>

        {/* Danh sách giao dịch */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Không có giao dịch nào</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                  <Th>Thời Gian</Th>
                  <Th>Mã Thẻ</Th>
                  <Th>Chủ Thẻ</Th>
                  <Th>Đơn Vị</Th>
                  <Th>Số Tiền</Th>
                  <Th>Số Dư Còn Lại</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} style={{
                    borderBottom: '1px solid #f5f5f5',
                    background: i % 2 === 0 ? 'white' : '#fafafa',
                  }}>
                    <Td style={{ color: '#999', fontSize: 12 }}>{formatDate(tx.createdAt)}</Td>
                    <Td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                        {tx.voucher.voucherCode}
                      </span>
                    </Td>
                    <Td>{tx.voucher.holderName}</Td>
                    <Td>
                      <span style={{
                        background: '#fff1ec', color: '#E8440A',
                        padding: '2px 8px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {tx.voucher.partner.name}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ color: '#E8440A', fontWeight: 700 }}>
                        -{formatMoney(tx.amount)}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatMoney(tx.balanceAfter)}
                      </span>
                    </Td>
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
  padding: '10px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', background: 'white', boxSizing: 'border-box',
}

const btnPage: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #eee',
  background: 'white', fontSize: 14, cursor: 'pointer', color: '#666',
}