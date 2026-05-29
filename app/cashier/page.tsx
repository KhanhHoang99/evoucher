'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HistoryLog {
  id: string         // hoặc orderCode
  createdAt: string
  storeCode: string  // Ví dụ: CH246
  amount: number
}

interface Voucher {
  voucherCode: string
  holderName: string
  holderPhone: string | null
  initialAmount: number
  balance: number
  status: string
  expiresAt: string
  partner: string
  customerGroup?: string
  purchaseCount?: number
  totalSpent?: number
  maxLimit?: number
  history?: any[]
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

  // Các Ref điều khiển tự động focus thông minh
  const scanInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  // Bước 1: Quét thẻ
  const [code, setCode] = useState('')
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [scanError, setScanError] = useState('')
  const [scanning, setScanning] = useState(false)

  // Trạng thái điều khiển Popup SĐT
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [updatingPhone, setUpdatingPhone] = useState(false)

  // Bước 2: Thanh toán
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [result, setResult] = useState<PaymentResult | null>(null)

  const [txHistory, setTxHistory] = useState<any[]>([])
  const [txStats, setTxStats] = useState<{ totalCount: number; totalSpent: number } | null>(null)

  // state popup lỗi thẻ
  const [cardError, setCardError] = useState<{ title: string; message: string } | null>(null)

  // Xác thực quyền Cashier khi vào trang
  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (!t || !u) { router.push('/login'); return }
    try {
      const parsed = JSON.parse(u)
      if (parsed.role !== 'CASHIER') { router.push('/dashboard'); return }
      setToken(t)
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [])

  // Tự động focus tùy theo trạng thái cuốn chiếu của màn hình
  useEffect(() => {
    if (showPhoneModal) {
      phoneInputRef.current?.focus()
    } else if (!voucher && scanInputRef.current) {
      // Chỉ focus máy quét khi chưa có thông tin voucher (Trạng thái A)
      scanInputRef.current.focus()
    }
  }, [voucher, result, showPhoneModal])

  // Hàm trả giao diện về Trạng thái A khi nhấn "QUÉT THẺ KHÁC"
  function reset() {
    setCode('')
    setVoucher(null)
    setScanError('')
    setPhone('')
    setShowPhoneModal(false)
    setAmount('')
    setPayError('')
    setResult(null)
    setTxHistory([])
    setTxStats(null)
    setCardError(null)
    // Delay nhẹ để đảm bảo ô input Bước 1 đã được render lại xong xuôi rồi mới focus
    setTimeout(() => scanInputRef.current?.focus(), 50)
  }

  async function handleScan() {
    if (!code.trim() || scanning) return
    setScanning(true)
    setScanError('')
    setVoucher(null)
    setCardError(null)

    try {
      const res = await fetch(`/api/voucher/${code.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('hết hạn')) {
          setCardError({
            title: '⏰ Thẻ đã hết hạn',
            message: `Thẻ của ${data.holderName} đã hết hạn vào ngày ${new Date(data.expiresAt).toLocaleDateString('vi-VN')}. Vui lòng liên hệ quản lý.`,
          })
        } else if (data.error?.includes('vô hiệu hóa') || data.error?.includes('khóa')) {
          setCardError({
            title: '🔒 Thẻ đã bị khóa',
            message: `Thẻ của ${data.holderName} đã bị vô hiệu hóa. Hạn sử dụng: ${new Date(data.expiresAt).toLocaleDateString('vi-VN')}. Vui lòng liên hệ quản lý.`,
          })
        } else if (data.error?.includes('sử dụng hết')) {
          setCardError({
            title: '💳 Thẻ đã dùng hết',
            message: `Số dư thẻ này đã về 0đ. Không thể thanh toán thêm.`,
          })
        } else {
          setScanError(data.error || 'Thẻ không hợp lệ')
        }
        return
      }

      setVoucher(data)
      fetchHistory(code.trim())
      if (!data.holderPhone) {
        setShowPhoneModal(true)
      }
    } catch {
      setScanError('Lỗi kết nối server')
    } finally {
      setScanning(false)
    }
  }

  async function fetchHistory(voucherCode: string) {
  try {
    const res = await fetch(`/api/transactions?voucherCode=${voucherCode}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      setTxHistory(data.data)
      setTxStats(data.stats)
    }
  } catch {}
}

