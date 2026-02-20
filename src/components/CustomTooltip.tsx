import { fmtCompact } from '../helpers';

export function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-sm p-3 text-xs font-mono shadow-xl">
      <p className="text-gold text-[10px] tracking-widest uppercase mb-2">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-6 mb-1">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-ink">{fmtCompact(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
