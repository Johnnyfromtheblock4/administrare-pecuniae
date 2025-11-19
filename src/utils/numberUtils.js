export function toMoney(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return Number(n.toFixed(2));
}
