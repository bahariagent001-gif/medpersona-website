"use client"

import { useState, use, Suspense } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import type { AuthData } from "./layout"

function UserAwareShell({
  authPromise,
  children,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  authPromise: Promise<AuthData>
  children: React.ReactNode
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
}) {
  const { user, profile } = use(authPromise)
  const userName = profile?.full_name || user?.email || "User"
  const userRole = profile?.role || "doctor"

  return (
    <>
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
    </>
  )
}

function ShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-64 shrink-0 border-r border-gray-100 bg-white" />
      {/* Main content with topbar skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-16 shrink-0 border-b border-gray-100 bg-white" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </>
  )
}

export function DashboardShell({
  authPromise,
  children,
}: {
  authPromise: Promise<AuthData>
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Suspense fallback={<ShellSkeleton>{children}</ShellSkeleton>}>
        <UserAwareShell
          authPromise={authPromise}
          children={children}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </Suspense>
    </div>
  )
}
