import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as unknown as { data: ProfileRow | null }

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-hd-red px-6 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{profile?.full_name ?? 'Pelanggan'}</h1>
            <p className="text-red-200 text-sm">{user.email}</p>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full capitalize">
              {profile?.tier ?? 'Silver'} Member
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm grid grid-cols-2 divide-x divide-gray-100 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-hd-red">{profile?.loyalty_points ?? 0}</p>
            <p className="text-xs text-gray-500">Total Poin</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-hd-dark capitalize">{profile?.tier ?? 'Silver'}</p>
            <p className="text-xs text-gray-500">Tier Member</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-4 py-4 space-y-2">
        {[
          { icon: '📱', label: 'Edit Profil' },
          { icon: '🔔', label: 'Notifikasi' },
          { icon: '📍', label: 'Alamat Pengiriman' },
          { icon: '❓', label: 'Bantuan & FAQ' },
          { icon: '📄', label: 'Syarat & Ketentuan' },
        ].map(item => (
          <button
            key={item.label}
            className="w-full bg-white rounded-xl px-4 py-3 flex items-center gap-3 text-left shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="ml-auto text-gray-300">›</span>
          </button>
        ))}

        <LogoutButton />
      </div>

      <p className="text-center text-xs text-gray-300 pb-4">
        HD App MVP v0.1.0 · Built with ❤️ by MRA Media
      </p>
    </div>
  )
}
