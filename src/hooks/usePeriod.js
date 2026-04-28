import { useState, useMemo } from 'react';
import { SUM_INDICATORS, LAST_VALUE_INDICATORS, AVG_INDICATORS } from '../constants';
import { MONTH_NAMES } from '../constants';

// Pure helper — applies ratio recalculations on top of any aggregate function
function applyRatios(ind, agg) {
  const ratios = {
    'рентабельность_маржинальная': () => { const md = agg('маржинальный_доход'), v = agg('выручка'); return v ? md / v : null; },
    'рентабельность_валовая':      () => { const gp = agg('валовая_прибыль'),    v = agg('выручка'); return v ? gp / v : null; },
    'рентабельность_ebitda':       () => { const e  = agg('ebitda'),             v = agg('выручка'); return v ? e  / v : null; },
    'рентабельность_чп':           () => { const cp = agg('чистая_прибыль'),     v = agg('выручка'); return v ? cp / v : null; },
    'скидка_процент':              () => { const s  = agg('скидка_абс'),         v = agg('выручка'); return v ? s  / v : null; },
    'постоянные_расходы':          () => {
      const gna = agg('общепроизводственные_расходы') || 0;
      const adm = agg('административные_расходы')     || 0;
      const com = agg('коммерческие_расходы')         || 0;
      return Math.abs(gna) + Math.abs(adm) + Math.abs(com);
    },
    'операционный_рычаг': () => { const md = agg('маржинальный_доход'), e = agg('ebitda'); return e ? md / e : null; },
  };
  if (ratios[ind]) return ratios[ind]();
  return agg(ind);
}

