import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface OverviewCardProps {
  title: string
  count: string
  icon: ReactNode
  progress: number
  description: string
  className?: string
}

export function OverviewCard({
  title,
  count,
  icon,
  progress,
  description,
  className
}: OverviewCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon}
        </div>
        
        <div className="text-2xl font-bold">
          {count}
        </div>
        
        <Progress 
          value={progress} 
          className="h-2 my-2" 
        />
        
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
} 