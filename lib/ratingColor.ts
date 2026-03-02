export function ratingColor(r: number): string {
  if (r >= 10) return '#7C3AED'; // purple
  if (r >= 9)  return '#2563EB'; // blue
  if (r >= 8)  return '#16A34A'; // green
  if (r >= 7)  return '#EA580C'; // orange
  if (r >= 6)  return '#CA8A04'; // yellow
  if (r >= 5)  return '#92400E'; // tan
  if (r >= 4)  return '#DC2626'; // light red
  if (r >= 3)  return '#B91C1C'; // red
  if (r >= 2)  return '#991B1B'; // dark red
  return '#7F1D1D';              // darkest red
}
