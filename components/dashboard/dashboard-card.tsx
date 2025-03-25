interface DashboardCardProps {
  title: string;
  value: number;
  description: string;
  trend: "up" | "down" | "neutral";
}

export function DashboardCard({
  title,
  value,
  description,
  trend
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-4xl font-semibold text-gray-900">{value}</p>
        <p className="ml-2 flex items-baseline text-sm font-semibold">
          {trend === "up" && (
            <span className="text-green-600">
              ↑
            </span>
          )}
          {trend === "down" && (
            <span className="text-red-600">
              ↓
            </span>
          )}
        </p>
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
} 