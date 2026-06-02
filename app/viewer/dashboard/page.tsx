'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Stats {
  vouchers: {
    total: number
    active: number
    totalIssuedAmount: number
    totalRemainingBalance: number
  }
  today: { txCount: number; revenue: number }
  month: { txCount: number; revenue: number }
  storeStats: { name: string; storeCode: string; txCount: number; revenue: number }[]
  partnerStats: {
    name: string
    totalVouchers: number
    activeVouchers: number
    totalIssued: number
    totalRemaining: number
    totalSpent: number
  }[]
  dailyRevenue: { date: string; amount: number }[]
}

export default function ViewerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setStats(data)
    } finally {
      setLoading(false)
    }
  }

  // Format số tiền ngắn gọn: 1.5M, 500K
  function formatMoney(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
    return n.toLocaleString('vi-VN')
  }

  // Format số tiền đầy đủ
  function formatMoneyFull(n: number) {
    return n.toLocaleString('vi-VN') + 'đ'
  }

  // Format ngày cho trục X biểu đồ
  function formatDate(s: string) {
    const d = new Date(s)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>
        Đang tải dữ liệu...
      </div>
    )
  }

  if (!stats) return null

  // Tính số tiền đã dùng và % sử dụng
  const usedAmount = stats.vouchers.totalIssuedAmount - stats.vouchers.totalRemainingBalance
  const usedPercent = stats.vouchers.totalIssuedAmount > 0
    ? Math.round((usedAmount / stats.vouchers.totalIssuedAmount) * 100)
    : 0

  return (
    <div style={{ padding: 32 }}>

      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>Dashboard</h1>
        <p style={{ color: '#999', marginTop: 4, fontSize: 14 }}>
          Tổng quan hệ thống eVoucher — chỉ xem
        </p>
      </div>

      {/* Thống kê hôm nay và tháng này */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Hôm nay & Tháng này
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="Giao dịch hôm nay" value={String(stats.today.txCount)} unit="giao dịch" color="#2563eb" />
          <StatCard label="Doanh thu hôm nay" value={formatMoney(stats.today.revenue)} unit="đồng" color="#2563eb" />
          <StatCard label="Giao dịch tháng này" value={String(stats.month.txCount)} unit="giao dịch" color="#7c3aed" />
          <StatCard label="Doanh thu tháng này" value={formatMoney(stats.month.revenue)} unit="đồng" color="#7c3aed" />
        </div>
      </div>

      {/* Thống kê thẻ voucher */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Thẻ voucher
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="Tổng thẻ" value={String(stats.vouchers.total)} unit="thẻ" color="#16a34a" />
          <StatCard label="Thẻ đang active" value={String(stats.vouchers.active)} unit="thẻ" color="#16a34a" />
          <StatCard label="Tổng giá trị phát hành" value={formatMoney(stats.vouchers.totalIssuedAmount)} unit="đồng" color="#d97706" />
          <StatCard label="Tổng số dư còn lại" value={formatMoney(stats.vouchers.totalRemainingBalance)} unit="đồng" color="#d97706" />
        </div>
      </div>

      {/* Thanh tiến độ sử dụng thẻ */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
            Tỷ lệ sử dụng thẻ toàn hệ thống
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{usedPercent}%</span>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 99, height: 12, overflow: 'hidden' }}>
          <div style={{
            width: `${usedPercent}%`, height: '100%',
            background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
            borderRadius: 99, transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Đã dùng: {formatMoneyFull(usedAmount)}</span>
          <span style={{ fontSize: 12, color: '#999' }}>Còn lại: {formatMoneyFull(stats.vouchers.totalRemainingBalance)}</span>
        </div>
      </div>

      {/* Biểu đồ doanh thu 30 ngày gần nhất */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #eee' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
          Doanh thu 30 ngày gần nhất
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.dailyRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#999' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tickFormatter={formatMoney}
              tick={{ fontSize: 11, fill: '#999' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [formatMoneyFull(value as number), 'Doanh thu']}
              labelFormatter={(label: any) => {
                const d = new Date(label)
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
              }}
              contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 13 }}
            />
            <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Thống kê theo cửa hàng và partner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Doanh thu theo cửa hàng */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            Doanh thu theo cửa hàng
            <span style={{ fontSize: 12, color: '#999', fontWeight: 400, marginLeft: 8 }}>(tháng này)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.storeStats
              .sort((a, b) => b.revenue - a.revenue)
              .map(store => {
                const maxRevenue = Math.max(...stats.storeStats.map(s => s.revenue))
                const pct = maxRevenue > 0 ? (store.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={store.storeCode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{store.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                        {formatMoneyFull(store.revenue)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 99, height: 6 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#999', minWidth: 50 }}>{store.txCount} GD</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Thống kê theo partner */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            Thống kê theo partner
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.partnerStats.map(p => {
              const pct = p.totalIssued > 0
                ? Math.round((p.totalSpent / p.totalIssued) * 100)
                : 0
              return (
                <div key={p.name} style={{ padding: 16, background: '#f8f7f5', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {p.activeVouchers}/{p.totalVouchers} thẻ active
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: '#666' }}>Phát hành: {formatMoneyFull(p.totalIssued)}</span>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>Đã dùng: {pct}%</span>
                  </div>
                  <div style={{ background: '#eee', borderRadius: 99, height: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component card thống kê
function StatCard({ label, value, unit, color }: {
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>{unit}</div>
    </div>
  )
}