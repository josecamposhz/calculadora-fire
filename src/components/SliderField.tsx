export interface SliderFieldProps {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}

export function SliderField({
  label,
  id,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: SliderFieldProps) {
  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block text-[10px] tracking-[0.2em] uppercase text-muted mb-2"
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full bg-surface2 border border-border rounded-sm py-3 pr-3 text-ink font-mono text-sm outline-none focus:border-gold transition-colors ${prefix ? 'pl-8' : 'pl-3.5'}`}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>
            {prefix}
            {min}
            {suffix}
          </span>
          <span>
            {prefix}
            {max}
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}
