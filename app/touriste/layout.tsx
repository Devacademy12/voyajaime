'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

const navItems = [
  { href: '/touriste', label: 'Accueil', icon: '🏠' },
  { href: '/touriste/itineraire/nouveau', label: 'Planifier', icon: '🗺️' },
  { href: '/touriste/itineraire', label: 'Mes itinéraires', icon: '📅' },
  { href: '/touriste/favoris', label: 'Mes favoris', icon: '❤️' },
  { href: '/touriste/reservations', label: 'Réservations', icon: '🎫' },
  { href: '/touriste/profil', label: 'Mon profil', icon: '👤' },
]

export default function TouristeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#0EA5C5"/>
              <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>voyaj'aime</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>
            Espace Touriste
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/touriste' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                color: isActive ? '#0EA5C5' : '#6B7280',
                background: isActive ? '#F0F9FF' : 'transparent',
                borderRight: isActive ? '3px solid #0EA5C5' : '3px solid transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', background: 'none', border: '1px solid #E5E7EB',
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#6B7280',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            🚪 Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>
        {children}
      </main>
    </div>
  )
}