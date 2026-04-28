import { MONTH_NAMES } from '../constants';

export function fmtM(v, digits = 1) {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v < 0 ? '-' : '') + (abs / 1_000_000).toFixed(digits) + ' M₽';
  if (abs >= 1_000) return (v < 0 ? '-' : '') + Math.round(abs / 1_000) + ' k₽';
  return Math.round(v) + ' ₽';
}

export function fmtPct(v, digits = 0) {
  if (v === null || v === undefined) return '—';
  // stored as 0.xx fraction
  const pct = Math.abs(v) <= 1 ? v * 100 : v;
  return (v < 0 ? '-' : '') + Math.abs(pct).toFixed(digits) + '%';
}

export function fmtNum(v) {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('ru-RU');
}

export function fmtMonthLabel(m) {
  // m = 'YYYY-MM'
  const [, mm] = m.split('-');
  return MONTH_NAMES[mm] || m;
}

export function fmtDelta(current, previous) {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function deltaColor(delta, invertedPositive = false) {
  if (delta === null) return 'text-gray-400';
  const positive = invertedPositive ? delta < 0 : delta > 0;
  return positive ? 'text-emerald-500' : 'text-red-500';
}

export function deltaArrow(delta, invertedPositive = false) {
  if (delta === null) return '';
  const positive = invertedPositive ? delta < 0 : delta > 0;
  return positive ? '↑' : '↓';
}
