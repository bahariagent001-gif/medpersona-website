"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            className="w-64 border-0 bg-transparent text-sm text-navy-dark placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 lg:block">
            /
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-dark">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

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
