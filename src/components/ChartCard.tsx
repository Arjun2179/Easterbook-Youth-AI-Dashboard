interface ChartCardProps {
  num: string;
  title: string;
  subtitle: string;
  color: string;
  insight: string;
  children: React.ReactNode;
}

export default function ChartCard({ num, title, subtitle, color, insight, children }: ChartCardProps) {
  return (
    <div className="chart-card-shell" style={{ borderTopColor: color }}>
      <div className="chart-card-header">
        <div className="chart-card-number" style={{ background: color }}>
          {num}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          <span className="chart-card-title">{title}</span>
          <span className="chart-card-subtitle">{subtitle}</span>
        </div>
      </div>
      <div className="chart-card-body">{children}</div>
      {insight && (
        <div className="chart-insight-bar" style={{ borderLeftColor: color }}>
          {insight}
        </div>
      )}
    </div>
  );
}
