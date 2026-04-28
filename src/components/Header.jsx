import { COLORS } from '../constants';

const SECTIONS = [
  { id: 'dds',    label: '01 · ДДС' },
  { id: 'opiu',   label: '02 · ОПиУ' },
  { id: 'kids',   label: '03 · KIDS vs Взрослая' },
  { id: 'age',    label: '04 · До 18 / После 18' },
  { id: 'notes',  label: '05 · Выводы' },
];

export function Header({ activeSection, setActiveSection, period, loading, lastUpdated, onRefresh }) {
  const { periodType, setPeriodType, selectedYear, setSelectedYear,
          selectedMonth, setSelectedMonth, selectedQ, setSelectedQ,
          comparison, setComparison } = period;

  return (
    <header className="sticky top-0 z-50" style={{ background: COLORS.navy }}>
      {/* Top row */}
      <div className="flex items-center justify-between px-8 h-14">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white text-base tracking-wide" style={{ fontFamily: 'Montserrat' }}>
            ЛИБЕРТИ <span style={{ color: COLORS.lblue }}>·</span> СТОМАТОЛОГИЯ
          </span>
          <span className="text-gray-400 text-xs">Управленческий дашборд</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Period type */}
          <select
            className="text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1"
            value={periodType}
            onChange={e => setPeriodType(e.target.value)}
          >
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="half">Полугодие</option>
            <option value="year">Год</option>
          </select>

          {/* Month picker */}
          {periodType === 'month' && (
            <input type="month" className="text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1"
              value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          )}

          {/* Quarter picker */}
          {periodType === 'quarter' && (
            <select className="text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1"
              value={selectedQ} onChange={e => setSelectedQ(Number(e.target.value))}>
              {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
          )}

          {/* Year picker */}
          {['quarter','half','year'].includes(periodType) && (
            <select className="text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1"
              value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {/* Comparison toggle */}
          <div className="flex rounded overflow-hidden border border-white/20">
            {['MoM','QoQ','YoY'].map(c => (
              <button key={c}
                className={`text-xs px-3 py-1 ${comparison === c ? 'text-white' : 'text-white/50'}`}
                style={{ background: comparison === c ? COLORS.blue : 'transparent' }}
                onClick={() => setComparison(c)}
              >{c}</button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={onRefresh}
            className="text-xs text-white/70 border border-white/20 rounded px-3 py-1 hover:bg-white/10"
          >↺ Обновить</button>

          {/* Status */}
          <span className="text-xs text-white/40">
            {loading ? 'Загрузка…' : lastUpdated ? `Обновлено ${lastUpdated.toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'})}` : ''}
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex px-8 border-t border-white/10">
        {SECTIONS.map(s => (
          <button key={s.id}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeSection === s.id
                ? 'text-white border-white'
                : 'text-white/40 border-transparent hover:text-white/70'
            }`}
            style={{ fontFamily: 'Montserrat' }}
            onClick={() => setActiveSection(s.id)}
          >{s.label}</button>
        ))}
      </div>
    </header>
  );
}
