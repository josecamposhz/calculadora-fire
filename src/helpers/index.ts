export function fmtCompact(n: number) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export function fmtFull(n: number) {
  return (
    '$' +
    n.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}