export function usePeriod(rawData, months) {
  const [periodType,    setPeriodType]    = useState('month');
  const [selectedYear,  setSelectedYear]  = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedQ,     setSelectedQ]     = useState(1);
  const [selectedHalf,  setSelectedHalf]  = useState(1);
  const [comparison,    setComparison]    = useState('MoM');

  // Core aggregation over any array of months
  const aggregateMonths = useMemo(() => (ind, ms) => {
    if (!rawData[ind]) return null;
    const vals = ms.map(m => rawData[ind][m] ?? null).filter(v => v !== null);
    if (!vals.length) return null;
    if (LAST_VALUE_INDICATORS.includes(ind)) return vals[vals.length - 1];
    if (SUM_INDICATORS.includes(ind))        return vals.reduce((a, b) => a + b, 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [rawData]);

  // Trailing 12 months for trend charts (must be defined before chartBuckets)
  const last12months = useMemo(() => {
    const lastM = months[months.length - 1];
    if (!lastM) return [];
    const [y, m] = lastM.split('-').map(Number);
    const result = [];
    for (let i = 11; i >= 0; i--) {
      let month = m - i, year = y;
      if (month <= 0) { month += 12; year -= 1; }
      result.push(`${year}-${String(month).padStart(2, '0')}`);
    }
    return result.filter(x => months.includes(x));
  }, [months]);

  // Current period months
  const periodMonths = useMemo(() => {
    if (periodType === 'month') return [selectedMonth].filter(m => months.includes(m));
    if (periodType === 'quarter') {
      const start = (selectedQ - 1) * 3 + 1;
      return [start, start + 1, start + 2]
        .map(n => `${selectedYear}-${String(n).padStart(2, '0')}`)
        .filter(m => months.includes(m));
    }
    if (periodType === 'half') {
      const start = selectedHalf === 1 ? 1 : 7;
      return Array.from({ length: 6 }, (_, i) => start + i)
        .map(n => `${selectedYear}-${String(n).padStart(2, '0')}`)
        .filter(m => months.includes(m));
    }
    if (periodType === 'year') {
      return months.filter(m => m.startsWith(String(selectedYear)));
    }
    return [];
  }, [periodType, selectedYear, selectedMonth, selectedQ, selectedHalf, months]);

  // Comparison period months (MoM / QoQ / YoY)
  const prevPeriodMonths = useMemo(() => {
    if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      if (comparison === 'YoY') {
        return [`${y - 1}-${String(m).padStart(2, '0')}`].filter(x => months.includes(x));
      }
      let pm = m - 1, py = y;
      if (pm <= 0) { pm = 12; py -= 1; }
      return [`${py}-${String(pm).padStart(2, '0')}`].filter(x => months.includes(x));
    }
    if (periodType === 'quarter') {
      if (comparison === 'YoY') {
        const start = (selectedQ - 1) * 3 + 1;
        return [start, start + 1, start + 2]
          .map(n => `${selectedYear - 1}-${String(n).padStart(2, '0')}`)
          .filter(x => months.includes(x));
      }
      let pq = selectedQ - 1, py = selectedYear;
      if (pq <= 0) { pq = 4; py -= 1; }
      const start = (pq - 1) * 3 + 1;
      return [start, start + 1, start + 2]
        .map(n => `${py}-${String(n).padStart(2, '0')}`)
        .filter(x => months.includes(x));
    }
    if (periodType === 'half') {
      if (comparison === 'YoY') {
        const start = selectedHalf === 1 ? 1 : 7;
        return Array.from({ length: 6 }, (_, i) => start + i)
          .map(n => `${selectedYear - 1}-${String(n).padStart(2, '0')}`)
          .filter(x => months.includes(x));
      }
      const ph = selectedHalf === 1 ? 2 : 1;
      const py = selectedHalf === 1 ? selectedYear - 1 : selectedYear;
      const start = ph === 1 ? 1 : 7;
      return Array.from({ length: 6 }, (_, i) => start + i)
        .map(n => `${py}-${String(n).padStart(2, '0')}`)
        .filter(x => months.includes(x));
    }
    if (periodType === 'year') {
      return months.filter(x => x.startsWith(String(selectedYear - 1)));
    }
    return [];
  }, [periodType, selectedYear, selectedMonth, selectedQ, selectedHalf, comparison, months]);

  const aggregate     = useMemo(() => (ind) => aggregateMonths(ind, periodMonths),     [aggregateMonths, periodMonths]);
  const aggregatePrev = useMemo(() => (ind) => aggregateMonths(ind, prevPeriodMonths), [aggregateMonths, prevPeriodMonths]);

  const get     = useMemo(() => (ind) => applyRatios(ind, aggregate),     [aggregate]);
  const getPrev = useMemo(() => (ind) => applyRatios(ind, aggregatePrev), [aggregatePrev]);

  // Aggregate for arbitrary months array (used by charts)
  const getAgg = useMemo(() => (ind, ms) => applyRatios(ind, (i) => aggregateMonths(i, ms)), [aggregateMonths]);

  // Time buckets for charts — adapts to period type
  const chartBuckets = useMemo(() => {
    if (periodType === 'month') {
      return last12months.map(m => ({
        label: MONTH_NAMES[m.split('-')[1]] || m,
        months: [m],
      }));
    }
    if (periodType === 'quarter') {
      const buckets = [];
      let q = selectedQ, y = selectedYear;
      for (let i = 0; i < 6; i++) {
        const start = (q - 1) * 3 + 1;
        const ms = [start, start + 1, start + 2]
          .map(n => `${y}-${String(n).padStart(2, '0')}`)
          .filter(m => months.includes(m));
        if (ms.length > 0) buckets.unshift({ label: `Q${q} ${String(y).slice(2)}`, months: ms });
        q--;
        if (q <= 0) { q = 4; y--; }
      }
      return buckets;
    }
    if (periodType === 'half') {
      const buckets = [];
      let h = selectedHalf, y = selectedYear;
      for (let i = 0; i < 4; i++) {
        const start = h === 1 ? 1 : 7;
        const ms = Array.from({ length: 6 }, (_, j) => start + j)
          .map(n => `${y}-${String(n).padStart(2, '0')}`)
          .filter(m => months.includes(m));
        if (ms.length > 0) buckets.unshift({ label: `${h}П ${String(y).slice(2)}`, months: ms });
        h--;
        if (h <= 0) { h = 2; y--; }
      }
      return buckets;
    }
    if (periodType === 'year') {
      const years = [...new Set(months.map(m => m.split('-')[0]))].sort();
      return years.map(y => ({ label: y, months: months.filter(m => m.startsWith(y)) }));
    }
    return last12months.map(m => ({ label: MONTH_NAMES[m.split('-')[1]] || m, months: [m] }));
  }, [periodType, selectedQ, selectedHalf, selectedYear, last12months, months]);

  return {
    periodType, setPeriodType,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedQ, setSelectedQ,
    selectedHalf, setSelectedHalf,
    comparison, setComparison,
    periodMonths,
    prevPeriodMonths,
    get,
    getPrev,
    getAgg,
    chartBuckets,
    last12months,
    months,
  };
}
