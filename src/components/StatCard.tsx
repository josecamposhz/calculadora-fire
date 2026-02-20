export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'gold' | 'emerald' | 'blue' | 'default';
}

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const barColor = {
    gold: 'bg-gold',
    emerald: 'bg-emerald',
    blue: 'bg-blue',
    default: 'bg-border',
  }[accent];

  const valueColor = {
    gold: 'text-gold',
    emerald: 'text-emerald',
    blue: 'text-blue',
    default: 'text-ink',
  }[accent];

  return (
    <div className="bg-surface2 border border-border rounded-sm overflow-hidden">
      <div className={`h-0.5 w-full ${barColor}`} />
      <div className="p-5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
          {label}
        </p>
        <p className={`font-serif text-2xl leading-none ${valueColor}`}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}
