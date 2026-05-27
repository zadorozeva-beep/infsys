import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Download,
  Eye,
  Filter,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getDisciplineDistribution,
  getFunnel,
  getHeatmap,
  getOverview,
  getTopMaterials,
  getWeekly,
} from '../api/analytics.api';
import { CountUp } from '../components/CountUp';
import { useThemePalette } from '../hooks/useThemePalette';
import { useTheme } from '../store/theme.store';

export function AnalyticsTab(): JSX.Element {
  const [weeks, setWeeks] = useState(12);
  const [heatmapDays, setHeatmapDays] = useState(30);

  const overviewQ = useQuery({ queryKey: ['analytics-overview'], queryFn: getOverview });
  const weeklyQ = useQuery({ queryKey: ['analytics-weekly', weeks], queryFn: () => getWeekly(weeks) });
  const heatmapQ = useQuery({
    queryKey: ['analytics-heatmap', heatmapDays],
    queryFn: () => getHeatmap(heatmapDays),
  });
  const topQ = useQuery({ queryKey: ['analytics-top'], queryFn: () => getTopMaterials(10) });
  const distQ = useQuery({ queryKey: ['analytics-disciplines'], queryFn: getDisciplineDistribution });
  const funnelQ = useQuery({ queryKey: ['analytics-funnel'], queryFn: () => getFunnel(30) });

  return (
    <div className="flex flex-col gap-6">
      <KpiRow data={overviewQ.data} loading={overviewQ.isLoading} />

      <WeeklyChart
        data={weeklyQ.data ?? []}
        loading={weeklyQ.isLoading}
        weeks={weeks}
        onWeeksChange={setWeeks}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <HeatmapCard data={heatmapQ.data ?? []} loading={heatmapQ.isLoading} days={heatmapDays} onDaysChange={setHeatmapDays} />
        <FunnelCard data={funnelQ.data} loading={funnelQ.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TopMaterialsCard data={topQ.data ?? []} loading={topQ.isLoading} />
        <DisciplinesPieCard data={distQ.data ?? []} loading={distQ.isLoading} />
      </div>
    </div>
  );
}

// ─── KPI ─────────────────────────────────────────────────────────────

function KpiRow({
  data,
  loading,
}: {
  data: import('../api/analytics.api').OverviewKpi | undefined;
  loading: boolean;
}): JSX.Element {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard icon={<Users size={18} strokeWidth={2.5} />} label="Користувачів" value={data.totalUsers} />
      <KpiCard icon={<BookOpen size={18} strokeWidth={2.5} />} label="Матеріалів" value={data.totalMaterials} />
      <KpiCard icon={<Eye size={18} strokeWidth={2.5} />} label="Переглядів" value={data.totalViews} />
      <KpiCard icon={<Download size={18} strokeWidth={2.5} />} label="Завантажень" value={data.totalDownloads} />
      <KpiCard
        icon={<TrendingUp size={18} strokeWidth={2.5} />}
        label="Завантажень за 7 днів"
        value={data.downloads7d}
        growth={data.downloads7dGrowthPct}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  growth,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  growth?: number;
}): JSX.Element {
  return (
    <div className="card-glow !p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint">
        {icon}
      </div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-mint-600 dark:text-mint-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="font-display text-3xl font-extrabold text-mint-900 dark:text-mint-100">
          <CountUp value={value} />
        </div>
        {typeof growth === 'number' && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              growth >= 0
                ? 'bg-mint-100 text-mint-700 dark:bg-mint-800/60 dark:text-mint-200'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}
          >
            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {growth >= 0 ? '+' : ''}
            {growth}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Weekly area chart ───────────────────────────────────────────────

function WeeklyChart({
  data,
  loading,
  weeks,
  onWeeksChange,
}: {
  data: import('../api/analytics.api').WeeklyPoint[];
  loading: boolean;
  weeks: number;
  onWeeksChange: (n: number) => void;
}): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const palette = useThemePalette();

  const formatted = useMemo(
    () =>
      data.map((p) => {
        const d = new Date(p.week);
        return {
          ...p,
          label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
        };
      }),
    [data],
  );

  return (
    <div className="card-glow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
          <Activity size={18} strokeWidth={2.5} /> Динаміка активності по тижнях
        </h3>
        <div className="inline-flex gap-1 rounded-xl bg-mint-100/60 p-1 dark:bg-mint-900/60">
          {[8, 12, 26].map((n) => (
            <button
              key={n}
              onClick={() => onWeeksChange(n)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                weeks === n
                  ? 'bg-mint-gradient text-white shadow-mint'
                  : 'text-mint-700 hover:bg-white/70 dark:text-mint-300 dark:hover:bg-mint-800/60'
              }`}
            >
              {n} тижнів
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-mint-100/40" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.c300} stopOpacity={0.5} />
                <stop offset="100%" stopColor={palette.c300} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.c500} stopOpacity={0.7} />
                <stop offset="100%" stopColor={palette.c500} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSaves" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.c700} stopOpacity={0.8} />
                <stop offset="100%" stopColor={palette.c700} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: isDark ? palette.c200 : palette.c700 }}
              tickLine={false}
              axisLine={{ stroke: isDark ? palette.c800 : palette.c100 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isDark ? palette.c200 : palette.c700 }}
              tickLine={false}
              axisLine={{ stroke: isDark ? palette.c800 : palette.c100 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
            <Area
              type="monotone"
              dataKey="views"
              name="Перегляди"
              stackId="1"
              stroke={palette.c300}
              strokeWidth={2}
              fill="url(#gradViews)"
            />
            <Area
              type="monotone"
              dataKey="downloads"
              name="Завантаження"
              stackId="1"
              stroke={palette.c500}
              strokeWidth={2}
              fill="url(#gradDownloads)"
            />
            <Area
              type="monotone"
              dataKey="saves"
              name="Збереження"
              stackId="1"
              stroke={palette.c700}
              strokeWidth={2}
              fill="url(#gradSaves)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────

const DOW_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function HeatmapCard({
  data,
  loading,
  days,
  onDaysChange,
}: {
  data: import('../api/analytics.api').HeatmapCell[];
  loading: boolean;
  days: number;
  onDaysChange: (n: number) => void;
}): JSX.Element {
  const matrix = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const c of data) {
      if (m[c.dow]) m[c.dow]![c.hour] = c.value;
      if (c.value > max) max = c.value;
    }
    return { m, max: max || 1 };
  }, [data]);

  return (
    <div className="card-glow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
          <Filter size={18} strokeWidth={2.5} /> Активність: день × година
        </h3>
        <div className="inline-flex gap-1 rounded-xl bg-mint-100/60 p-1 dark:bg-mint-900/60">
          {[7, 30, 60].map((n) => (
            <button
              key={n}
              onClick={() => onDaysChange(n)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                days === n
                  ? 'bg-mint-gradient text-white shadow-mint'
                  : 'text-mint-700 hover:bg-white/70 dark:text-mint-300 dark:hover:bg-mint-800/60'
              }`}
            >
              {n} днів
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-mint-100/40" />
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-grid min-w-full" style={{ gridTemplateColumns: '36px repeat(24, minmax(20px, 1fr))' }}>
            {/* Заголовки годин */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="pb-1 text-center text-[9px] font-semibold text-mint-600 dark:text-mint-400"
              >
                {h % 3 === 0 ? `${h}` : ''}
              </div>
            ))}
            {/* Рядки днів */}
            {matrix.m.map((row, dow) => (
              <div key={`row-${dow}`} style={{ display: 'contents' }}>
                <div className="pr-1 text-right text-xs font-bold text-mint-700 dark:text-mint-300 self-center">
                  {DOW_LABELS[dow]}
                </div>
                {row.map((v, h) => {
                  const intensity = v / matrix.max;
                  const alpha = intensity === 0 ? 0.06 : 0.15 + intensity * 0.85;
                  return (
                    <div
                      key={`${dow}-${h}`}
                      title={`${DOW_LABELS[dow]} ${h}:00 — ${v} подій`}
                      className="h-6 m-[1px] rounded transition-transform hover:scale-110"
                      style={{
                        backgroundColor: `rgb(var(--mint-500) / ${alpha})`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-mint-600 dark:text-mint-400">
            <span>менше</span>
            {[0.1, 0.3, 0.5, 0.7, 1].map((a) => (
              <div
                key={a}
                className="h-3 w-3 rounded"
                style={{ backgroundColor: `rgb(var(--mint-500) / ${a})` }}
              />
            ))}
            <span>більше</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────────────────

function FunnelCard({
  data,
  loading,
}: {
  data: import('../api/analytics.api').FunnelData | undefined;
  loading: boolean;
}): JSX.Element {
  if (loading || !data) {
    return <div className="card-glow h-72 animate-pulse" />;
  }
  const steps = [
    { label: 'Переглянули', value: data.views, color: 'from-cyan-400 to-mint-400', icon: <Eye size={16} /> },
    {
      label: 'Завантажили',
      value: data.downloads,
      color: 'from-mint-400 to-mint-500',
      icon: <Download size={16} />,
      conv: data.downloadRate,
    },
    {
      label: 'Зберегли',
      value: data.saves,
      color: 'from-mint-500 to-teal-600',
      icon: <Bookmark size={16} />,
      conv: data.saveRate,
    },
  ];
  const max = data.views || 1;

  return (
    <div className="card-glow">
      <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
        <Filter size={18} strokeWidth={2.5} /> Воронка конверсії (30 днів)
      </h3>
      <div className="flex flex-col gap-3">
        {steps.map((s) => {
          const pct = Math.max(8, Math.round((s.value / max) * 100));
          return (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-mint-800 dark:text-mint-200">
                  {s.icon} {s.label}
                </span>
                <span className="font-mono font-bold text-mint-900 dark:text-mint-100">
                  <CountUp value={s.value} />
                  {s.conv !== undefined && (
                    <span className="ml-2 text-xs font-semibold text-mint-600 dark:text-mint-400">
                      ({s.conv}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-6 overflow-hidden rounded-xl bg-mint-100 dark:bg-mint-900/50">
                <div
                  className={`h-full rounded-xl bg-gradient-to-r ${s.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-2xl bg-mint-50/70 p-3 text-center text-xs font-semibold text-mint-700 dark:bg-mint-900/40 dark:text-mint-300">
        Перегляд → Збереження:{' '}
        <span className="font-display text-lg font-extrabold text-mint-900 dark:text-mint-100">
          {data.viewToSaveRate}%
        </span>
      </div>
    </div>
  );
}

// ─── Top materials ───────────────────────────────────────────────────

function TopMaterialsCard({
  data,
  loading,
}: {
  data: import('../api/analytics.api').TopMaterialRow[];
  loading: boolean;
}): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const palette = useThemePalette();

  const chartData = useMemo(
    () =>
      data.slice(0, 10).map((m, i) => ({
        name: m.title.length > 28 ? m.title.slice(0, 28) + '…' : m.title,
        fullName: m.title,
        downloads: m.downloads,
        views: m.views,
        saves: m.saves,
        fill: palette.series[i % palette.series.length],
      })),
    [data, palette],
  );

  return (
    <div className="card-glow">
      <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
        <TrendingUp size={18} strokeWidth={2.5} /> Топ-10 матеріалів за завантаженнями
      </h3>
      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-mint-100/40" />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: isDark ? palette.c200 : palette.c700 }}
              tickLine={false}
              axisLine={{ stroke: isDark ? palette.c800 : palette.c100 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: isDark ? palette.c100 : palette.c900 }}
              tickLine={false}
              axisLine={false}
              width={220}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="downloads" name="Завантажень" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Disciplines pie ─────────────────────────────────────────────────

function DisciplinesPieCard({
  data,
  loading,
}: {
  data: import('../api/analytics.api').DisciplineDistribution[];
  loading: boolean;
}): JSX.Element {
  const palette = useThemePalette();

  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        name: d.name,
        value: d.materialsCount,
        downloads: d.totalDownloads,
        fill: palette.series[i % palette.series.length],
      })),
    [data, palette],
  );

  return (
    <div className="card-glow">
      <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
        <BookOpen size={18} strokeWidth={2.5} /> Розподіл по дисциплінах
      </h3>
      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-mint-100/40" />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Спільний тултіп для recharts ─────────────────────────────────────

interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: RechartsTooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-2xl border border-mint-200 bg-white/95 px-3 py-2 text-xs shadow-mint backdrop-blur-xl dark:border-mint-700 dark:bg-mint-950/90">
      {label !== undefined && (
        <div className="mb-1 font-bold text-mint-900 dark:text-mint-100">{String(label)}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-mint-800 dark:text-mint-200">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold">{p.name}:</span>
          <span className="font-mono font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
