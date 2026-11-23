import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LabelList, ReferenceLine, Cell,
} from 'recharts';
import { SectionTitle } from '../components/SectionTitle';
import { ChartCard } from '../components/ChartCard';
import { fmtM, fmtNum, fmtDelta } from '../utils/format';
import { COLORS } from '../constants';

/* ── Треугольный маркер для «До 18» линий ── */
function TriangleDot({ cx, cy, fill }) {
  if (cx == null || cy == null) return null;
  return (
    <polygon
      points={`${cx},${cy - 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`}
      fill={fill || COLORS.teal}
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

/* ── Карточка сравнения До 18 | После 18 ── */
function CompareCard({ label, youngValue, oldValue, youngDelta, oldDelta, format = 'money' }) {
  const fmt = v =>
    v == null ? '—'
    : format === 'num'   ? fmtNum(v)
    : format === 'float' ? v.toFixed(2)
    : fmtM(v);

  const fmtDlt = d => d == null ? null : (d >= 0 ? '+' : '') + (d * 100).toFixed(1) + '%';
  const dltArr = d => d == null ? '' : d >= 0 ? '↑' : '↓';

  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.teal }}>До 18</div>
          <div style={{ fontFamily: 'Montserrat', fontSize: 22, fontWeight: 700, color: COLORS.teal }}>
            {fmt(youngValue)}
          </div>
          {fmtDlt(youngDelta) && (
            <div style={{ fontSize: 12, fontWeight: 600, color: youngDelta >= 0 ? '#34D399' : '#FF6B6B' }}>
              {dltArr(youngDelta)} {fmtDlt(youngDelta)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.blue }}>После 18</div>
          <div style={{ fontFamily: 'Montserrat', fontSize: 22, fontWeight: 700, color: COLORS.blue }}>
            {fmt(oldValue)}
          </div>
          {fmtDlt(oldDelta) && (
            <div style={{ fontSize: 12, fontWeight: 600, color: oldDelta >= 0 ? '#34D399' : '#FF6B6B' }}>
              {dltArr(oldDelta)} {fmtDlt(oldDelta)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Dual LineChart До 18 / После 18 ── */
function DualLine({ data, labelFmt, yTickFmt }) {
  const fmt = labelFmt || (v => v != null ? Math.round(v) : '');
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 24, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
        <YAxis tickFormatter={yTickFmt} tick={{ fontSize: 10, fill: COLORS.gray }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="до18"
          name="До 18"
          stroke={COLORS.teal}
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={(props) => <TriangleDot {...props} fill={COLORS.teal} />}
          activeDot={{ r: 6, fill: COLORS.teal }}
        >
          <LabelList dataKey="до18" position="top" formatter={fmt}
            style={{ fontSize: 10, fill: COLORS.teal }} />
        </Line>
        <Line
          type="monotone"
          dataKey="после18"
          name="После 18"
          stroke={COLORS.blue}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLORS.blue, stroke: '#fff', strokeWidth: 2 }}
        >
          <LabelList dataKey="после18" position="bottom" formatter={fmt}
            style={{ fontSize: 10, fill: COLORS.blue }} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Waterfall Chart ── */
function WaterfallChart({ title, subtitle, effects }) {
  let running = 0;
  const data = effects
    .filter(e => e.value != null && !isNaN(e.value))
    .map(({ name, value }) => {
      const offset = value >= 0 ? running : running + value;
      const row = { name, offset, absValue: Math.abs(value), raw: value };
      running += value;
      return row;
    });

  if (!data.length) {
    return (
      <ChartCard title={title} subtitle={subtitle}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 0' }}>
          Нет данных
        </div>
      </ChartCard>
    );
  }

  const xMin = Math.min(0, ...data.map(d => d.offset));
  const xMax = Math.max(0, ...data.map(d => d.offset + d.absValue));
  const pad  = Math.max((xMax - xMin) * 0.12, 500);

  const customTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find(p => p.dataKey === 'absValue');
    if (!entry) return null;
    const { raw } = entry.payload;
    return (
      <div style={{
        background: '#1a2d42', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6, padding: '8px 12px', fontSize: 12,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{entry.payload.name}</p>
        <p style={{ color: raw >= 0 ? '#34D399' : '#FF6B6B', fontWeight: 600 }}>
          {raw >= 0 ? '+' : ''}{fmtM(raw)}
        </p>
      </div>
    );
  };

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            domain={[xMin - pad, xMax + pad]}
            tickFormatter={v => fmtM(v)}
            tick={{ fontSize: 9, fill: COLORS.gray }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 10, fill: COLORS.gray }}
          />
          <ReferenceLine x={0} stroke={COLORS.gray} strokeWidth={1.5} />
          <Tooltip content={customTooltip} />
          <Bar dataKey="offset" stackId="wf" fill="transparent" stroke="none" isAnimationActive={false} />
          <Bar dataKey="absValue" stackId="wf" isAnimationActive={false} radius={[0, 3, 3, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.raw >= 0 ? COLORS.green : COLORS.red} />
            ))}
            <LabelList
              dataKey="raw"
              position="right"
              formatter={v => v != null ? (v >= 0 ? '+' : '') + fmtM(v) : ''}
              style={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export function SectionAge({ get, getPrev, getAgg, chartBuckets, rawData, last12months, period }) {

  /* 4.1 — текущие значения */
  const revY      = get('выручка_до18');
  const revO      = get('выручка_после18');
  const patY      = get('пациенты_до18');
  const patO      = get('пациенты_после18');
  const visY      = get('визиты_до18');
  const visO      = get('визиты_после18');
  const checkPatY = get('чек_пациента_до18');
  const checkPatO = get('чек_пациента_после18');
  const checkVisY = get('чек_визита_до18');
  const checkVisO = get('чек_визита_после18');
  const checkSvcY = get('чек_услуги_до18');
  const checkSvcO = get('чек_услуги_после18');
  const freqY     = get('частота_визитов_до18');
  const freqO     = get('частота_визитов_после18');
  const fillY     = get('наполненность_до18');
  const fillO     = get('наполненность_после18');

  /* 4.2-4.7 — парные данные по периодам */
  const mkDual = (indY, indO) =>
    chartBuckets.map(b => ({
      month:   b.label,
      до18:    getAgg(indY, b.months),
      после18: getAgg(indO, b.months),
    }));

  const revData  = mkDual('выручка_до18',         'выручка_после18');
  const svcData  = mkDual('чек_услуги_до18',       'чек_услуги_после18');
  const fillData = mkDual('наполненность_до18',    'наполненность_после18');
  const visData  = mkDual('визиты_до18',           'визиты_после18');
  const patData  = mkDual('пациенты_до18',         'пациенты_после18');
  const freqData = mkDual('частота_визитов_до18',  'частота_визитов_после18');

  /* 4.8 — Факторный анализ */
  const periodMonths     = period?.periodMonths     || [];
  const prevPeriodMonths = period?.prevPeriodMonths || [];
  const currM = periodMonths[periodMonths.length - 1]         ?? null;
  const prevM = prevPeriodMonths[prevPeriodMonths.length - 1] ?? null;

  const raw = (ind, m) =>
    rawData && ind && m ? (rawData[ind]?.[m] ?? null) : null;

  const cvA   = raw('чек_визита_после18',      currM);
  const cvAp  = raw('чек_визита_после18',      prevM);
  const frA   = raw('частота_визитов_после18', currM);
  const frAp  = raw('частота_визитов_после18', prevM);
  const cvEffA = cvA != null && cvAp != null && frAp != null ? (cvA - cvAp) * frAp : null;
  const frEffA = frA != null && frAp != null && cvA  != null ? (frA - frAp) * cvA   : null;

  const cvB   = raw('чек_визита_до18',      currM);
  const cvBp  = raw('чек_визита_до18',      prevM);
  const frB   = raw('частота_визитов_до18', currM);
  const frBp  = raw('частота_визитов_до18', prevM);
  const cvEffB = cvB != null && cvBp != null && frBp != null ? (cvB - cvBp) * frBp : null;
  const frEffB = frB != null && frBp != null && cvB  != null ? (frB - frBp) * cvB   : null;

  const csC   = raw('чек_услуги_после18',  currM);
  const csCp  = raw('чек_услуги_после18',  prevM);
  const flC   = raw('наполненность_после18', currM);
  const flCp  = raw('наполненность_после18', prevM);
  const csEffC = csC != null && csCp != null && flCp != null ? (csC - csCp) * flCp : null;
  const flEffC = flC != null && flCp != null && csC  != null ? (flC - flCp) * csC   : null;

  const csD   = raw('чек_услуги_до18',  currM);
  const csDp  = raw('чек_услуги_до18',  prevM);
  const flD   = raw('наполненность_до18', currM);
  const flDp  = raw('наполненность_до18', prevM);
  const csEffD = csD != null && csDp != null && flDp != null ? (csD - csDp) * flDp : null;
  const flEffD = flD != null && flDp != null && csD  != null ? (flD - flDp) * csD   : null;

  const fmtK    = v => v != null ? Math.round(v / 1000) + 'k' : '';
  const fmtNum_ = v => v != null ? Math.round(v).toLocaleString('ru-RU') : '';
  const fmtF2   = v => v != null ? (+v).toFixed(2) : '';

  const periodLabel = prevM && currM
    ? `Δ между ${prevM.slice(5)} → ${currM.slice(5)}`
    : '';

  return (
    <div className="section-content">
      <SectionTitle number="03">До 18 / После 18</SectionTitle>

      {/* 4.1 — Comparison cards 4 × 2 */}
      <div className="grid grid-cols-2 gap-4">
        <CompareCard label="Выручка"
          youngValue={revY}      oldValue={revO}
          youngDelta={fmtDelta(revY,      getPrev('выручка_до18'))}
          oldDelta={fmtDelta(revO,        getPrev('выручка_после18'))}
        />
        <CompareCard label="Пациенты"
          youngValue={patY}      oldValue={patO}
          youngDelta={fmtDelta(patY,      getPrev('пациенты_до18'))}
          oldDelta={fmtDelta(patO,        getPrev('пациенты_после18'))}
          format="num"
        />
        <CompareCard label="Визиты"
          youngValue={visY}      oldValue={visO}
          youngDelta={fmtDelta(visY,      getPrev('визиты_до18'))}
          oldDelta={fmtDelta(visO,        getPrev('визиты_после18'))}
          format="num"
        />
        <CompareCard label="Чек пациента"
          youngValue={checkPatY} oldValue={checkPatO}
          youngDelta={fmtDelta(checkPatY, getPrev('чек_пациента_до18'))}
          oldDelta={fmtDelta(checkPatO,   getPrev('чек_пациента_после18'))}
        />
        <CompareCard label="Чек визита"
          youngValue={checkVisY} oldValue={checkVisO}
          youngDelta={fmtDelta(checkVisY, getPrev('чек_визита_до18'))}
          oldDelta={fmtDelta(checkVisO,   getPrev('чек_визита_после18'))}
        />
        <CompareCard label="Чек услуги"
          youngValue={checkSvcY} oldValue={checkSvcO}
          youngDelta={fmtDelta(checkSvcY, getPrev('чек_услуги_до18'))}
          oldDelta={fmtDelta(checkSvcO,   getPrev('чек_услуги_после18'))}
        />
        <CompareCard label="Частота визитов"
          youngValue={freqY}     oldValue={freqO}
          youngDelta={fmtDelta(freqY,     getPrev('частота_визитов_до18'))}
          oldDelta={fmtDelta(freqO,       getPrev('частота_визитов_после18'))}
          format="float"
        />
        <CompareCard label="Наполненность чека"
          youngValue={fillY}     oldValue={fillO}
          youngDelta={fmtDelta(fillY,     getPrev('наполненность_до18'))}
          oldDelta={fmtDelta(fillO,       getPrev('наполненность_после18'))}
          format="float"
        />
      </div>

      {/* 4.2 — Выручка */}
      <ChartCard title="Выручка" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●) · ₽">
        <DualLine data={revData} labelFmt={fmtK} yTickFmt={v => Math.round(v / 1000) + 'k'} />
      </ChartCard>

      {/* 4.3 — Чек услуги */}
      <ChartCard title="Чек услуги" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●) · ₽">
        <DualLine data={svcData} labelFmt={fmtK} yTickFmt={v => Math.round(v / 1000) + 'k'} />
      </ChartCard>

      {/* 4.4 — Наполненность */}
      <ChartCard title="Наполненность чека" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●) · услуг/визит">
        <DualLine data={fillData} labelFmt={fmtF2} yTickFmt={v => v?.toFixed(2)} />
      </ChartCard>

      {/* 4.5 — Визиты */}
      <ChartCard title="Количество визитов" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●)">
        <DualLine data={visData} labelFmt={fmtNum_} yTickFmt={v => Math.round(v)} />
      </ChartCard>

      {/* 4.6 — Пациенты */}
      <ChartCard title="Количество пациентов" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●)">
        <DualLine data={patData} labelFmt={fmtNum_} yTickFmt={v => Math.round(v)} />
      </ChartCard>

      {/* 4.7 — Частота визитов */}
      <ChartCard title="Частота визитов" subtitle="До 18 (пунктир · ▲) vs После 18 (сплошная · ●) · визитов/пациент">
        <DualLine data={freqData} labelFmt={fmtF2} yTickFmt={v => v?.toFixed(2)} />
      </ChartCard>

      {/* 4.8 — Факторный анализ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', fontFamily: 'Montserrat' }}>
            Факторный анализ
          </span>
          {periodLabel && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{periodLabel}</span>
          )}
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <WaterfallChart
            title="А — После 18: Δ чек пациента"
            subtitle="чек_визита × частота_визитов"
            effects={[
              { name: 'Δ чека визита',      value: cvEffA },
              { name: 'Δ частоты визитов',  value: frEffA },
            ]}
          />
          <WaterfallChart
            title="Б — До 18: Δ чек пациента"
            subtitle="чек_визита × частота_визитов"
            effects={[
              { name: 'Δ чека визита',      value: cvEffB },
              { name: 'Δ частоты визитов',  value: frEffB },
            ]}
          />
          <WaterfallChart
            title="В — После 18: Δ чек визита"
            subtitle="чек_услуги × наполненность"
            effects={[
              { name: 'Δ чека услуги',      value: csEffC },
              { name: 'Δ наполненности',    value: flEffC },
            ]}
          />
          <WaterfallChart
            title="Г — До 18: Δ чек визита"
            subtitle="чек_услуги × наполненность"
            effects={[
              { name: 'Δ чека услуги',      value: csEffD },
              { name: 'Δ наполненности',    value: flEffD },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
