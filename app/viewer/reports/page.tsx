'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Handshake, Store } from 'lucide-react'

// Interface partner
interface Partner {
  id: string
  name: string
  totalVouchers: number
}

// Interface store
interface Store {
  id: string
  name: string
  storeCode: string
}

// Interface báo cáo theo partner
interface PartnerReportData {
  voucherCode: string
  holderName: string
  holderPhone: string
  initialAmount: number
  balance: number
  status: string
  expiresAt: string
  txCount: number
  totalSpent: number
}

// Interface báo cáo theo cửa hàng
interface StoreReportData {
  storeCode: string
  storeName: string
  txCount: number
  totalRevenue: number
  transactions: {
    orderCode: string
    voucherCode: string
    holderName: string
    partner: string
    amount: number
    balanceAfter: number
    createdAt: string
  }[]
}

export default function ViewerReportsPage() {
  // Tab hiện tại: partner hoặc store
  const [activeTab, setActiveTab] = useState<'partner' | 'store'>('partner')

  const [partners, setPartners] = useState<Partner[]>([])
  const [stores, setStores] = useState<Store[]>([])

  // Filter chung
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter báo cáo partner
  const [selectedPartner, setSelectedPartner] = useState('')
  const [partnerPreview, setPartnerPreview] = useState<PartnerReportData[]>([])
  const [hasPartnerPreview, setHasPartnerPreview] = useState(false)

  // Filter báo cáo cửa hàng
  const [selectedStore, setSelectedStore] = useState('')
  const [storePreview, setStorePreview] = useState<StoreReportData[]>([])
  const [hasStorePreview, setHasStorePreview] = useState(false)

  useEffect(() => {
    fetchPartners()
    fetchStores()
  }, [])

  function getToken() { return localStorage.getItem('token') || '' }

  // Lấy danh sách partners
  async function fetchPartners() {
    try {
      const res = await fetch('/api/partners', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setPartners(data)
    } catch {}
  }

  // Lấy danh sách stores
  async function fetchStores() {
    try {
      const res = await fetch('/api/stores', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setStores(data)
    } catch {}
  }

  // Lấy data báo cáo theo partner
  async function fetchPartnerReport(): Promise<PartnerReportData[]> {
    const params = new URLSearchParams({
      reportType: 'partner',
      partnerId: selectedPartner,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    })
    const res = await fetch(`/api/reports?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Lỗi server')
    return data.data
  }

  // Lấy data báo cáo theo cửa hàng
  async function fetchStoreReport(): Promise<StoreReportData[]> {
    const params = new URLSearchParams({
      reportType: 'store',
      ...(selectedStore && { storeId: selectedStore }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    })
    const res = await fetch(`/api/reports?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Lỗi server')
    return data.data
  }

  // Xem trước báo cáo partner
  async function handlePartnerPreview() {
    if (!selectedPartner) { alert('Vui lòng chọn đối tác!'); return }
    setLoading(true)
    setHasPartnerPreview(false)
    try {
      const data = await fetchPartnerReport()
      setPartnerPreview(data)
      setHasPartnerPreview(true)
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Xem trước báo cáo cửa hàng
  async function handleStorePreview() {
    setLoading(true)
    setHasStorePreview(false)
    try {
      const data = await fetchStoreReport()
      setStorePreview(data)
      setHasStorePreview(true)
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Xuất Excel báo cáo partner
  async function handleExportPartner() {
    if (!selectedPartner) { alert('Vui lòng chọn đối tác!'); return }
    setLoading(true)
    try {
      const data = hasPartnerPreview ? partnerPreview : await fetchPartnerReport()
      const partnerName = partners.find(p => p.id === selectedPartner)?.name || 'partner'
      const wb = XLSX.utils.book_new()

      // Sheet danh sách thẻ
      const sheetData = [
        ['STT', 'Mã thẻ', 'Họ và tên', 'Số điện thoại', 'Mức voucher', 'Số dư còn lại', 'Đã chi tiêu', 'Số lần mua', 'Trạng thái', 'Hạn sử dụng'],
        ...data.map((row, i) => [
          i + 1,
          row.voucherCode,
          row.holderName,
          row.holderPhone,
          row.initialAmount,
          row.balance,
          row.totalSpent,
          row.txCount,
          translateStatus(row.status),
          row.expiresAt,
        ])
      ]
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      ws['!cols'] = [
        { wch: 6 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 15 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách thẻ')

      // Sheet tổng hợp
      const totalIssued = data.reduce((sum, r) => sum + r.initialAmount, 0)
      const totalRemaining = data.reduce((sum, r) => sum + r.balance, 0)
      const totalSpent = data.reduce((sum, r) => sum + r.totalSpent, 0)
      const totalTx = data.reduce((sum, r) => sum + r.txCount, 0)
      const activeCount = data.filter(r => r.status === 'ACTIVE').length

      const summaryData = [
        ['BÁO CÁO SỬ DỤNG THẺ EVOUCHER'],
        [''],
        ['Đối tác:', partnerName],
        ['Từ ngày:', dateFrom || 'Tất cả'],
        ['Đến ngày:', dateTo || 'Tất cả'],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [''],
        ['TỔNG KẾT'],
        ['Tổng số thẻ:', data.length],
        ['Thẻ đang active:', activeCount],
        ['Tổng giá trị phát hành:', totalIssued],
        ['Tổng đã chi tiêu:', totalSpent],
        ['Tổng số dư còn lại:', totalRemaining],
        ['Tổng số lần mua:', totalTx],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp')

      const fileName = `BaoCao_${partnerName}_${new Date().toISOString().split('T')[0]}.xlsx`
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName)
    } catch (err: any) {
      alert('Lỗi xuất báo cáo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Xuất Excel báo cáo cửa hàng
  async function handleExportStore() {
    setLoading(true)
    try {
      const data = hasStorePreview ? storePreview : await fetchStoreReport()
      const storeName = selectedStore
        ? stores.find(s => s.id === selectedStore)?.name || 'cửa hàng'
        : 'Tất cả cửa hàng'

      const wb = XLSX.utils.book_new()

      // Tạo sheet cho từng cửa hàng
      for (const store of data) {
        const sheetData = [
          [`BÁO CÁO DOANH THU — ${store.storeName}`],
          ['Từ ngày:', dateFrom || 'Tất cả', 'Đến ngày:', dateTo || 'Tất cả'],
          ['Tổng giao dịch:', store.txCount, 'Tổng doanh thu:', store.totalRevenue],
          [''],
          ['STT', 'Mã đơn', 'Mã thẻ', 'Khách hàng', 'Đối tác', 'Số tiền', 'Số dư còn lại', 'Thời gian'],
          ...store.transactions.map((t, i) => [
            i + 1,
            t.orderCode,
            t.voucherCode,
            t.holderName,
            t.partner,
            t.amount,
            t.balanceAfter,
            t.createdAt,
          ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        ws['!cols'] = [
          { wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 25 },
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        ]
        // Tên sheet tối đa 31 ký tự
        const sheetName = store.storeCode.substring(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      // Sheet tổng hợp tất cả cửa hàng
      const summaryData = [
        ['BÁO CÁO DOANH THU THEO CỬA HÀNG'],
        [''],
        ['Từ ngày:', dateFrom || 'Tất cả'],
        ['Đến ngày:', dateTo || 'Tất cả'],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [''],
        ['TỔNG HỢP'],
        ['Cửa hàng', 'Số giao dịch', 'Tổng doanh thu'],
        ...data.map(s => [s.storeName, s.txCount, s.totalRevenue]),
        [''],
        ['TỔNG CỘNG',
          data.reduce((sum, s) => sum + s.txCount, 0),
          data.reduce((sum, s) => sum + s.totalRevenue, 0)
        ],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp')

      const fileName = `BaoCao_CuaHang_${new Date().toISOString().split('T')[0]}.xlsx`
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName)
    } catch (err: any) {
      alert('Lỗi xuất báo cáo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function translateStatus(status: string) {
    const map: Record<string, string> = {
      ACTIVE: 'Còn hạn', EXPIRED: 'Hết hạn',
      DISABLED: 'Đã khóa', USED: 'Đã dùng hết',
    }
    return map[status] || status
  }

  function formatMoney(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

  // Tính tổng partner preview
  const partnerTotalIssued = partnerPreview.reduce((sum, r) => sum + r.initialAmount, 0)
  const partnerTotalSpent = partnerPreview.reduce((sum, r) => sum + r.totalSpent, 0)
  const partnerTotalRemaining = partnerPreview.reduce((sum, r) => sum + r.balance, 0)

  // Tính tổng store preview
  const storeTotalTx = storePreview.reduce((sum, s) => sum + s.txCount, 0)
  const storeTotalRevenue = storePreview.reduce((sum, s) => sum + s.totalRevenue, 0)

  return (
    <div style={{ padding: 32 }}>

      {/* Tiêu đề */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>Xuất báo cáo</h1>
        <p style={{ color: '#999', marginTop: 4, fontSize: 14 }}>
          Xuất báo cáo theo đối tác hoặc cửa hàng
        </p>
      </div>

      {/* Tab chọn loại báo cáo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {/* Tab Theo đối tác */}
        <button 
          onClick={() => setActiveTab('partner')} 
          style={{
            padding: '10px 24px', 
            borderRadius: 10, 
            fontWeight: 600, 
            fontSize: 14,
            border: 'none', 
            cursor: 'pointer',
            background: activeTab === 'partner' ? '#2563eb' : '#f5f5f5',
            color: activeTab === 'partner' ? 'white' : '#555',
            // Kích hoạt flex để căn chỉnh icon và chữ thẳng hàng
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Handshake size={16} strokeWidth={activeTab === 'partner' ? 2.2 : 1.8} />
          <span>Theo đối tác</span>
        </button>

        {/* Tab Theo cửa hàng */}
        <button 
          onClick={() => setActiveTab('store')} 
          style={{
            padding: '10px 24px', 
            borderRadius: 10, 
            fontWeight: 600, 
            fontSize: 14,
            border: 'none', 
            cursor: 'pointer',
            background: activeTab === 'store' ? '#2563eb' : '#f5f5f5',
            color: activeTab === 'store' ? 'white' : '#555',
            // Kích hoạt flex để căn chỉnh icon và chữ thẳng hàng
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Store size={16} strokeWidth={activeTab === 'store' ? 2.2 : 1.8} />
          <span>Theo cửa hàng</span>
        </button>
      </div>

      {/* ===== TAB PARTNER ===== */}
      {activeTab === 'partner' && (
        <>
          {/* Form điều kiện */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Điều kiện báo cáo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Đối tác <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={selectedPartner}
                  onChange={e => { setSelectedPartner(e.target.value); setHasPartnerPreview(false) }}
                  style={inputStyle}>
                  <option value="">-- Chọn đối tác --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.totalVouchers} thẻ)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Từ ngày (giao dịch)</label>
                <input type="date" value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setHasPartnerPreview(false) }}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Đến ngày (giao dịch)</label>
                <input type="date" value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setHasPartnerPreview(false) }}
                  style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handlePartnerPreview} disabled={loading || !selectedPartner} style={btnPreview}>
                {loading ? 'Đang tải...' : ' Xem trước'}
              </button>
              <button onClick={handleExportPartner} disabled={loading || !selectedPartner} style={btnExport}>
                {loading ? 'Đang xử lý...' : 'Xuất Excel'}
              </button>
            </div>
          </div>

          {/* Preview partner */}
          {hasPartnerPreview && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                <SummaryCard label="Tổng số thẻ" value={String(partnerPreview.length)} color="#2563eb" />
                <SummaryCard label="Tổng phát hành" value={formatMoney(partnerTotalIssued)} color="#7c3aed" />
                <SummaryCard label="Tổng đã dùng" value={formatMoney(partnerTotalSpent)} color="#dc2626" />
                <SummaryCard label="Tổng còn lại" value={formatMoney(partnerTotalRemaining)} color="#16a34a" />
              </div>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                    {partners.find(p => p.id === selectedPartner)?.name}
                  </h3>
                  <span style={{ fontSize: 13, color: '#999' }}>{partnerPreview.length} thẻ</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                        <Th>STT</Th>
                        <Th>Mã thẻ</Th>
                        <Th>Họ và tên</Th>
                        <Th>SĐT</Th>
                        <Th>Mức voucher</Th>
                        <Th>Đã chi tiêu</Th>
                        <Th>Số dư còn lại</Th>
                        <Th>Số lần mua</Th>
                        <Th>Trạng thái</Th>
                        <Th>Hạn sử dụng</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerPreview.map((row, i) => (
                        <tr key={row.voucherCode} style={{
                          borderBottom: '1px solid #f5f5f5',
                          background: i % 2 === 0 ? 'white' : '#fafafa',
                        }}>
                          <Td style={{ color: '#999', textAlign: 'center' }}>{i + 1}</Td>
                          <Td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{row.voucherCode}</span></Td>
                          <Td>{row.holderName}</Td>
                          <Td style={{ color: '#666' }}>{row.holderPhone}</Td>
                          <Td style={{ color: '#666' }}>{formatMoney(row.initialAmount)}</Td>
                          <Td><span style={{ color: '#dc2626', fontWeight: 600 }}>{formatMoney(row.totalSpent)}</span></Td>
                          <Td><span style={{ color: '#16a34a', fontWeight: 700 }}>{formatMoney(row.balance)}</span></Td>
                          <Td style={{ textAlign: 'center' }}>{row.txCount}</Td>
                          <Td>
                            <span style={{
                              background: row.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                              color: row.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                              padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            }}>
                              {translateStatus(row.status)}
                            </span>
                          </Td>
                          <Td style={{ color: '#666', fontSize: 13 }}>{row.expiresAt}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== TAB STORE ===== */}
      {activeTab === 'store' && (
        <>
          {/* Form điều kiện */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Điều kiện báo cáo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Cửa hàng</label>
                <select value={selectedStore}
                  onChange={e => { setSelectedStore(e.target.value); setHasStorePreview(false) }}
                  style={inputStyle}>
                  <option value="">Tất cả cửa hàng</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.storeCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Từ ngày</label>
                <input type="date" value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setHasStorePreview(false) }}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Đến ngày</label>
                <input type="date" value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setHasStorePreview(false) }}
                  style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleStorePreview} disabled={loading} style={btnPreview}>
                {loading ? 'Đang tải...' : ' Xem trước'}
              </button>
              <button onClick={handleExportStore} disabled={loading} style={btnExport}>
                {loading ? 'Đang xử lý...' : ' Xuất Excel'}
              </button>
            </div>
          </div>

          {/* Preview store */}
          {hasStorePreview && (
            <>
              {/* Tổng kết */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <SummaryCard label="Tổng giao dịch" value={String(storeTotalTx)} color="#2563eb" />
                <SummaryCard label="Tổng doanh thu" value={formatMoney(storeTotalRevenue)} color="#16a34a" />
              </div>

              {/* Bảng theo từng cửa hàng */}
              {storePreview.map(store => (
                <div key={store.storeCode} style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #eee', overflow: 'hidden', marginBottom: 20,
                }}>
                  {/* Header cửa hàng */}
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fafafa',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
                        🏪 {store.storeName}
                      </span>
                      <span style={{ marginLeft: 10, fontSize: 12, color: '#999' }}>
                        {store.storeCode}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>
                        <strong>{store.txCount}</strong> giao dịch
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                        {formatMoney(store.totalRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách giao dịch */}
                  {store.transactions.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
                      Không có giao dịch trong khoảng thời gian này
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                            <Th>STT</Th>
                            <Th>Mã đơn</Th>
                            <Th>Mã thẻ</Th>
                            <Th>Khách hàng</Th>
                            <Th>Đối tác</Th>
                            <Th>Số tiền</Th>
                            <Th>Số dư còn lại</Th>
                            <Th>Thời gian</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {store.transactions.map((t, i) => (
                            <tr key={t.orderCode} style={{
                              borderBottom: '1px solid #f5f5f5',
                              background: i % 2 === 0 ? 'white' : '#fafafa',
                            }}>
                              <Td style={{ color: '#999', textAlign: 'center' }}>{i + 1}</Td>
                              <Td><span style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>{t.orderCode}</span></Td>
                              <Td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{t.voucherCode}</span></Td>
                              <Td>{t.holderName}</Td>
                              <Td>
                                <span style={{
                                  background: '#eff6ff', color: '#2563eb',
                                  padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                }}>
                                  {t.partner}
                                </span>
                              </Td>
                              <Td><span style={{ color: '#dc2626', fontWeight: 700 }}>{formatMoney(t.amount)}</span></Td>
                              <Td><span style={{ color: '#16a34a', fontWeight: 600 }}>{formatMoney(t.balanceAfter)}</span></Td>
                              <Td style={{ color: '#999', fontSize: 12 }}>{t.createdAt}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>{children}</th>
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap', ...style }}>{children}</td>
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', boxSizing: 'border-box', background: 'white',
}

const btnPreview: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 10, border: '2px solid #2563eb',
  background: 'white', color: '#2563eb', fontWeight: 700,
  fontSize: 14, cursor: 'pointer',
}

const btnExport: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 10, border: 'none',
  background: '#16a34a', color: 'white', fontWeight: 700,
  fontSize: 14, cursor: 'pointer',
}