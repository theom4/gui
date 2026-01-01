import { Card } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ElementType
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend = "neutral",
  className
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success"
      case "down":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return ArrowUpIcon
      case "down":
        return ArrowDownIcon
      default:
        return null
    }
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card className={cn(
      "relative p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-card hover:scale-[1.02] animate-smooth",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {value}
          </p>
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center space-x-2 text-sm">
              {change !== undefined && TrendIcon && (
                <div className={cn("flex items-center space-x-1", getTrendColor())}>
                  <div className="rounded-full p-1 bg-current/10">
                    <TrendIcon className="h-3 w-3" />
                  </div>
                  <span className="font-medium">
                    {Math.abs(change)}%
                  </span>
                </div>
              )}
              {changeLabel && (
                <span className="text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </Card>
  )
}