'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  store: {
    name: string
    storeCode: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTransactions(page)
  }, [page])

  async function fetchTransactions(p: number) {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/transactions?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setTransactions(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
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

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Lịch sử giao dịch</h1>
        <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {total} giao dịch</p>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Chưa có giao dịch nào</div>
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
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
                      {tx.orderCode}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
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
                  <Td>{tx.store.name}</Td>
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
                  <Td style={{ color: '#999', fontSize: 13 }}>{formatDate(tx.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={btnPage}
          >
            ← Trước
          </button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#666' }}>
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={btnPage}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '12px 16px', textAlign: 'left',
      fontSize: 12, fontWeight: 600,
      color: '#666', whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

function Td({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '12px 16px', fontSize: 14,
      color: '#1a1a1a', whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </td>
  )
}

const btnPage: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8,
  border: '1px solid #eee', background: 'white',
  fontSize: 14, cursor: 'pointer', color: '#666',
}