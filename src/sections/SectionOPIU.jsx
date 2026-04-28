import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie, LabelList, ReferenceLine,
} from 'recharts';
import { SectionTitle } from '../components/SectionTitle';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { fmtM, fmtPct, fmtNum, fmtDelta } from '../utils/format';
import { COLORS, MONTH_NAMES } from '../constants';

/* ── Константы ── */
const EXP_KEYS   = ['переменные_расходы', 'общепроизводственные_расходы', 'административные_расходы', 'коммерческие_расходы'];
const EXP_LABELS = ['Переменные', 'Общепроизв.', 'Административные', 'Коммерческие'];
const EXP_CLR    = [COLORS.blue, COLORS.teal, COLORS.amber, COLORS.red];

const FOT_COMP   = ['фот_доля_административный', 'фот_доля_коммерческий', 'фот_доля_врачи', 'фот_доля_вспомог_мед'];
const FOT_LABELS = ['Административный', 'Коммерческий', 'Врачи', 'Вспомог. мед.'];
const FOT_CLR    = [COLORS.blue, COLORS.teal, COLORS.amber, COLORS.lblue];

/* ── Светофор ── */
function TrafficLight({ ok, rule, hint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
        style={{ background: ok ? COLORS.green : COLORS.red }}
      >
        {ok ? '✓' : '✗'}
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-800 mb-1">{rule}</div>
        <div className="text-xs font-medium" style={{ color: ok ? COLORS.teal : COLORS.red }}>
          {ok ? 'Выполняется' : 'Не выполняется'}
        </div>
        {hint && <div className="text-xs text-gray-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

/* ── Основной компонент ── */
export function SectionOPIU({ get, getPrev, getAgg, chartBuckets, last12months }) {

  /* 2.1 — KPI */
  const revenue   = get('выручка');
  const margin    = get('маржинальный_доход');
  const ebitda    = get('ebitda');
  const netProfit = get('чистая_прибыль');
  const rentMar   = get('рентабельность_маржинальная');
  const rentGross = get('рентабельность_валовая');
  const rentEbt   = get('рентабельность_ebitda');
  const rentNet   = get('рентабельность_чп');

  /* 2.2 — Combo last12months */
  const comboL12 = (last12months || []).map(m => ({
    month:          MONTH_NAMES[m.split('-')[1]] || m,
    выручка:        getAgg('выручка', [m]),
    чистая_прибыль: getAgg('чистая_прибыль', [m]),
  }));

  /* 2.3 — Структура расходов */
  const pieExp = EXP_KEYS.map((k, i) => ({
    name:  EXP_LABELS[i],
    value: Math.abs(get(k) ?? 0),
  })).filter(d => d.value > 0);

  const expStructData = chartBuckets.map(b => {
    const vals  = EXP_KEYS.map(k => Math.abs(getAgg(k, b.months) ?? 0));
    const total = vals.reduce((s, v) => s + v, 0);
    const row   = { month: b.label };
    EXP_KEYS.forEach((k, i) => { row[k] = total > 0 ? +(vals[i] / total * 100).toFixed(1) : 0; });
    return row;
  });

  /* 2.4 — Постоянные vs доля переменных */
  const dualExpData = chartBuckets.map(b => {
    const pv = Math.abs(getAgg('переменные_расходы', b.months) ?? 0);
    const rv = getAgg('выручка', b.months);
    return {
      month:              b.label,
      постоянные_расходы: getAgg('постоянные_расходы', b.months),
      доля_переменных:    rv ? +(pv / rv * 100).toFixed(1) : null,
    };
  });

  /* 2.5 — Точка безубыточности */
  const beChartData = chartBuckets.map(b => {
    const rv  = getAgg('выручка', b.months);
    const md  = getAgg('маржинальный_доход', b.months);
    const fc  = getAgg('постоянные_расходы', b.months);
    const bep = (rv && md && fc) ? fc / (md / rv) : null;
    return { month: b.label, выручка: rv, точка_безубыточности: bep };
  });

  const curFC   = get('постоянные_расходы');
  const bep     = (revenue && margin && curFC) ? curFC / (margin / revenue) : null;
  const safeAbs = (revenue && bep)             ? revenue - bep              : null;
  const safePct = (revenue && bep)             ? (revenue - bep) / revenue  : null;

  /* 2.6 — Темпы роста */
  const growthP = get('темп_роста_прибыли');
  const growthR = get('темп_роста_выручки');
  const rule1OK = growthP !== null && growthR !== null && growthP > growthR;
  const rule2OK = growthR !== null && growthR > 1;

  const growthData = chartBuckets.map(b => ({
    month:              b.label,
    темп_роста_выручки: getAgg('темп_роста_выручки', b.months),
    темп_роста_прибыли: getAgg('темп_роста_прибыли', b.months),
  }));

  /* 2.7 — Операционный рычаг */
  const leverage     = get('операционный_рычаг');
  const leverageData = chartBuckets.map(b => ({
    month: b.label,
    value: getAgg('операционный_рычаг', b.months),
  }));

  /* 2.8 — ФОТ */
  const fotData = chartBuckets.map(b => {
    const total = getAgg('фот_доля_общая', b.months) || 0;
    const row   = { month: b.label, фот_доля_общая: total !== null ? +(total * 100).toFixed(1) : null };
    FOT_COMP.forEach(k => {
      const v = getAgg(k, b.months) || 0;
      row[k]  = total > 0 ? +(v / total * 100).toFixed(1) : 0;
    });
    return row;
  });

  /* 2.9 — Производительность */
  const revPerEmp = get('выручка_на_сотрудника');
  const npPerEmp  = get('чп_на_сотрудника');
  const empCount  = get('количество_сотрудников');

  const empData = chartBuckets.map(b => ({
    month: b.label,
    value: getAgg('выручка_на_сотрудника', b.months),
  }));

  /* 2.10 — Скидки */
  const discountData = chartBuckets.map(b => {
    const pct = getAgg('скидка_процент', b.months);
    return {
      month:          b.label,
      скидка_абс:     getAgg('скидка_абс', b.months),
      скидка_процент: pct !== null ? +(pct * 100).toFixed(2) : null,
    };
  });

  /* ── Render ── */
  return (
    <div className="p-8 space-y-8">
      <SectionTitle number="02">Отчёт о прибылях и убытках</SectionTitle>

      {/* 2.1 — 8 KPI (2 ряда × 4) */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Выручка"            value={revenue}   format="money" delta={fmtDelta(revenue,   getPrev('выручка'))} />
        <KpiCard label="Маржинальный доход" value={margin}    format="money" delta={fmtDelta(margin,    getPrev('маржинальный_доход'))} />
        <KpiCard label="EBITDA"             value={ebitda}    format="money" delta={fmtDelta(ebitda,    getPrev('ebitda'))} />
        <KpiCard label="Чистая прибыль"     value={netProfit} format="money" delta={fmtDelta(netProfit, getPrev('чистая_прибыль'))} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Рент. маржинальная" value={rentMar}   format="pct" accentColor={COLORS.teal} delta={fmtDelta(rentMar,   getPrev('рентабельность_маржинальная'))} />
        <KpiCard label="Рент. валовая"      value={rentGross} format="pct" accentColor={COLORS.teal} delta={fmtDelta(rentGross, getPrev('рентабельность_валовая'))} />
        <KpiCard label="Рент. EBITDA"       value={rentEbt}   format="pct" accentColor={COLORS.teal} delta={fmtDelta(rentEbt,   getPrev('рентабельность_ebitda'))} />
        <KpiCard label="Рент. чистая"       value={rentNet}   format="pct" accentColor={COLORS.teal} delta={fmtDelta(rentNet,   getPrev('рентабельность_чп'))} />
      </div>

      {/* 2.2 — ComboChart: Bar=выручка + Line=ЧП, last 12 мес */}
      <ChartCard title="Выручка и чистая прибыль" subtitle="последние 12 месяцев · ₽">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={comboL12} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={(v, name) => [fmtM(v), name]} />
            <Legend />
            <Bar dataKey="выручка" fill={COLORS.blue} radius={[3, 3, 0, 0]} name="Выручка">
              <LabelList dataKey="выручка" position="top"
                formatter={v => v > 500000 ? (v / 1_000_000).toFixed(1) + 'M' : ''}
                style={{ fontSize: 9, fill: COLORS.navy }} />
            </Bar>
            <Line type="monotone" dataKey="чистая_прибыль" stroke={COLORS.teal} strokeWidth={2.5}
              dot={{ r: 4 }} name="Чистая прибыль" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2.3 — PieChart + 100% StackedBar структуры расходов */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Структура расходов" subtitle="текущий период">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieExp} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} paddingAngle={3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine>
                {pieExp.map((_, i) => <Cell key={i} fill={EXP_CLR[i % EXP_CLR.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmtM(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Динамика структуры расходов" subtitle="100% · доли каждой статьи" className="col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={expStructData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip formatter={(v, name) => [v.toFixed(1) + '%', name]} />
              <Legend />
              {EXP_KEYS.map((k, i) => (
                <Bar key={k} dataKey={k} name={EXP_LABELS[i]} stackId="a" fill={EXP_CLR[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2.4 — DualAxis: постоянные расходы (бар, лев.) + доля переменных (линия, прав.) */}
      <ChartCard
        title="Постоянные расходы vs доля переменных"
        subtitle="Бар = постоянные (₽, лев. ось) · Линия = переменные / выручка (%, прав. ось)"
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dualExpData} margin={{ top: 20, right: 50, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis yAxisId="left" tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => v + '%'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={(v, name) => name === 'Переменные / выручка' ? [v + '%', name] : [fmtM(v), name]} />
            <Legend />
            <Bar yAxisId="left" dataKey="постоянные_расходы" fill={COLORS.blue} radius={[3, 3, 0, 0]} name="Постоянные расходы" />
            <Line yAxisId="right" type="monotone" dataKey="доля_переменных" stroke={COLORS.amber}
              strokeWidth={2.5} dot={{ r: 4 }} name="Переменные / выручка" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2.5 — Выручка vs BEP + 4 карточки */}
      <div className="space-y-4">
        <ChartCard title="Выручка vs Точка безубыточности" subtitle="₽">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={beChartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip formatter={(v, name) => [fmtM(v), name]} />
              <Legend />
              <Bar dataKey="выручка" fill={COLORS.blue} radius={[3, 3, 0, 0]} name="Выручка" opacity={0.75} />
              <Line type="monotone" dataKey="точка_безубыточности" stroke={COLORS.red}
                strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} name="Точка безубыточности" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Выручка"                value={revenue}  format="money" />
          <KpiCard label="Точка безубыточности"   value={bep}      format="money" />
          <KpiCard label="Запас прочности (абс)"  value={safeAbs}  format="money" />
          <KpiCard label="Запас прочности (%)"    value={safePct}  format="pct"
            accentColor={safePct !== null && safePct > 0 ? COLORS.teal : COLORS.red} />
        </div>
      </div>

      {/* 2.6 — 2 светофора + LineChart темпов роста */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TrafficLight
            ok={rule1OK}
            rule="Темп роста прибыли > Темп роста выручки"
            hint={growthP !== null && growthR !== null
              ? `ТРП: ${growthP.toFixed(3)} · ТРВ: ${growthR.toFixed(3)}`
              : undefined}
          />
          <TrafficLight
            ok={rule2OK}
            rule="Темп роста выручки > 1 (бизнес растёт)"
            hint={growthR !== null ? `ТРВ: ${growthR.toFixed(3)}` : undefined}
          />
        </div>

        <ChartCard title="Динамика темпов роста" subtitle="выручка и прибыль · норма > 1">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis tickFormatter={v => v?.toFixed(2)} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip formatter={(v, name) => [v?.toFixed(3), name]} />
              <ReferenceLine y={1} stroke={COLORS.gray} strokeDasharray="4 4"
                label={{ value: 'Норма 1.0', fill: COLORS.gray, fontSize: 10 }} />
              <Legend />
              <Line type="monotone" dataKey="темп_роста_выручки" stroke={COLORS.blue}
                strokeWidth={2.5} dot={{ r: 4 }} name="ТР выручки" />
              <Line type="monotone" dataKey="темп_роста_прибыли" stroke={COLORS.teal}
                strokeWidth={2.5} dot={{ r: 4 }} name="ТР прибыли" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2.7 — Операционный рычаг + динамический текст */}
      <ChartCard title="Операционный рычаг" subtitle="МД / EBITDA">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={leverageData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis tickFormatter={v => v?.toFixed(1)} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={v => [v?.toFixed(2), 'Операционный рычаг']} />
            <Line type="monotone" dataKey="value" stroke={COLORS.navy} strokeWidth={2.5} dot={{ r: 4 }}>
              <LabelList dataKey="value" position="top"
                formatter={v => v?.toFixed(1)}
                style={{ fontSize: 10, fill: COLORS.navy }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
        {leverage !== null && (
          <div className="mt-4 rounded-lg px-5 py-3 text-sm font-semibold text-center"
            style={{ background: COLORS.bg, color: COLORS.navy }}>
            При росте выручки на <strong>1%</strong> прибыль растёт на{' '}
            <strong style={{ color: COLORS.blue }}>{leverage.toFixed(2)}%</strong>
          </div>
        )}
      </ChartCard>

      {/* 2.8 — ФОТ: 4 KPI + 100% StackedBar + Line */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="ФОТ / выручка (общий)"  value={get('фот_доля_общая')}            format="pct" invertedPositive accentColor={COLORS.navy}
            delta={fmtDelta(get('фот_доля_общая'),            getPrev('фот_доля_общая'))} />
          <KpiCard label="ФОТ административный"    value={get('фот_доля_административный')} format="pct" invertedPositive accentColor={COLORS.blue}
            delta={fmtDelta(get('фот_доля_административный'), getPrev('фот_доля_административный'))} />
          <KpiCard label="ФОТ коммерческий"        value={get('фот_доля_коммерческий')}     format="pct" invertedPositive accentColor={COLORS.teal}
            delta={fmtDelta(get('фот_доля_коммерческий'),     getPrev('фот_доля_коммерческий'))} />
          <KpiCard label="ФОТ врачи"               value={get('фот_доля_врачи')}            format="pct" invertedPositive accentColor={COLORS.amber}
            delta={fmtDelta(get('фот_доля_врачи'),            getPrev('фот_доля_врачи'))} />
        </div>

        <ChartCard
          title="Структура ФОТ (100%)"
          subtitle="Бар = доли статей в total ФОТ · Линия = ФОТ / выручка (%, прав. ось)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={fotData} margin={{ top: 20, right: 55, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis yAxisId="left" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => v?.toFixed(1) + '%'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip />
              <Legend />
              {FOT_COMP.map((k, i) => (
                <Bar key={k} yAxisId="left" dataKey={k} name={FOT_LABELS[i]} stackId="a" fill={FOT_CLR[i]} />
              ))}
              <Line yAxisId="right" type="monotone" dataKey="фот_доля_общая" stroke={COLORS.navy}
                strokeWidth={2.5} dot={{ r: 4 }} name="ФОТ / выручка" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2.9 — Производительность: 3 KPI + Line */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Выручка на сотрудника"  value={revPerEmp} format="money"
            delta={fmtDelta(revPerEmp, getPrev('выручка_на_сотрудника'))} />
          <KpiCard label="ЧП на сотрудника"       value={npPerEmp}  format="money"
            delta={fmtDelta(npPerEmp,  getPrev('чп_на_сотрудника'))} />
          <KpiCard label="Количество сотрудников" value={empCount}  format="num" accentColor={COLORS.navy}
            delta={fmtDelta(empCount,  getPrev('количество_сотрудников'))} />
        </div>

        <ChartCard title="Выручка на сотрудника" subtitle="₽">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={empData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip formatter={v => [fmtM(v), 'Выручка / сотрудник']} />
              <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 4 }}>
                <LabelList dataKey="value" position="top"
                  formatter={v => v ? Math.round(v / 1000) + 'k' : ''}
                  style={{ fontSize: 10, fill: COLORS.navy }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2.10 — ComboChart: Bar=скидка_абс + Line=скидка% */}
      <ChartCard
        title="Динамика скидок"
        subtitle="Бар = сумма скидок (₽, лев. ось) · Линия = скидка / выручка (%, прав. ось)"
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={discountData} margin={{ top: 20, right: 55, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis yAxisId="left" tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => v?.toFixed(1) + '%'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={(v, name) => name === 'Скидка %' ? [v?.toFixed(2) + '%', name] : [fmtM(v), name]} />
            <Legend />
            <Bar yAxisId="left" dataKey="скидка_абс" fill={COLORS.red} radius={[3, 3, 0, 0]} name="Скидка абс." />
            <Line yAxisId="right" type="monotone" dataKey="скидка_процент" stroke={COLORS.amber}
              strokeWidth={2.5} dot={{ r: 4 }} name="Скидка %" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
