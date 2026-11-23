import { ChartCard } from './ChartCard';
import { fmtM } from '../utils/format';
import { COLORS } from '../constants';

const formatExact = value => `${Math.round(value).toLocaleString('ru-RU')} ₽`;

export function NetProfitWaterfall({ previous, current, effects, comparison, previousMonths, currentMonths }) {
  const periodLabel = months => {
    if (!months.length) return 'нет данных';
    return months.length === 1 ? months[0] : `${months[0]} — ${months[months.length - 1]}`;
  };
  const subtitle = `${comparison} · ${periodLabel(previousMonths)} → ${periodLabel(currentMonths)} · ₽`;

  if (previous == null || current == null) {
    return <ChartCard title="Изменение чистой прибыли" subtitle={subtitle}>
      <p className="waterfall-empty">Для каскада нужны данные чистой прибыли за оба периода.</p>
    </ChartCard>;
  }

  const available = effects.filter(effect => effect.value != null);
  const explained = available.reduce((sum, effect) => sum + effect.value, 0);
  const remainder = current - previous - explained;
  const drivers = Math.abs(remainder) > 0.5
    ? [...available, { name: 'Прочие статьи и сверка', lines: ['Прочие статьи', 'и сверка'], value: remainder }]
    : available;

  const changes = drivers.reduce((steps, effect) => {
    const start = steps.length ? steps[steps.length - 1].end : previous;
    return [...steps, { ...effect, kind: 'change', start, end: start + effect.value }];
  }, []);
  const steps = [
    { name: 'ЧП, база', lines: ['ЧП', 'база'], kind: 'total', start: 0, end: previous, value: previous },
    ...changes,
    { name: 'ЧП, текущая', lines: ['ЧП', 'текущая'], kind: 'total', start: 0, end: current, value: current },
  ];

  const width = Math.max(980, steps.length * 126);
  const left = 55;
  const right = 25;
  const top = 35;
  const bottom = 260;
  const slot = (width - left - right) / steps.length;
  const barWidth = Math.min(72, slot * 0.58);
  const values = [0, ...steps.flatMap(step => [step.start, step.end])];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.1, 1);
  const min = low - padding;
  const max = high + padding;
  const y = value => bottom - (value - min) / (max - min) * (bottom - top);
  const ticks = Array.from({ length: 5 }, (_, i) => min + (max - min) * i / 4);

  return <ChartCard title="Изменение чистой прибыли" subtitle={subtitle}>
    <div className="waterfall-scroll">
      <svg viewBox={`0 0 ${width} 338`} width={width} height="338" role="img"
        aria-label={`Каскад чистой прибыли: ${formatExact(previous)} → ${formatExact(current)}`}>
        {ticks.map((tick, i) => <g key={i}>
          <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,0.08)" />
          <text x={left - 8} y={y(tick) + 3} textAnchor="end" fontSize="10" fill={COLORS.gray}>{fmtM(tick)}</text>
        </g>)}
        <line x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.32)" />
        {steps.map((step, i) => {
          const x = left + i * slot + (slot - barWidth) / 2;
          const upper = Math.max(step.start, step.end);
          const lower = Math.min(step.start, step.end);
          const rectY = y(upper);
          const height = Math.max(3, y(lower) - rectY);
          const color = step.kind === 'total' ? COLORS.blue : step.value >= 0 ? COLORS.green : COLORS.red;
          const labelY = step.kind === 'change' && step.value < 0
            ? Math.min(y(lower) + 16, 285)
            : Math.max(rectY - 8, 14);
          return <g key={`${step.name}-${i}`}>
            {i > 0 && <line
              x1={x - (slot - barWidth)} x2={x} y1={y(steps[i - 1].end)} y2={y(steps[i - 1].end)}
              stroke="rgba(255,255,255,0.45)" strokeDasharray="4 3" />}
            <rect x={x} y={rectY} width={barWidth} height={height} rx="3" fill={color}>
              <title>{`${step.name}: ${formatExact(step.value)}${step.kind === 'change' ? `; итог ${formatExact(step.end)}` : ''}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={labelY} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
              {step.kind === 'change' && step.value > 0 ? '+' : ''}{fmtM(step.value)}
            </text>
            <text x={x + barWidth / 2} y="303" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.75)">
              {(step.lines || [step.name]).map((line, lineIndex) =>
                <tspan key={lineIndex} x={x + barWidth / 2} dy={lineIndex ? 14 : 0}>{line}</tspan>)}
            </text>
          </g>;
        })}
      </svg>
    </div>
  </ChartCard>;
}
