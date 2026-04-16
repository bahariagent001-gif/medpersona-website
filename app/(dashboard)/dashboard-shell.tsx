"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  userName: string
  userRole: string
}

export function DashboardShell({ children, userName, userRole }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - desktop */}
      <div className="hidden lg:block">
        <Sidebar userRole={userRole} />
      </div>

      {/* Sidebar - mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar userRole={userRole} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
