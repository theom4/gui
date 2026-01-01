import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartProps {
  data: any[];
  loading: boolean;
  error: string | null;
}

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode; loading: boolean; error: string | null }> = ({ title, children, loading, error }) => (
  <Card className="col-span-full lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            Error: {error}
          </div>
        ) : (
          children
        )}
      </div>
    </CardContent>
  </Card>
);

export function RevenueChart({ data, loading, error }: ChartProps) {
  return (
    <ChartWrapper title="Volum Apeluri" loading={loading} error={error}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 24]}
            tickFormatter={(value) => `${value}:00`}
          />
          <Line 
            type="monotone" 
            dataKey="peakHour" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            name="Ora de vârf"
          />
          <Line 
            type="monotone" 
            dataKey="avgHour" 
            stroke="hsl(var(--primary-glow))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Ora medie"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function VisitorChart({ data, loading, error }: ChartProps) {
  return (
    <ChartWrapper title="Minute apeluri" loading={loading} error={error}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 1000]}
          />
          <Bar 
            dataKey="visits" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function DeviceChart({ data, loading, error }: ChartProps) {
  const pieColors = ['hsl(210, 75%, 60%)', 'hsl(180, 70%, 55%)', 'hsl(160, 65%, 60%)', 'hsl(140, 60%, 65%)'];

  return (
    <ChartWrapper title="Subiect Apeluri" loading={loading} error={error}>
      <>
        <ResponsiveContainer width="100%" height="70%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: pieColors[index % pieColors.length] }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </>
    </ChartWrapper>
  )
}

