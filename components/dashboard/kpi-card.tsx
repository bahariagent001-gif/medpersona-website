import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, change, changeLabel, icon, className }: KpiCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-navy-dark">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
              {isNeutral && <Minus className="h-3.5 w-3.5 text-gray-400" />}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive && "text-emerald-600",
                  isNegative && "text-red-600",
                  isNeutral && "text-gray-400"
                )}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-teal-light p-2.5 text-teal-dark">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
