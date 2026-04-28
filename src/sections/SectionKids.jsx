import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ReferenceLine,
} from 'recharts';
import { SectionTitle } from '../components/SectionTitle';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { fmtM, fmtNum, fmtDelta } from '../utils/format';
import { COLORS } from '../constants';

/* ── Треугольный маркер для KIDS-линий ── */
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

/* ── Карточка сравнения KIDS | Взрослая ── */
function CompareCard({ label, kidsValue, adultValue, kidsDelta, adultDelta, format = 'money' }) {
  const fmt = v =>
    v === null || v === undefined ? '—'
    : format === 'num' ? fmtNum(v)
    : fmtM(v);

  const fmtDlt  = d => d === null || d === undefined ? null : (d >= 0 ? '+' : '') + (d * 100).toFixed(1) + '%';
  const dltClr  = d => d == null ? '' : d >= 0 ? 'text-emerald-500' : 'text-red-500';
  const dltArr  = d => d == null ? '' : d >= 0 ? '↑' : '↓';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{label}</div>
      <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold" style={{ color: COLORS.teal }}>KIDS</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.teal, fontFamily: 'Montserrat' }}>
            {fmt(kidsValue)}
          </div>
          {fmtDlt(kidsDelta) && (
            <div className={`text-sm font-medium ${dltClr(kidsDelta)}`}>
              {dltArr(kidsDelta)} {fmtDlt(kidsDelta)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 pl-4">
          <div className="text-xs font-bold" style={{ color: COLORS.blue }}>Взрослая</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.blue, fontFamily: 'Montserrat' }}>
            {fmt(adultValue)}
          </div>
          {fmtDlt(adultDelta) && (
            <div className={`text-sm font-medium ${dltClr(adultDelta)}`}>
              {dltArr(adultDelta)} {fmtDlt(adultDelta)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Переиспользуемый дуэт LineChart ── */
function DualLine({ data, kidsKey = 'kids', adultKey = 'взрослая', labelFormatter }) {
  const fmt = labelFormatter || (v => v != null ? Math.round(v) : '');
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 24, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
        <YAxis tick={{ fontSize: 10, fill: COLORS.gray }} />
        <Tooltip />
        <Legend />
        {/* KIDS — dashed teal, triangle dot */}
        <Line
          type="monotone"
          dataKey={kidsKey}
          name="KIDS"
          stroke={COLORS.teal}
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={(props) => <TriangleDot {...props} fill={COLORS.teal} />}
          activeDot={{ r: 6, fill: COLORS.teal }}
        >
          <LabelList
            dataKey={kidsKey}
            position="top"
            formatter={fmt}
            style={{ fontSize: 10, fill: COLORS.teal }}
          />
        </Line>
        {/* Взрослая — solid blue, circle dot */}
        <Line
          type="monotone"
          dataKey={adultKey}
          name="Взрослая"
          stroke={COLORS.blue}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLORS.blue, stroke: '#fff', strokeWidth: 2 }}
        >
          <LabelList
            dataKey={adultKey}
            position="bottom"
            formatter={fmt}
            style={{ fontSize: 10, fill: COLORS.blue }}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export function SectionKids({ get, getPrev, getAgg, chartBuckets }) {

  /* 3.1 — текущие значения */
  const visitsK   = get('количество_визитов_kids');
  const visitsA   = get('количество_визитов_взрослая');
  const patientsK = get('количество_пациентов_kids');
  const patientsA = get('количество_пациентов_взрослая');
  const checkK    = get('средний_чек_kids');
  const checkA    = get('средний_чек_взрослая');
  const revK      = get('выручка_kids');
  const revA      = get('выручка_взрослая');
  const effK      = get('эффективность_часа_kids');
  const effA      = get('эффективность_часа_взрослая');
  const chair     = get('выручка_на_кресло');

  /* 3.2 — визиты */
  const visitsData = chartBuckets.map(b => ({
    month:    b.label,
    kids:     getAgg('количество_визитов_kids', b.months),
    взрослая: getAgg('количество_визитов_взрослая', b.months),
  }));

  /* 3.3 — средний чек */
  const checkData = chartBuckets.map(b => ({
    month:    b.label,
    kids:     getAgg('средний_чек_kids', b.months),
    взрослая: getAgg('средний_чек_взрослая', b.months),
  }));

  /* 3.4 — выручка на кресло + среднее */
  const chairData = chartBuckets.map(b => ({
    month: b.label,
    value: getAgg('выручка_на_кресло', b.months),
  }));
  const chairVals = chairData.map(d => d.value).filter(v => v != null);
  const chairMean = chairVals.length
    ? chairVals.reduce((a, v) => a + v, 0) / chairVals.length
    : null;

  /* 3.5 — эффективность часа (скрыть если нет данных) */
  const effData = chartBuckets.map(b => ({
    month:    b.label,
    kids:     getAgg('эффективность_часа_kids', b.months),
    взрослая: getAgg('эффективность_часа_взрослая', b.months),
  }));
  const effVisible = effData.some(d => d.kids != null || d.взрослая != null);

  /* форматтеры для LabelList */
  const fmtNum_ = v => v != null ? Math.round(v).toLocaleString('ru-RU') : '';
  const fmtK    = v => v != null && v > 0 ? Math.round(v / 1000) + 'k' : '';

  return (
    <div className="p-8 space-y-8">
      <SectionTitle number="03">KIDS vs Взрослая</SectionTitle>

      {/* 3.1 — Comparison cards 2 × 3 */}
      <div className="grid grid-cols-2 gap-4">
        <CompareCard
          label="Количество визитов"
          kidsValue={visitsK}   adultValue={visitsA}
          kidsDelta={fmtDelta(visitsK, getPrev('количество_визитов_kids'))}
          adultDelta={fmtDelta(visitsA, getPrev('количество_визитов_взрослая'))}
          format="num"
        />
        <CompareCard
          label="Количество пациентов"
          kidsValue={patientsK} adultValue={patientsA}
          kidsDelta={fmtDelta(patientsK, getPrev('количество_пациентов_kids'))}
          adultDelta={fmtDelta(patientsA, getPrev('количество_пациентов_взрослая'))}
          format="num"
        />
        <CompareCard
          label="Средний чек"
          kidsValue={checkK}    adultValue={checkA}
          kidsDelta={fmtDelta(checkK, getPrev('средний_чек_kids'))}
          adultDelta={fmtDelta(checkA, getPrev('средний_чек_взрослая'))}
          format="money"
        />
        <CompareCard
          label="Выручка"
          kidsValue={revK}      adultValue={revA}
          kidsDelta={fmtDelta(revK, getPrev('выручка_kids'))}
          adultDelta={fmtDelta(revA, getPrev('выручка_взрослая'))}
          format="money"
        />
        <CompareCard
          label="Эффективность часа"
          kidsValue={effK}      adultValue={effA}
          kidsDelta={fmtDelta(effK, getPrev('эффективность_часа_kids'))}
          adultDelta={fmtDelta(effA, getPrev('эффективность_часа_взрослая'))}
          format="money"
        />
        <KpiCard
          label="Выручка на кресло"
          value={chair}
          format="money"
          delta={fmtDelta(chair, getPrev('выручка_на_кресло'))}
          accentColor={COLORS.navy}
        />
      </div>

      {/* 3.2 — Визиты: dashed-teal-triangle vs solid-blue */}
      <ChartCard
        title="Динамика количества визитов"
        subtitle="KIDS (пунктир · ▲) vs Взрослая (сплошная · ●)"
      >
        <DualLine data={visitsData} labelFormatter={fmtNum_} />
      </ChartCard>

      {/* 3.3 — Средний чек */}
      <ChartCard
        title="Средний чек"
        subtitle="KIDS (пунктир · ▲) vs Взрослая (сплошная · ●) · ₽"
      >
        <DualLine data={checkData} labelFormatter={fmtK} />
      </ChartCard>

      {/* 3.4 — Выручка на кресло + ReferenceLine среднего */}
      <ChartCard
        title="Выручка на кресло"
        subtitle={chairMean != null ? `₽ · среднее за период: ${fmtM(chairMean)}` : '₽'}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chairData} margin={{ top: 24, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={v => [fmtM(v), 'Выручка на кресло']} />
            {chairMean != null && (
              <ReferenceLine
                y={chairMean}
                stroke={COLORS.amber}
                strokeDasharray="5 5"
                label={{ value: `Среднее: ${fmtM(chairMean)}`, fill: COLORS.amber, fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              name="Выручка на кресло"
              stroke={COLORS.navy}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS.navy, stroke: '#fff', strokeWidth: 2 }}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={fmtK}
                style={{ fontSize: 10, fill: COLORS.navy }}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3.5 — Эффективность часа (скрыт если нет данных) */}
      {effVisible && (
        <ChartCard
          title="Эффективность часа"
          subtitle="KIDS (пунктир · ▲) vs Взрослая (сплошная · ●) · ₽/час"
        >
          <DualLine data={effData} labelFormatter={fmtK} />
        </ChartCard>
      )}
    </div>
  );
}
