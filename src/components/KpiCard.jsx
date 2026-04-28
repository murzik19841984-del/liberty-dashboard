import { fmtM, fmtPct, fmtNum, deltaColor, deltaArrow } from '../utils/format';

export function KpiCard({ label, value, format = 'money', delta = null, badge = null, accentColor = '#1E3A5F', invertedPositive = false }) {
  const formatted = format === 'money' ? fmtM(value)
    : format === 'pct' ? fmtPct(value)
    : format === 'num' ? fmtNum(value)
    : value;

  const deltaFormatted = delta !== null ? (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '%' : null;
  const dColor = deltaColor(delta, invertedPositive);
  const dArrow = deltaArrow(delta, invertedPositive);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold" style={{ color: accentColor, fontFamily: 'Montserrat' }}>
        {value !== null ? formatted : '—'}
      </div>
      {deltaFormatted && (
        <div className={`text-sm font-medium ${dColor}`}>
          {dArrow} {deltaFormatted}
        </div>
      )}
      {badge && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${badge.green ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}
