export function passiveIncomeGoalForYear(
  baseAnual: number,
  inflacionPct: number,
  year: number
) {
  if (year <= 0) return baseAnual;
  const rate = inflacionPct / 100;
  return baseAnual * Math.pow(1 + rate, year);
}
