import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from 'recharts';
import { SliderField } from './SliderField';
import { StatCard } from './StatCard';
import { fmtCompact, fmtFull, passiveIncomeGoalForYear } from '../helpers';
import { CustomTooltip } from './CustomTooltip';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Params {
  inicial: number;
  mensual: number;
  tasa: number;
  annualDividendYield: number;
  dividendGrowthRate: number;
  years: number;
  reinvest: boolean;
  yearGoal: number;
  inflation: number;
}

interface YearRow {
  ano: number;
  label: string;
  capitalAportado: number;
  interesesAcum: number;
  dividendosAcum: number;
  divAno?: number;
  valorTotal: number;
  roiPct: number;
  yearGoalAnual: number;
  coberturaMetaPct: number;
}

// ─── Calculator Logic ─────────────────────────────────────────────────────────
function calculate(p: Params): YearRow[] {
  const tasaMensual = p.tasa / 100 / 12;
  const divMensual = p.annualDividendYield / 100 / 12;
  const crecimientoDiv = p.dividendGrowthRate / 100;

  const rows: YearRow[] = [];

  // Year 0
  rows.push({
    ano: 0,
    label: 'Año 0',
    capitalAportado: p.inicial,
    interesesAcum: 0,
    dividendosAcum: 0,
    valorTotal: p.inicial,
    roiPct: 0,
    yearGoalAnual: passiveIncomeGoalForYear(p.yearGoal, p.inflation, 0),
    coberturaMetaPct: 0,
  });

  type Cohort = {
    balance: number;
    ageMonths: number;
  };

  let cohorts: Cohort[] = [{ balance: p.inicial, ageMonths: 0 }];
  let totalIntereses = 0;
  let totalDividendos = 0;

  for (let y = 1; y <= p.years; y++) {
    let interesAno = 0;
    let divAno = 0;

    for (let m = 0; m < 12; m++) {
      if (p.mensual > 0) {
        cohorts.push({ balance: p.mensual, ageMonths: 0 });
      }

      for (const cohort of cohorts) {
        const interes = cohort.balance * tasaMensual;
        cohort.balance += interes;
        interesAno += interes;

        const ageYears = cohort.ageMonths / 12;
        const divRate = divMensual * (1 + crecimientoDiv * ageYears);
        const div = cohort.balance * divRate;
        divAno += div;

        if (p.reinvest) {
          cohort.balance += div;
        }

        cohort.ageMonths += 1;
      }
    }

    const valor = cohorts.reduce((sum, cohort) => sum + cohort.balance, 0);

    totalIntereses += interesAno;
    totalDividendos += divAno;

    const capitalAportado = p.inicial + p.mensual * 12 * y;
    const valorTotal = p.reinvest ? valor : valor + totalDividendos * 0; // dividends cashed out
    const ganancia = valorTotal - capitalAportado;
    const roiPct = capitalAportado > 0 ? (ganancia / capitalAportado) * 100 : 0;
    const yearGoalAnual = passiveIncomeGoalForYear(
      p.yearGoal,
      p.inflation,
      y,
    );
    const coberturaMetaPct =
      yearGoalAnual > 0 ? (divAno / yearGoalAnual) * 100 : 0;

    rows.push({
      ano: y,
      label: `Año ${y}`,
      capitalAportado,
      interesesAcum: totalIntereses,
      dividendosAcum: totalDividendos,
      divAno,
      valorTotal,
      roiPct,
      yearGoalAnual,
      coberturaMetaPct,
    });
  }

  return rows;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Calculator() {
  const [params, setParams] = useState<Params>(() => {
    if (typeof window === 'undefined') {
      return {
        inicial: 10000,
        mensual: 500,
        tasa: 8,
        annualDividendYield: 3,
        dividendGrowthRate: 5,
        years: 20,
        reinvest: true,
        yearGoal: 15_000,
        inflation: 3,
      };
    }
    const stored = localStorage.getItem('calculadora-fire-params');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          inicial: 10000,
          mensual: 500,
          tasa: 8,
          annualDividendYield: 3,
          dividendGrowthRate: 5,
          years: 20,
          reinvest: true,
          yearGoal: 15_000,
          inflation: 3,
        };
      }
    }
    return {
      inicial: 10000,
      mensual: 500,
      tasa: 8,
      annualDividendYield: 3,
      dividendGrowthRate: 5,
      years: 20,
      reinvest: true,
      yearGoal: 15_000,
      inflation: 3,
    };
  });

  useEffect(() => {
    localStorage.setItem('calculadora-fire-params', JSON.stringify(params));
  }, [params]);

  const set = useCallback(<K extends keyof Params>(key: K, val: Params[K]) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  const rows = useMemo(() => calculate(params), [params]);
  const last = rows[rows.length - 1];
  const capitalTotal = last.capitalAportado;
  const valorFinal = last.valorTotal;
  const ganancias = valorFinal - capitalTotal;
  const roi =
    capitalTotal > 0 ? ((ganancias / capitalTotal) * 100).toFixed(1) : '0.0';
  const divTotales = last.dividendosAcum;
  const yearGoalFinal = last.yearGoalAnual;
  const coberturaMeta = last.coberturaMetaPct.toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="text-center mb-14 animate-fade-up">
        <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-4">
          Herramienta Financiera
        </p>
        <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-ink">
          Interés <em className="italic text-gold">Compuesto</em>
        </h1>
        <p className="mt-4 text-muted text-xs tracking-wider">
          Con aportes mensuales · Dividendos · Reinversión
        </p>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* ── Inputs Panel ── */}
        <div
          className="bg-surface border border-border rounded-sm p-8 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted pb-3 mb-6 border-b border-border">
            Parámetros de Inversión
          </p>

          {/* Capital */}
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Capital
          </p>

          <div className="mb-5">
            <label
              htmlFor="inicial"
              className="block text-[10px] tracking-[0.2em] uppercase text-muted mb-2"
            >
              Aporte Inicial
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none">
                $
              </span>
              <input
                id="inicial"
                type="number"
                value={params.inicial}
                min={0}
                step={100}
                onChange={(e) => set('inicial', Number(e.target.value))}
                className="w-full bg-surface2 border border-border rounded-sm py-3 pl-8 pr-3 text-ink font-mono text-sm outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <label
              htmlFor="mensual"
              className="block text-[10px] tracking-[0.2em] uppercase text-muted mb-2"
            >
              Aporte Mensual
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none">
                $
              </span>
              <input
                id="mensual"
                type="number"
                value={params.mensual}
                min={0}
                step={50}
                onChange={(e) => set('mensual', Number(e.target.value))}
                className="w-full bg-surface2 border border-border rounded-sm py-3 pl-8 pr-3 text-ink font-mono text-sm outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          <div className="h-px bg-border my-6" />
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Rendimiento
          </p>

          <SliderField
            label="Tasa de Interés Anual"
            id="tasa"
            value={params.tasa}
            onChange={(v) => set('tasa', v)}
            min={0}
            max={30}
            step={0.1}
            suffix="%"
          />

          <SliderField
            label="Tasa de Dividendos Anual"
            id="annualDividendYield"
            value={params.annualDividendYield}
            onChange={(v) => set('annualDividendYield', v)}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
          />

          <SliderField
            label="Crecimiento Anual de Dividendos"
            id="dividendGrowthRate"
            value={params.dividendGrowthRate}
            onChange={(v) => set('dividendGrowthRate', v)}
            min={0}
            max={10}
            step={0.1}
            suffix="%"
          />

          <div className="h-px bg-border my-6" />
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Horizonte
          </p>

          <SliderField
            label="Años de Inversión"
            id="years"
            value={params.years}
            onChange={(v) => set('years', v)}
            min={5}
            max={30}
            step={1}
            suffix=" años"
          />

          <div className="h-px bg-border my-6" />
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Estrategia de Dividendos
          </p>

          <label className="flex items-center justify-between bg-surface2 border border-border rounded-sm px-4 py-3 cursor-pointer hover:border-gold transition-colors">
            <span className="text-sm text-ink">Reinvertir Dividendos</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={params.reinvest}
                onChange={(e) => set('reinvest', e.target.checked)}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors duration-200 ${params.reinvest ? 'bg-gold/20' : 'bg-border'}`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-200 ${params.reinvest ? 'translate-x-5 bg-gold' : 'bg-muted'}`}
              />
            </div>
          </label>

          <div className="h-px bg-border my-6" />
          <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Meta de Ingreso Pasivo
          </p>

          <div className="mb-5">
            <label
              htmlFor="yearGoal"
              className="block text-[10px] tracking-[0.2em] uppercase text-muted mb-2"
            >
              Meta Anual
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none">
                $
              </span>
              <input
                id="yearGoal"
                type="number"
                value={params.yearGoal}
                min={0}
                step={100}
                onChange={(e) => set('yearGoal', Number(e.target.value))}
                className="w-full bg-surface2 border border-border rounded-sm py-3 pl-8 pr-3 text-ink font-mono text-sm outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <label
              htmlFor="monthlyGoal"
              className="block text-[10px] tracking-[0.2em] uppercase text-muted mb-2"
            >
              Meta Mensual (aprox.)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none">
                $
              </span>
              <input
                id="monthlyGoal"
                type="number"
                value={(params.yearGoal / 12).toFixed(0)}
                min={0}
                step={100}
                onChange={(e) =>
                  set('yearGoal', Number(e.target.value) * 12)
                }
                className="w-full bg-surface2 border border-border rounded-sm py-3 pl-8 pr-3 text-ink font-mono text-sm outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          <SliderField
            label="Inflación Anual"
            id="inflation"
            value={params.inflation}
            onChange={(v) => set('inflation', v)}
            min={2}
            max={5}
            step={0.1}
            suffix="%"
          />
        </div>

        {/* ── Results ── */}
        <div
          className="flex flex-col gap-5 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Valor Final"
              value={fmtFull(valorFinal)}
              sub={`al año ${params.years}`}
              accent="gold"
            />
            <StatCard
              label="Ganancias Totales"
              value={fmtFull(ganancias)}
              sub={`ROI: ${roi}%`}
              accent="emerald"
            />
            <StatCard
              label="Capital Invertido"
              value={fmtFull(capitalTotal)}
              sub="aportes acumulados"
              accent="blue"
            />
            <StatCard
              label={
                params.reinvest
                  ? 'Dividendos Reinvertidos'
                  : 'Dividendos Cobrados'
              }
              value={fmtFull(divTotales)}
              sub={
                params.reinvest
                  ? 'acumulados al capital'
                  : 'recibidos en efectivo'
              }
              accent={params.reinvest ? 'emerald' : 'default'}
            />
            <StatCard
              label="Meta Ingreso Pasivo"
              value={fmtFull(yearGoalFinal)}
              sub={`inflación ${params.inflation}%`}
              accent="default"
            />
            <StatCard
              label="Cobertura de Meta"
              value={`${coberturaMeta}%`}
              sub="dividendos del último año"
              accent={Number(coberturaMeta) >= 100 ? 'emerald' : 'default'}
            />
          </div>

          {/* Chart */}
          <div className="bg-surface border border-border rounded-sm p-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted pb-3 mb-6 border-b border-border">
              Evolución del Portafolio
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={rows}
                margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
              >
                <defs>
                  <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b8dee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5b8dee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf90" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4caf90" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1e2330"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: '#6b7280',
                    fontSize: 10,
                    fontFamily: 'DM Mono',
                  }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2330' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={fmtCompact}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 10,
                    fontFamily: 'DM Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: '11px',
                    fontFamily: 'DM Mono',
                    color: '#6b7280',
                    paddingTop: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valorTotal"
                  name="Valor Total"
                  stroke="#c9a84c"
                  strokeWidth={2}
                  fill="url(#gradGold)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#c9a84c',
                    stroke: '#0a0c0f',
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="capitalAportado"
                  name="Capital Aportado"
                  stroke="#5b8dee"
                  strokeWidth={2}
                  fill="url(#gradBlue)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#5b8dee',
                    stroke: '#0a0c0f',
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="interesesAcum"
                  name="Intereses Acum."
                  stroke="#4caf90"
                  strokeWidth={2}
                  fill="url(#gradEmerald)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#4caf90',
                    stroke: '#0a0c0f',
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="dividendosAcum"
                  name="Dividendos Acum."
                  stroke="#4caf90"
                  strokeWidth={2}
                  fill="url(#gradEmerald)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#4caf90',
                    stroke: '#0a0c0f',
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yearGoalAnual"
                  name="Meta Ingreso Anual"
                  stroke="#e5c76b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted">
                Detalle Anual
              </p>
            </div>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {[
                      'Año',
                      'Capital Aportado',
                      'Intereses Acum.',
                      'Dividendos Acum.',
                      'Dividendos Año',
                      'Meta Ingreso',
                      'Cobertura Meta',
                      'Valor Total',
                      'ROI',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`sticky top-0 bg-surface2 px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-muted whitespace-nowrap font-normal border-b border-border ${i === 0 ? 'text-left' : 'text-right'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.ano}
                      className={`border-b border-border/50 hover:bg-surface2 transition-colors first:opacity-60 ${row.coberturaMetaPct >= 100 ? 'bg-emerald/10' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-muted text-left font-mono">
                        {row.ano}
                      </td>
                      <td className="px-4 py-2.5 text-right text-blue">
                        {fmtFull(row.capitalAportado)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald">
                        {fmtFull(row.interesesAcum)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald">
                        {fmtFull(row.dividendosAcum)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald">
                        {fmtFull(row.divAno || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gold">
                        {fmtFull(row.yearGoalAnual)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted">
                        {row.coberturaMetaPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right text-gold font-medium">
                        {fmtFull(row.valorTotal)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right ${row.roiPct >= 0 ? 'text-emerald' : 'text-danger'}`}
                      >
                        {row.roiPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
