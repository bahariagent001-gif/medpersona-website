import Link from "next/link"
import { InboxIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-12"}`}>
      <div className="mb-3 text-gray-300">
        {icon || <InboxIcon className="h-10 w-10" />}
      </div>
      <p className="font-medium text-gray-500">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-400">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-lg bg-teal-dark px-4 py-2 text-sm font-medium text-white hover:bg-teal"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
