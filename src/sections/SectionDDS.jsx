import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, PieChart, Pie, Legend, LabelList } from 'recharts';
import { SectionTitle } from '../components/SectionTitle';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { fmtM, fmtDelta } from '../utils/format';
import { COLORS, CORRIDOR_MIN, CORRIDOR_MAX } from '../constants';

export function SectionDDS({ get, getPrev, getAgg, chartBuckets }) {
  // KPI values + deltas
  const receipts  = get('поступления_от_клиентов');
  const saldo     = get('сальдо_операционное');
  const outflows  = receipts !== null && saldo !== null ? receipts - saldo : null;
  const balance   = get('остаток_счет');
  const inCorridor = balance !== null && balance >= CORRIDOR_MIN && balance <= CORRIDOR_MAX;

  const receiptsPrev = getPrev('поступления_от_клиентов');
  const saldoPrev    = getPrev('сальдо_операционное');
  const eqvPrev      = getPrev('поступления_эквайринг');
  const cashPrev     = getPrev('поступления_наличные');
  const outflowsPrev = receiptsPrev !== null && saldoPrev !== null ? receiptsPrev - saldoPrev : null;
  const balancePrev  = getPrev('остаток_счет');

  // Chart data from aggregated buckets
  const stackedData = chartBuckets.map(b => ({
    month:     b.label,
    эквайринг: getAgg('поступления_эквайринг', b.months),
    наличные:  getAgg('поступления_наличные',  b.months),
  }));

  const balanceData = chartBuckets.map(b => ({
    month: b.label,
    value: getAgg('остаток_счет', b.months),
  }));

  const paymentData = chartBuckets.map(b => ({
    month: b.label,
    value: getAgg('уровень_оплат', b.months),
  }));

  // Donut — selected period breakdown
  const eqv  = get('поступления_эквайринг') ?? 0;
  const cash = get('поступления_наличные')  ?? 0;
  const donutData = [
    { name: 'Эквайринг', value: eqv },
    { name: 'Наличные',  value: cash },
  ].filter(d => d.value > 0);

  const lastBucket = chartBuckets[chartBuckets.length - 1];

  return (
    <div className="p-8 space-y-8">
      <SectionTitle number="01">Движение денежных средств</SectionTitle>

      {/* Block 1.1 — KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Поступления от клиентов"
          value={receipts}
          format="money"
          delta={fmtDelta(receipts, receiptsPrev)}
        />
        <KpiCard
          label="Выбытия операционные"
          value={outflows}
          format="money"
          delta={fmtDelta(outflows, outflowsPrev)}
          invertedPositive
        />
        <KpiCard
          label="Сальдо операционной деят."
          value={saldo}
          format="money"
          delta={fmtDelta(saldo, saldoPrev)}
        />
        <KpiCard
          label="Остаток ДС на конец периода"
          value={balance}
          format="money"
          delta={fmtDelta(balance, balancePrev)}
          badge={balance !== null ? { green: inCorridor, label: inCorridor ? 'В коридоре' : 'Вне коридора' } : null}
        />
      </div>

      {/* Block 1.2 — Stacked bar + donut */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Структура поступлений" subtitle="тыс. ₽" className="col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stackedData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
              <YAxis tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fontSize: 10, fill: COLORS.gray }} />
              <Tooltip formatter={(v, name) => [fmtM(v), name]} />
              <Bar dataKey="эквайринг" stackId="a" fill={COLORS.blue} radius={[0, 0, 0, 0]}>
                <LabelList dataKey="эквайринг" position="inside"
                  formatter={v => v > 500000 ? (v / 1_000_000).toFixed(1) + 'M' : ''}
                  style={{ fontSize: 9, fill: '#fff' }} />
              </Bar>
              <Bar dataKey="наличные" stackId="a" fill={COLORS.teal} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="наличные" position="inside"
                  formatter={v => v > 500000 ? (v / 1_000_000).toFixed(1) + 'M' : ''}
                  style={{ fontSize: 9, fill: '#fff' }} />
              </Bar>
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Структура поступлений"
          subtitle={lastBucket ? `${lastBucket.label} — эквайринг vs наличные` : ''}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine>
                <Cell fill={COLORS.blue} />
                <Cell fill={COLORS.teal} />
              </Pie>
              <Tooltip formatter={v => fmtM(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Block 1.3 — Balance dynamics */}
      <ChartCard title="Динамика остатка денежных средств" subtitle="₽ · коридор 2M — 7M">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={balanceData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={v => [fmtM(v), 'Остаток']} />
            <ReferenceLine y={CORRIDOR_MIN} stroke={COLORS.red}   strokeDasharray="4 4" label={{ value: 'MIN 2M', fill: COLORS.red,   fontSize: 10 }} />
            <ReferenceLine y={CORRIDOR_MAX} stroke={COLORS.green} strokeDasharray="4 4" label={{ value: 'MAX 7M', fill: COLORS.green, fontSize: 10 }} />
            <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2.5}
              dot={({ cx, cy, value }) => {
                const color = value >= CORRIDOR_MIN && value <= CORRIDOR_MAX ? COLORS.green : COLORS.red;
                return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
              }}>
              <LabelList dataKey="value" position="top"
                formatter={v => v ? (v / 1_000_000).toFixed(1) + 'M' : ''}
                style={{ fontSize: 9, fill: COLORS.navy }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Block 1.4 — Payment level */}
      <ChartCard title="Уровень оплат" subtitle="Соотношение поступлений к выручке (норма = 1.0)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={paymentData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray }} />
            <YAxis domain={[0.7, 1.3]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10, fill: COLORS.gray }} />
            <Tooltip formatter={v => [v?.toFixed(2), 'Уровень оплат']} />
            <ReferenceLine y={1} stroke={COLORS.gray} strokeDasharray="4 4" label={{ value: 'Норма 1.0', fill: COLORS.gray, fontSize: 10 }} />
            <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2.5}
              dot={({ cx, cy, value }) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5}
                  fill={value >= 1 ? COLORS.green : COLORS.red} stroke="#fff" strokeWidth={2} />
              )}>
              <LabelList dataKey="value" position="top"
                formatter={v => v?.toFixed(2)}
                style={{ fontSize: 10, fill: COLORS.navy }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
