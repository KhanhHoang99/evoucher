'use client'

import { useEffect, useState } from 'react'

interface Partner {
  id: string
  name: string
  note: string | null
  isActive: boolean
  createdAt: string
  totalVouchers: number
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchPartners() }, [])

  function getToken() { return localStorage.getItem('token') || '' }

  async function fetchPartners() {
    setLoading(true)
    try {
      const res = await fetch('/api/partners', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setPartners(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setError('')
    if (!form.name) { setError('Vui lòng nhập tên partner'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      setForm({ name: '', note: '' })
      fetchPartners()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Quản lý partner</h1>
          <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {partners.length} đối tác</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600,
          fontSize: 14, cursor: 'pointer',
        }}>
          + Thêm partner
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Thêm partner mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tên đối tác</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Cảng Đà Nẵng" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ghi chú</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Ghi chú thêm (không bắt buộc)" style={inputStyle} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff1f0', color: '#cf1322', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCreate} disabled={saving} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: '#E8440A', color: 'white', fontWeight: 600, cursor: 'pointer',
            }}>
              {saving ? 'Đang lưu...' : 'Tạo partner'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 24px', borderRadius: 10, border: '1px solid #eee',
              background: 'white', color: '#666', fontWeight: 600, cursor: 'pointer',
            }}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Th>Tên đối tác</Th>
                <Th>Ghi chú</Th>
                <Th>Tổng thẻ</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner, i) => (
                <tr key={partner.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <Td><span style={{ fontWeight: 600 }}>{partner.name}</span></Td>
                  <Td style={{ color: '#666' }}>{partner.note || '—'}</Td>
                  <Td>
                    <span style={{
                      background: '#fff1ec', color: '#E8440A',
                      padding: '3px 10px', borderRadius: 6,
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {partner.totalVouchers} thẻ
                    </span>
                  </Td>
                  <Td>
                    <span style={{
                      background: partner.isActive ? '#f0fdf4' : '#fef2f2',
                      color: partner.isActive ? '#16a34a' : '#dc2626',
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {partner.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </Td>
                  <Td style={{ color: '#999', fontSize: 13 }}>
                    {new Date(partner.createdAt).toLocaleDateString('vi-VN')}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666' }}>{children}</th>
}

function Td({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a', ...style }}>{children}</td>
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', boxSizing: 'border-box', background: 'white',
}