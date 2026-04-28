export function ChartCard({ title, subtitle, children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      {title && <div className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Montserrat' }}>{title}</div>}
      {subtitle && <div className="text-xs text-gray-400 mb-4">{subtitle}</div>}
      {children}
    </div>
  );
}
