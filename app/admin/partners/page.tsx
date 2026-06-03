'use client'

import { useEffect, useState } from 'react'
import { Pencil, ShieldAlert, ShieldCheck } from 'lucide-react'

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

  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [editForm, setEditForm] = useState({ name: '', note: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

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

  async function handleEdit() {
    if (!editPartner) return
    setEditError('')
    if (!editForm.name) { setEditError('Vui lòng nhập tên partner'); return }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/partners/${editPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error); return }
      setEditPartner(null)
      fetchPartners()
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleActive(partner: Partner) {
  try {
    await fetch(`/api/partners/${partner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ isActive: !partner.isActive }),
    })
    fetchPartners()
  } catch {}
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

      {editPartner && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  }}>
    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 440, width: '90%' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Sửa partner: <span style={{ color: '#E8440A' }}>{editPartner.name}</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Tên đối tác</label>
          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Tên đối tác" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ghi chú</label>
          <input value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })}
            placeholder="Ghi chú (không bắt buộc)" style={inputStyle} />
        </div>
      </div>
      {editError && (
        <div style={{ background: '#fff1f0', color: '#cf1322', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 10 }}>
          ⚠️ {editError}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={handleEdit} disabled={editSaving} style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600, cursor: 'pointer',
        }}>
          {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        <button onClick={() => setEditPartner(null)} style={{
          padding: '10px 24px', borderRadius: 10, border: '1px solid #eee',
          background: 'white', color: '#666', fontWeight: 600, cursor: 'pointer',
        }}>
          Hủy
        </button>
      </div>
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
                <Th>Thao tác</Th>
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
                  
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Nút Sửa */}
                      <button 
                        onClick={() => {
                          setEditPartner(partner)
                          setEditForm({ name: partner.name, note: partner.note || '' })
                          setEditError('')
                        }} 
                        style={{
                          padding: '6px 12px', 
                          borderRadius: 8, 
                          fontSize: 12, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          border: '1px solid #bfdbfe', 
                          background: '#eff6ff', 
                          color: '#2563eb',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dbeafe';
                          e.currentTarget.style.borderColor = '#93c5fd';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.borderColor = '#bfdbfe';
                        }}
                      >
                        <Pencil size={13} strokeWidth={2} />
                        <span>Sửa</span>
                      </button>

                      {/* Nút Khóa / Mở khóa Partner */}
                      <button 
                        onClick={() => toggleActive(partner)} 
                        style={{
                          padding: '6px 12px', 
                          borderRadius: 8, 
                          fontSize: 12, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          border: '1px solid ' + (partner.isActive ? '#fca5a5' : '#86efac'),
                          background: partner.isActive ? '#fef2f2' : '#f0fdf4',
                          color: partner.isActive ? '#dc2626' : '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (partner.isActive) {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          } else {
                            e.currentTarget.style.background = '#dcfce7';
                            e.currentTarget.style.borderColor = '#86efac';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (partner.isActive) {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          } else {
                            e.currentTarget.style.background = '#f0fdf4';
                            e.currentTarget.style.borderColor = '#86efac';
                          }
                        }}
                      >
                        {/* Render icon động dựa trên trạng thái hoạt động của Partner */}
                        {partner.isActive ? (
                          <>
                            <ShieldAlert size={13} strokeWidth={2} />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={13} strokeWidth={2} />
                            <span>Mở khóa</span>
                          </>
                        )}
                      </button>
                    </div>
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