'use client'

import { useAuth } from './AuthProvider'

export default function NavbarAuth() {
  const { loading, profile } = useAuth()

  if (loading) {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
  }

  if (profile) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
          {profile.display_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {profile.display_name}
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
      className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105 dark:bg-white dark:text-black"
    >
      Entrar
    </button>
  )
}
