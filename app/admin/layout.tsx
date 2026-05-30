'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
// Import các icon hiện đại từ Lucide
import { 
  LayoutDashboard, 
  FileUp, 
  Ticket, 
  ReceiptText, 
  Store, 
  Users, 
  Handshake,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Cấu trúc lại menuItems, chuyển icon từ chuỗi Emoji sang Component Lucide
const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/import', icon: FileUp, label: 'Import Thẻ' },
  { href: '/admin/vouchers', icon: Ticket, label: 'Danh Sách Thẻ' },
  { href: '/admin/transactions', icon: ReceiptText, label: 'Lịch Sử Giao Dịch' },
  { href: '/admin/stores', icon: Store, label: 'Quản Lý Cửa Hàng' },
  { href: '/admin/users', icon: Users, label: 'Quản Lý User' },
  { href: '/admin/partners', icon: Handshake, label: 'Quản Lý Partner' },
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
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Toggle khi collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
            <ChevronRight size={18} />
          </button>
        )}

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon // Gán tạm vào một biến viết hoa để render thành component
            
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12, // Tăng nhẹ gap cho thoáng
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
                  {/* Render Icon động, tự đổi màu theo trạng thái Active */}
                  <IconComponent size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
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
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{user.username}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Quản trị viên</div>
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
            transition: 'background 0.2s',
          }}>
            <LogOut size={16} />
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