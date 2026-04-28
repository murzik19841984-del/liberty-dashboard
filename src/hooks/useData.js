import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { CSV_URL, SUM_INDICATORS, LAST_VALUE_INDICATORS } from '../constants';

function parseNum(s) {
  if (!s && s !== 0) return null;
  const clean = String(s).replace(/[\s ]/g, '').replace('%', '');
  const normalized = clean.includes(',') && !clean.includes('.')
    ? clean.replace(',', '.')
    : clean;
  const v = parseFloat(normalized);
  return isNaN(v) ? null : v;
}

export function useData() {
  const [rawData, setRawData] = useState({});   // { indicator: { 'YYYY-MM': value } }
  const [months, setMonths] = useState([]);      // ['2025-01', '2025-02', ...]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(CSV_URL + '&cachebust=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data;
          const header = rows[0];
          // Extract months from header (columns 1+), format " M /YY " → 'YYYY-MM'
          const ms = header.slice(1).map(h => {
            const match = String(h).replace(/\s/g, '').match(/^(\d{1,2})\/(\d{2})$/);
            if (!match) return null;
            const month = parseInt(match[1], 10);
            const year  = 2000 + parseInt(match[2], 10);
            if (month < 1 || month > 12) return null;
            return `${year}-${String(month).padStart(2, '0')}`;
          }).filter(Boolean);

          const data = {};
          rows.slice(1).forEach(row => {
            const ind = (row[0] || '').trim();
            if (!ind) return;
            data[ind] = {};
            ms.forEach((m, i) => {
              const v = parseNum(row[i + 1]);
              if (v !== null) data[ind][m] = v;
            });
          });

          // Keep only months that have at least one value
          const activeMonths = ms.filter(m =>
            Object.values(data).some(ind => ind[m] !== undefined)
          );

          setMonths(activeMonths);
          setRawData(data);
          setLastUpdated(new Date());
          setLoading(false);
        },
        error: (err) => { throw new Error(err.message); },
      });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { rawData, months, loading, error, lastUpdated, refresh: load };
}
