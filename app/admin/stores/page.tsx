'use client'

import { useEffect, useState } from 'react'

interface Store {
  id: string
  storeCode: string
  name: string
  location: string | null
  isActive: boolean
  createdAt: string
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ storeCode: '', name: '', location: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editStore, setEditStore] = useState<Store | null>(null)
  const [editForm, setEditForm] = useState({ name: '', location: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => { fetchStores() }, [])

  function getToken() { return localStorage.getItem('token') || '' }

  async function fetchStores() {
    setLoading(true)
    try {
      const res = await fetch('/api/stores', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setStores(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setError('')
    if (!form.storeCode || !form.name) { setError('Vui lòng nhập đầy đủ thông tin'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      setForm({ storeCode: '', name: '', location: '' })
      fetchStores()
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editStore) return
    setEditError('')
    if (!editForm.name) { setEditError('Vui lòng nhập tên cửa hàng'); return }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/stores/${editStore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error); return }
      setEditStore(null)
      fetchStores()
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleActive(store: Store) {
  try {
    await fetch(`/api/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ isActive: !store.isActive }),
    })
    fetchStores()
  } catch {}
}

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Quản Lý Cửa Hàng</h1>
          <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {stores.length} cửa hàng</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600,
          fontSize: 14, cursor: 'pointer',
        }}>
          + Thêm cửa hàng
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Thêm cửa hàng mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Mã cửa hàng</label>
              <input value={form.storeCode} onChange={e => setForm({ ...form, storeCode: e.target.value })}
                placeholder="VD: CH001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tên cửa hàng</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Cửa hàng 57 Lê Duẩn" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Địa chỉ</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="VD: Đà Nẵng" style={inputStyle} />
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
              {saving ? 'Đang lưu...' : 'Tạo cửa hàng'}
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

      {editStore && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  }}>
    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 440, width: '90%' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Sửa cửa hàng: <span style={{ color: '#E8440A' }}>{editStore.storeCode}</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Tên cửa hàng</label>
          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Tên cửa hàng" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Địa chỉ</label>
          <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}
            placeholder="Địa chỉ" style={inputStyle} />
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
        <button onClick={() => setEditStore(null)} style={{
          padding: '10px 24px', borderRadius: 10, border: '1px solid #eee',
          background: 'white', color: '#666', fontWeight: 600, cursor: 'pointer',
        }}>
          Hủy
        </button>
      </div>
    </div>
  </div>
)}
    
      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Th>Mã</Th>
                <Th>Tên cửa hàng</Th>
                <Th>Địa chỉ</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, i) => (
                <tr key={store.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <Td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E8440A' }}>
                      {store.storeCode}
                    </span>
                  </Td>
                  <Td><span style={{ fontWeight: 600 }}>{store.name}</span></Td>
                  <Td style={{ color: '#666' }}>{store.location || '—'}</Td>
                  <Td>
                    <span style={{
                      background: store.isActive ? '#f0fdf4' : '#fef2f2',
                      color: store.isActive ? '#16a34a' : '#dc2626',
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {store.isActive ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                  </Td>

                  <Td style={{ color: '#999', fontSize: 13 }}>
                    {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                  </Td>
                  <Td>
  <div style={{ display: 'flex', gap: 6 }}>
    <button onClick={() => {
      setEditStore(store)
      setEditForm({ name: store.name, location: store.location || '' })
      setEditError('')
    }} style={{
      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb',
    }}>
      ✏️ Sửa
    </button>
    <button onClick={() => toggleActive(store)} style={{
      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: '1px solid ' + (store.isActive ? '#fca5a5' : '#86efac'),
      background: store.isActive ? '#fef2f2' : '#f0fdf4',
      color: store.isActive ? '#dc2626' : '#16a34a',
    }}>
      {store.isActive ? 'Khóa' : 'Mở khóa'}
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