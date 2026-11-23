import { fmtM, fmtPct, fmtNum } from '../utils/format';

export function KpiCard({ label, value, format = 'money', delta = null, badge = null, invertedPositive = false }) {
  const formatted =
    format === 'money' ? fmtM(value)
    : format === 'pct' ? fmtPct(value)
    : format === 'num' ? fmtNum(value)
    : value;

  const deltaFormatted = delta !== null
    ? (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '%'
    : null;
  const isPositive = delta !== null && (invertedPositive ? delta < 0 : delta > 0);

  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value !== null && value !== undefined ? formatted : '—'}</div>
      {deltaFormatted && (
        <div className={`kpi-delta ${isPositive ? 'positive' : 'negative'}`}>
          {delta >= 0 ? '↑' : '↓'} {deltaFormatted}
        </div>
      )}
      {badge && (
        <span className={`kpi-tag ${badge.green ? 'kpi-tag--ok' : 'kpi-tag--warn'}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}
