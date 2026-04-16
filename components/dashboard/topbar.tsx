"use client"

import { Menu } from "lucide-react"

interface TopbarProps {
  userName: string
  userRole: string
  onMenuToggle?: () => void
}

export function Topbar({ userName, userRole, onMenuToggle }: TopbarProps) {
  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    staff: "Staff",
    doctor: "Dokter",
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-dark flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-navy-dark">{userName}</p>
            <p className="text-xs text-gray-400">{roleLabels[userRole] || userRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
