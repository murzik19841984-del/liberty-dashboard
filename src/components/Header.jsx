const SECTIONS = [
  { id: 'dds',   label: '01 · ДДС' },
  { id: 'opiu',  label: '02 · ОПиУ' },
  { id: 'age',   label: '03 · До 18 / После 18' },
];

export function Header({ activeSection, setActiveSection, period, loading, lastUpdated, onRefresh }) {
  const { periodType, setPeriodType, selectedYear, setSelectedYear,
          selectedMonth, setSelectedMonth, selectedQ, setSelectedQ,
          comparison, setComparison } = period;

  return (
    <header className="dashboard-header">

      {/* ── Строка 1: бренд ── */}
      <div className="header-row header-row--brand">
        <span className="brand-name">ЛИБЕРТИ · СТОМАТОЛОГИЯ</span>
        <span className="brand-divider">&nbsp;|&nbsp;</span>
        <span className="brand-subtitle">Управленческий дашборд</span>
      </div>

      {/* ── Строка 2: выбор даты/периода ── */}
      <div className="header-row header-row--date">
        <select className="ctrl-select" value={periodType} onChange={e => setPeriodType(e.target.value)}>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
          <option value="half">Полугодие</option>
          <option value="year">Год</option>
        </select>

        {periodType === 'month' && (
          <input type="month" className="ctrl-select"
            value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        )}

        {periodType === 'quarter' && (
          <select className="ctrl-select" value={selectedQ} onChange={e => setSelectedQ(Number(e.target.value))}>
            {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
        )}

        {['quarter','half','year'].includes(periodType) && (
          <select className="ctrl-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* ── Строка 3: MoM/QoQ/YoY + обновить ── */}
      <div className="header-row header-row--controls">
        <div className="period-toggle">
          {['MoM', 'QoQ', 'YoY'].map(c => (
            <button
              key={c}
              onClick={() => setComparison(c)}
              className={`period-btn${comparison === c ? ' active' : ''}`}
            >{c}</button>
          ))}
        </div>

        <div className="header-refresh-group">
          <button className="btn-refresh" onClick={onRefresh}>↻ Обновить</button>
          <span className="header-updated">
            {loading
              ? 'Загрузка…'
              : lastUpdated
                ? `Обновлено ${lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
          </span>
        </div>
      </div>

      {/* ── Строка 4: навигация — отдельный nav, не внутри header-row ── */}
      <nav className="dashboard-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`tab${activeSection === s.id ? ' active' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </nav>

    </header>
  );
}
