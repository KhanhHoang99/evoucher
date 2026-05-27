'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Voucher {
  voucherCode: string
  holderName: string
  holderPhone: string | null
  initialAmount: number
  balance: number
  status: string
  expiresAt: string
  partner: string
}

interface PaymentResult {
  orderCode: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export default function CashierPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState<any>(null)

  // Bước 1: quét thẻ
  const [code, setCode] = useState('')
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [scanError, setScanError] = useState('')
  const [scanning, setScanning] = useState(false)

  // Bước 2: cập nhật SĐT
  const [phone, setPhone] = useState('')
  const [updatingPhone, setUpdatingPhone] = useState(false)

  // Bước 3: thanh toán
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [result, setResult] = useState<PaymentResult | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (!t || !u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'CASHIER') { router.push('/dashboard'); return }
    setToken(t)
    setUser(parsed)
  }, [])

  function reset() {
    setCode('')
    setVoucher(null)
    setScanError('')
    setPhone('')
    setAmount('')
    setPayError('')
    setResult(null)
  }

  async function handleScan() {
    if (!code.trim()) return
    setScanning(true)
    setScanError('')
    setVoucher(null)
    try {
      const res = await fetch(`/api/voucher/${code.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) { setScanError(data.error); return }
      setVoucher(data)
    } catch {
      setScanError('Lỗi kết nối server')
    } finally {
      setScanning(false)
    }
  }

  async function handleUpdatePhone() {
    if (!phone.trim() || !voucher) return
    setUpdatingPhone(true)
    try {
      const res = await fetch(`/api/voucher/${voucher.voucherCode}/phone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (res.ok) setVoucher({ ...voucher, holderPhone: data.holderPhone })
    } finally {
      setUpdatingPhone(false)
    }
  }

  async function handlePayment() {
    if (!amount || !voucher) return
    const amt = parseInt(amount.replace(/\D/g, ''))
    if (isNaN(amt) || amt <= 0) { setPayError('Số tiền không hợp lệ'); return }
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voucherCode: voucher.voucherCode, amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) { setPayError(data.error); return }
      setResult(data)
    } catch {
      setPayError('Lỗi kết nối server')
    } finally {
      setPaying(false)
    }
  }

  function formatMoney(n: number) {
    return n.toLocaleString('vi-VN') + 'đ'
  }

  // Màn hình kết quả thanh toán thành công
  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Thanh toán thành công!</h2>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 32 }}>Mã đơn: {result.orderCode}</p>

          <div style={{ background: '#f8f7f5', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <Row label="Số tiền thanh toán" value={formatMoney(result.amount)} highlight />
            <Row label="Số dư trước" value={formatMoney(result.balanceBefore)} />
            <Row label="Số dư còn lại" value={formatMoney(result.balanceAfter)} />
            <Row label="Thời gian" value={new Date(result.createdAt).toLocaleString('vi-VN')} />
          </div>

          <button onClick={reset} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: '#E8440A', color: 'white', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            Quét thẻ mới
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5' }}>
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
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>Thanh toán thẻ</div>
            <div style={{ fontSize: 12, color: '#999' }}>{user?.storeName}</div>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login') }}
          style={{ fontSize: 13, color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>
          Đăng xuất
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>

        {/* Bước 1: Quét thẻ */}
        <Section title="Bước 1 — Quét mã thẻ">
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              autoFocus
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Nhập hoặc quét mã thẻ..."
              style={inputStyle}
            />
            <button onClick={handleScan} disabled={scanning} style={btnPrimary}>
              {scanning ? '...' : 'Tìm'}
            </button>
          </div>
          {scanError && <ErrorBox msg={scanError} />}
        </Section>

        {/* Thông tin thẻ */}
        {voucher && (
          <>
            <Section title="Thông tin thẻ">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label="Mã thẻ" value={voucher.voucherCode} />
                <Row label="Chủ thẻ" value={voucher.holderName} />
                <Row label="Đối tác" value={voucher.partner} />
                <Row label="Hạn sử dụng" value={new Date(voucher.expiresAt).toLocaleDateString('vi-VN')} />
                <Row label="Số tiền ban đầu" value={formatMoney(voucher.initialAmount)} />
                <Row label="Số dư còn lại" value={formatMoney(voucher.balance)} highlight />

                {/* Cập nhật SĐT nếu trống */}
                {!voucher.holderPhone ? (
                  <div style={{ marginTop: 8, padding: 12, background: '#fff8f6', borderRadius: 10, border: '1px solid #ffd4c2' }}>
                    <p style={{ fontSize: 13, color: '#E8440A', marginBottom: 8, fontWeight: 600 }}>
                      ⚠️ Thẻ chưa có số điện thoại
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={handleUpdatePhone} disabled={updatingPhone} style={btnSecondary}>
                        {updatingPhone ? '...' : 'Lưu'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Row label="Số điện thoại" value={voucher.holderPhone} />
                )}
              </div>
            </Section>

            {/* Bước 2: Thanh toán */}
            <Section title="Bước 2 — Thanh toán">
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  value={amount}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setAmount(raw ? parseInt(raw).toLocaleString('vi-VN') : '')
                  }}
                  onKeyDown={e => e.key === 'Enter' && handlePayment()}
                  placeholder="Nhập số tiền thanh toán"
                  style={inputStyle}
                />
              </div>

              {/* Gợi ý nhanh */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {[100000, 200000, 500000, 1000000].map(v => (
                  <button key={v} onClick={() => setAmount(v.toLocaleString('vi-VN'))}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid #eee',
                      background: 'white', fontSize: 12, color: '#666', cursor: 'pointer',
                    }}>
                    {formatMoney(v)}
                  </button>
                ))}
              </div>

              {payError && <ErrorBox msg={payError} />}

              <button onClick={handlePayment} disabled={paying || !amount}
                style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: 15 }}>
                {paying ? 'Đang xử lý...' : `Xác nhận thanh toán ${amount ? amount + 'đ' : ''}`}
              </button>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// Components nhỏ
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8440A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: 13, color: '#999' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: highlight ? '#E8440A' : '#1a1a1a' }}>{value}</span>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#fff1f0', border: '1px solid #ffccc7', color: '#cf1322', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginTop: 8 }}>
      ⚠️ {msg}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '12px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', background: 'white', width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10, border: 'none',
  background: '#E8440A', color: 'white', fontWeight: 700,
  fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
}

const btnSecondary: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 10,
  border: '2px solid #E8440A', background: 'white',
  color: '#E8440A', fontWeight: 700, fontSize: 14, cursor: 'pointer',
}