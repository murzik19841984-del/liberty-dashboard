export function ChartCard({ title, subtitle, children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`chart-section ${className}`}>
      {(title || subtitle) && (
        <div className="chart-header">
          {title    && <div className="chart-title">{title}</div>}
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
