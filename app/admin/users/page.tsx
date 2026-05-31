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

  // Form thêm mới
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', userRole: 'CASHIER', storeId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form sửa
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ userRole: '', storeId: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Form reset mật khẩu
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchStores()
  }, [])

  function getToken() { return localStorage.getItem('token') || '' }

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
    if (!form.username || !form.password) { setError('Vui lòng nhập đầy đủ'); return }
    if (form.userRole === 'CASHIER' && !form.storeId) { setError('Vui lòng chọn cửa hàng'); return }
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

  async function handleEdit() {
    if (!editUser) return
    setEditError('')
    if (editForm.userRole === 'CASHIER' && !editForm.storeId) {
      setEditError('Vui lòng chọn cửa hàng cho Cashier')
      return
    }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          role: editForm.userRole,
          storeId: editForm.userRole === 'CASHIER' ? editForm.storeId : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error); return }
      setEditUser(null)
      fetchUsers()
    } finally {
      setEditSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!resetUser) return
    setResetError('')
    setResetSuccess('')
    if (!newPassword || newPassword.length < 6) {
      setResetError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setResetSaving(true)
    try {
      const res = await fetch(`/api/users/${resetUser.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setResetError(data.error); return }
      setResetSuccess(data.message)
      setNewPassword('')
      setTimeout(() => { setResetUser(null); setResetSuccess('') }, 2000)
    } finally {
      setResetSaving(false)
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

  const roleLabel: Record<string, string> = { ADMIN: 'Admin', VIEWER: 'Viewer', CASHIER: 'Cashier' }
  const roleColor: Record<string, string> = { ADMIN: '#E8440A', VIEWER: '#2563eb', CASHIER: '#16a34a' }

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
          background: '#E8440A', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          + Thêm user
        </button>
      </div>

      {/* Form thêm mới */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
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
              <select value={form.userRole} onChange={e => setForm({ ...form, userRole: e.target.value, storeId: '' })} style={inputStyle}>
                <option value="CASHIER">Cashier — Nhân viên cửa hàng</option>
                <option value="VIEWER">Viewer — Xem báo cáo</option>
                <option value="ADMIN">Admin — Quản trị viên</option>
              </select>
            </div>
            {form.userRole === 'CASHIER' && (
              <div>
                <label style={labelStyle}>Cửa hàng</label>
                <select value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })} style={inputStyle}>
                  <option value="">-- Chọn cửa hàng --</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.storeCode})</option>)}
                </select>
              </div>
            )}
          </div>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCreate} disabled={saving} style={btnPrimary}>
              {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Hủy</button>
          </div>
        </div>
      )}

      {/* Modal sửa user */}
      {editUser && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              Sửa tài khoản: <span style={{ color: '#E8440A' }}>{editUser.username}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Vai trò</label>
                <select value={editForm.userRole}
                  onChange={e => setEditForm({ ...editForm, userRole: e.target.value, storeId: '' })}
                  style={inputStyle}>
                  <option value="CASHIER">Cashier — Nhân viên cửa hàng</option>
                  <option value="VIEWER">Viewer — Xem báo cáo</option>
                  <option value="ADMIN">Admin — Quản trị viên</option>
                </select>
              </div>
              {editForm.userRole === 'CASHIER' && (
                <div>
                  <label style={labelStyle}>Cửa hàng</label>
                  <select value={editForm.storeId}
                    onChange={e => setEditForm({ ...editForm, storeId: e.target.value })}
                    style={inputStyle}>
                    <option value="">-- Chọn cửa hàng --</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.storeCode})</option>)}
                  </select>
                </div>
              )}
            </div>
            {editError && <ErrorBox msg={editError} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleEdit} disabled={editSaving} style={btnPrimary}>
                {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button onClick={() => setEditUser(null)} style={btnSecondary}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reset mật khẩu */}
      {resetUser && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Reset mật khẩu: <span style={{ color: '#E8440A' }}>{resetUser.username}</span>
            </h3>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
              Nhập mật khẩu mới cho tài khoản này
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              style={inputStyle}
            />
            {resetError && <ErrorBox msg={resetError} />}
            {resetSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 10 }}>
                ✅ {resetSuccess}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleResetPassword} disabled={resetSaving} style={btnPrimary}>
                {resetSaving ? 'Đang lưu...' : '🔑 Reset mật khẩu'}
              </button>
              <button onClick={() => { setResetUser(null); setNewPassword(''); setResetError('') }} style={btnSecondary}>
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
                  <Td><span style={{ fontWeight: 600 }}>{user.username}</span></Td>
                  <Td>
                    <span style={{
                      background: roleColor[user.role] + '15', color: roleColor[user.role],
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {roleLabel[user.role]}
                    </span>
                  </Td>
                  <Td>{user.store ? user.store.name : '—'}</Td>
                  <Td>
                    <span style={{
                      background: user.isActive ? '#f0fdf4' : '#fef2f2',
                      color: user.isActive ? '#16a34a' : '#dc2626',
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </Td>
                  <Td style={{ color: '#999', fontSize: 13 }}>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => {
                        setEditUser(user)
                        setEditForm({ userRole: user.role, storeId: user.store ? stores.find(s => s.name === user.store?.name)?.id || '' : '' })
                        setEditError('')
                      }} style={btnEdit}>
                        ✏️ Sửa
                      </button>
                      <button onClick={() => { setResetUser(user); setNewPassword(''); setResetError('') }}
                        style={btnReset}>
                        🔑 Mật khẩu
                      </button>
                      <button onClick={() => toggleActive(user)} style={{
                        padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: '1px solid ' + (user.isActive ? '#fca5a5' : '#86efac'),
                        background: user.isActive ? '#fef2f2' : '#f0fdf4',
                        color: user.isActive ? '#dc2626' : '#16a34a',
                      }}>
                        {user.isActive ? 'Khóa' : 'Mở'}
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

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#fff1f0', border: '1px solid #ffccc7', color: '#cf1322', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginTop: 10 }}>
      ⚠️ {msg}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '2px solid #eee', fontSize: 14, color: '#1a1a1a',
  outline: 'none', boxSizing: 'border-box', background: 'white',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 10, border: 'none',
  background: '#E8440A', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14,
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 10, border: '1px solid #eee',
  background: 'white', color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: 14,
}
const btnEdit: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb',
}
const btnReset: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706',
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
}
const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 32,
  maxWidth: 440, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
}