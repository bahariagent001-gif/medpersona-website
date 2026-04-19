"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Target,
  Megaphone,
  Calendar,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  Receipt,
  TrendingUp,
  Wallet,
  BookOpen,
  CreditCard,
  FileSpreadsheet,
  PieChart,
  ImageIcon,
  Sparkles,
  Search,
  Hash,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  children?: { label: string; href: string }[]
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Keuangan",
    href: "/keuangan",
    icon: <DollarSign className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Ringkasan", href: "/keuangan" },
      { label: "Laba Rugi", href: "/keuangan/laba-rugi" },
      { label: "Neraca", href: "/keuangan/neraca" },
      { label: "Arus Kas", href: "/keuangan/arus-kas" },
      { label: "Pendapatan", href: "/keuangan/pendapatan" },
      { label: "Pengeluaran", href: "/keuangan/pengeluaran" },
      { label: "Tagihan", href: "/keuangan/tagihan" },
      { label: "Catatan", href: "/keuangan/catatan" },
    ],
  },
  {
    label: "Dokter",
    href: "/dokter",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    label: "Konten",
    href: "/konten",
    icon: <Calendar className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Semua Konten", href: "/konten" },
      { label: "Kalender", href: "/konten/kalender" },
      { label: "Aset", href: "/konten/aset" },
    ],
  },
  {
    label: "Persetujuan",
    href: "/persetujuan",
    icon: <CheckSquare className="h-5 w-5" />,
    children: [
      { label: "Konten Dokter", href: "/persetujuan" },
      { label: "Growth (Iklan/SEO/Outreach)", href: "/persetujuan/growth" },
    ],
  },
  {
    label: "Langganan",
    href: "/langganan",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "CRM",
    href: "/crm",
    icon: <Target className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    label: "Iklan",
    href: "/iklan",
    icon: <Megaphone className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Ringkasan", href: "/iklan" },
      { label: "Kreatif", href: "/iklan/kreatif" },
      { label: "Performa Harian", href: "/iklan/performa" },
    ],
  },
  {
    label: "Organic",
    href: "/organic",
    icon: <Hash className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Ringkasan", href: "/organic" },
      { label: "Hashtag", href: "/organic/hashtag" },
      { label: "Kompetitor", href: "/organic/kompetitor" },
    ],
  },
  {
    label: "SEO",
    href: "/seo",
    icon: <Search className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Ringkasan", href: "/seo" },
      { label: "Keyword", href: "/seo/keyword" },
      { label: "Halaman", href: "/seo/halaman" },
    ],
  },
  {
    label: "Lead Hunter",
    href: "/leads",
    icon: <Sparkles className="h-5 w-5" />,
    adminOnly: true,
    children: [
      { label: "Prospek", href: "/leads" },
      { label: "Outreach", href: "/leads/outreach" },
    ],
  },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || ["super_admin", "admin", "staff"].includes(userRole)
  )

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {!collapsed && (
          <Link href="/dashboard">
            <Image src="/logo.png" alt="MedPersona" width={40} height={40} className="h-10 w-10 object-contain" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-dark"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const isExpanded = expandedSection === item.label

            return (
              <li key={item.href}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-teal-light text-teal-dark"
                          : "text-gray-600 hover:bg-gray-50 hover:text-navy-dark"
                      )}
                    >
                      {item.icon}
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                                pathname === child.href
                                  ? "font-medium text-teal-dark"
                                  : "text-gray-500 hover:text-navy-dark"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-teal-light text-teal-dark"
                        : "text-gray-600 hover:bg-gray-50 hover:text-navy-dark"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
