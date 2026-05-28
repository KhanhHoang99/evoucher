'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const menuItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/import', icon: '📥', label: 'Import thẻ' },
  { href: '/admin/vouchers', icon: '🎫', label: 'Danh sách thẻ' },
  { href: '/admin/transactions', icon: '📋', label: 'Lịch sử giao dịch' },
  { href: '/admin/stores', icon: '🏪', label: 'Quản lý cửa hàng' },
  { href: '/admin/users', icon: '👥', label: 'Quản lý user' },
  { href: '/admin/partners', icon: '🤝', label: 'Quản lý partner' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'ADMIN') { router.push('/login'); return }
    setUser(parsed)
  }, [])

  function handleLogout() {
    localStorage.clear()
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7f5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        width: collapsed ? 64 : 240,
        background: 'white',
        borderRight: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#E8440A', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>BQ</span>
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>eVoucher</div>
                <div style={{ fontSize: 11, color: '#999' }}>Admin Panel</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>
              ◀
            </button>
          )}
        </div>

        {/* Toggle khi collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: 16, padding: '8px 0' }}>
            ▶
          </button>
        )}

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: 10,
                  marginBottom: 4,
                  background: isActive ? '#fff1ec' : 'transparent',
                  color: isActive ? '#E8440A' : '#555',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #eee',
        }}>
          {!collapsed && user && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{user.username}</div>
              <div style={{ fontSize: 11, color: '#999' }}>Quản trị viên</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: collapsed ? '8px' : '8px 12px',
            borderRadius: 8, border: '1px solid #eee',
            background: 'white', color: '#666',
            fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
          }}>
            <span>🚪</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        marginLeft: collapsed ? 64 : 240,
        flex: 1,
        transition: 'margin-left 0.2s',
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </div>
  )
}