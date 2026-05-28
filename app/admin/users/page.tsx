'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  store: { name: string; storeCode: string } | null
}

interface Store {
  id: string
  name: string
  storeCode: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', userRole: 'CASHIER', storeId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchStores()
  }, [])

  function getToken() {
    return localStorage.getItem('token') || ''
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores', {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (res.ok) setStores(data)
    } catch {}
  }

  async function handleCreate() {
    setError('')
    if (!form.username || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); return }
    if (form.userRole === 'CASHIER' && !form.storeId) { setError('Vui lòng chọn cửa hàng cho Cashier'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      setForm({ username: '', password: '', userRole: 'CASHIER', storeId: '' })
      fetchUsers()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      fetchUsers()
    } catch {}
  }

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin',
    VIEWER: 'Viewer',
    CASHIER: 'Cashier',
  }

  const roleColor: Record<string, string> = {
    ADMIN: '#E8440A',
    VIEWER: '#2563eb',
    CASHIER: '#16a34a',
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Quản lý user</h1>
          <p style={{ color: '#999', marginTop: 4 }}>Tổng cộng {users.length} tài khoản</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#E8440A', color: 'white', fontWeight: 600,
          fontSize: 14, cursor: 'pointer',
        }}>
          + Thêm user
        </button>
      </div>

      {/* Form thêm user */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #eee',
          padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Thêm tài khoản mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tên đăng nhập</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Nhập tên đăng nhập" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mật khẩu</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Nhập mật khẩu" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vai trò</label>
              <select value={form.userRole} onChange={e => setForm({ ...form, userRole: e.target.value, storeId: '' })}
                style={inputStyle}>
                <option value="CASHIER">Cashier — Nhân viên cửa hàng</option>
                <option value="VIEWER">Viewer — Xem báo cáo</option>
                <option value="ADMIN">Admin — Quản trị viên</option>
              </select>
            </div>
            {form.userRole === 'CASHIER' && (
              <div>
                <label style={labelStyle}>Cửa hàng</label>
                <select value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })}
                  style={inputStyle}>
                  <option value="">-- Chọn cửa hàng --</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.storeCode})</option>
                  ))}
                </select>
              </div>
            )}
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
              {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
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

      {/* Danh sách user */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Th>Tên đăng nhập</Th>
                <Th>Vai trò</Th>
                <Th>Cửa hàng</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <Td>
                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                  </Td>
                  <Td>
                    <span style={{
                      background: roleColor[user.role] + '15',
                      color: roleColor[user.role],
                      padding: '3px 10px', borderRadius: 6,
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {roleLabel[user.role]}
                    </span>
                  </Td>
                  <Td>{user.store ? `${user.store.name}` : '—'}</Td>
                  <Td>
                    <span style={{
                      background: user.isActive ? '#f0fdf4' : '#fef2f2',
                      color: user.isActive ? '#16a34a' : '#dc2626',
                      padding: '3px 10px', borderRadius: 6,
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </Td>
                  <Td style={{ color: '#999', fontSize: 13 }}>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </Td>
                  <Td>
                    <button onClick={() => toggleActive(user)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: '1px solid ' + (user.isActive ? '#fca5a5' : '#86efac'),
                      background: user.isActive ? '#fef2f2' : '#f0fdf4',
                      color: user.isActive ? '#dc2626' : '#16a34a',
                      cursor: 'pointer',
                    }}>
                      {user.isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
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