  async function handleUpdatePhone() {
    if (!phone.trim() || !voucher || updatingPhone) return
    setUpdatingPhone(true)
    try {
      const res = await fetch(`/api/voucher/${voucher.voucherCode}/phone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setVoucher({ ...voucher, holderPhone: data.holderPhone || phone.trim() })
        setShowPhoneModal(false)
      } else {
        alert(data.error || 'Không thể cập nhật số điện thoại')
      }
    } catch {
      alert('Không thể cập nhật số điện thoại')
    } finally {
      setUpdatingPhone(false)
    }
  }

  async function handlePayment() {
    if (!amount || !voucher || paying) return
    const amt = parseInt(amount.replace(/\D/g, ''))
    
    if (isNaN(amt) || amt <= 0) { setPayError('Số tiền không hợp lệ'); return }
    if (amt > voucher.balance) { setPayError('Số tiền thanh toán vượt quá số dư còn lại của thẻ'); return }

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

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  // Màn hình kết quả khi bấm CẬP NHẬT thành công
  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8440A', marginBottom: 8 }}>Thanh Toán Thành Công!</h2>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 32 }}>Mã đơn: {result.orderCode}</p>

          <div style={{ background: '#f8f7f5', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: 13, color: '#999' }}>Số tiền thanh toán</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#E8440A' }}>{formatMoney(result.amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: 13, color: '#999' }}>Số dư trước</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{formatMoney(result.balanceBefore)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: '#999' }}>Số dư còn lại</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{formatMoney(result.balanceAfter)}</span>
            </div>
          </div>

          <button onClick={reset} style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: 15 }}>
            QUÉT THẺ KHÁC
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', color: '#1a1a1a', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
<div style={{ background: 'white', borderBottom: '1px solid #eee', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  
  {/* Logo + tên cửa hàng */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8440A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>BQ</span>
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>Thanh Toán Thẻ</div>
      <div style={{ fontSize: 12, color: '#999' }}>{user?.storeName || 'Cửa hàng'}</div>
    </div>
  </div>

  {/* Nút phải */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <Link href="/cashier/history" style={{ fontSize: 13, color: '#666', fontWeight: 500, textDecoration: 'none' }}>
      📋 Lịch sử
    </Link>
    <button onClick={() => {
      localStorage.clear()
      document.cookie = 'token=; path=/; max-age=0'
      router.push('/login')
    }} style={{ fontSize: 13, color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>
      Đăng xuất
    </button>
  </div>

</div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: 24 }}>

        {/* TRẠNG THÁI A: Chưa có dữ liệu thẻ -> CHỈ hiện khối quét mã thẻ ở Bước 1 */}
        {!voucher && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8440A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{user?.storeName}</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={scanInputRef}
                autoFocus
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="Nhập hoặc quét mã thẻ..."
                disabled={scanning}
                style={{ ...inputStyle, background: scanning ? '#f5f5f5' : 'white' }}
              />
              <button 
                onClick={handleScan} 
                disabled={scanning || !code.trim()} 
                style={{ ...btnPrimary, opacity: (scanning || !code.trim()) ? 0.6 : 1 }}
              >
                {scanning ? '...' : 'TÌM THẺ'}
              </button>
            </div>
            {scanError && <ErrorBox msg={scanError} />}
          </div>
        )}

        {/* TRẠNG THÁI B: Đã quét thẻ thành công và ĐÃ CÓ số điện thoại -> Ẩn Bước 1, Hiện toàn bộ cụm dưới */}
        {voucher && voucher.holderPhone && (
          <>
            {/* CỤM THANH TOÁN (Thông tin thẻ to + Ô nhập tiền + Nút bấm hành động) */}
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: '1.6', marginBottom: 16 }}>
                CODE: {voucher.voucherCode} - HSD: {formatDate(voucher.expiresAt)} <br />
                SỐ DƯ: <span style={{ color: '#E8440A' }}>{formatMoney(voucher.balance)}</span> - {voucher.holderName.toUpperCase()}
              </div>

              {/* Khung xử lý tiền */}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={amount}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setAmount(raw ? parseInt(raw).toLocaleString('vi-VN') : '')
                    }}
                    onKeyDown={e => e.key === 'Enter' && handlePayment()}
                    placeholder="Nhập số tiền thanh toán"
                    disabled={paying}
                    style={{ ...inputStyle, paddingLeft: 18, fontSize: 15, fontWeight: 600 }}
                  />
                </div>

                {/* Các nút điền nhanh */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  
                  <button 
                    onClick={() => setAmount(voucher.balance.toLocaleString('vi-VN'))} 
                    disabled={paying}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ffd4c2', background: '#fff8f6', fontSize: 12, color: '#E8440A', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Hết số dư ({formatMoney(voucher.balance)})
                  </button>
                </div>

                {payError && <ErrorBox msg={payError} />}

                {/* Bộ đôi hành động: bấm "QUÉT THẺ KHÁC" sẽ kích hoạt xóa state để quay về Trạng thái A */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={handlePayment} disabled={paying || !amount} style={{ ...btnPrimary, flex: 1, padding: '14px', fontSize: 14, opacity: (paying || !amount) ? 0.6 : 1 }}>
                    {paying ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT'}
                  </button>
                  <button onClick={reset} disabled={paying} style={{ ...btnSecondary, flex: 1, padding: '14px', fontSize: 14 }}>
                    QUÉT THẺ KHÁC
                  </button>
                </div>
              </div>
            </div>

            {/* PHẦN 2: THÔNG TIN MUA HÀNG CHI TIẾT */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid #eee' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#E8440A', marginTop: 0, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Thông tin mua hàng</h4>
              <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: '2' }}>
                <div><strong>Số Mã Thẻ:</strong> {voucher.voucherCode} | <strong>HSD:</strong> {formatDate(voucher.expiresAt)}</div>
                <div><strong>Họ Và Tên:</strong> {voucher.holderName.toUpperCase()} | <strong>SĐT:</strong> {voucher.holderPhone}</div>
                <div><strong>Partner: </strong>{voucher.partner}</div>
                <div>
                  <strong>Số Lần Đã Mua:</strong> {txStats ? `${txStats.totalCount} lần` : '...'} |{' '}
                  
                  <strong>Tổng chi tiêu: </strong><span style={{ color: '#E8440A', fontWeight: 700 }}>{txStats ? formatMoney(txStats.totalSpent) : '...'}</span> / {' '}                  
                  <span>
                    {formatMoney(voucher.initialAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* PHẦN 3: LỊCH SỬ MUA HÀNG DƯỚI CÙNG */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#E8440A', marginTop: 0, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Lịch sử mua hàng
              </h4>
              {txHistory.length === 0 ? (
                <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                  Chưa có giao dịch nào
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {txHistory.map((tx: any) => (
                    <div key={tx.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '10px 12px',
                      background: '#f8f7f5', borderRadius: 10,
                    }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {tx.store.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#E8440A' }}>
                          -{formatMoney(tx.amount)}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          Còn: {formatMoney(tx.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* POPUP MODAL THU THẬP SĐT (Chặn trung gian nếu thẻ thiếu dữ liệu) */}
      {showPhoneModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 24 }}>
              Thẻ của khách hàng <strong>{voucher?.holderName.toUpperCase()}</strong> chưa gắn số điện thoại. Vui lòng bổ sung để thanh toán.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              <input
                ref={phoneInputRef}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleUpdatePhone()}
                placeholder="Nhập số điện thoại khách hàng..."
                disabled={updatingPhone}
                style={{ ...inputStyle, fontSize: 15, padding: '12px 14px' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={reset} disabled={updatingPhone} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #eee', background: '#f5f5f5', color: '#666', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleUpdatePhone} 
                  disabled={updatingPhone || phone.length < 10} 
                  style={{ ...btnPrimary, flex: 2, opacity: (updatingPhone || phone.length < 10) ? 0.6 : 1 }}
                >
                  {updatingPhone ? 'Đang lưu...' : 'LƯU'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP LỖI THẺ */}
      {cardError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {cardError.title.split(' ')[0]}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>
              {cardError.title.substring(2)}
            </h3>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
              {cardError.message}
            </p>
            <button onClick={() => { setCardError(null); setCode(''); setTimeout(() => scanInputRef.current?.focus(), 50) }}
              style={{ ...btnPrimary, width: '100%', padding: '14px' }}>
              Quét thẻ khác
            </button>
          </div>
        </div>
)}

    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#fff1f0', border: '1px solid #ffccc7', color: '#cf1322', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginTop: 10 }}>
      ⚠️ {msg}
    </div>
  )
}

// Giữ nguyên hệ Styles Cam Đỏ nguyên bản của bạn
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '12px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'all 0.2s',
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10, border: 'none',
  background: '#E8440A', color: 'white', fontWeight: 700,
  fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer',
  textAlign: 'center', transition: 'all 0.2s',
}

const btnSecondary: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10,
  border: '2px solid #E8440A', background: 'white',
  color: '#E8440A', fontWeight: 700, fontSize: 14,
  whiteSpace: 'nowrap', cursor: 'pointer',
  textAlign: 'center', transition: 'all 0.2s',
}