/**
 * Formatação no padrão brasileiro (vírgula decimal, pontos cardeais em português).
 * Feita à mão, sem Intl, para dar o mesmo resultado em qualquer celular.
 */

function decimal(value: number, digits = 2): string {
  return Math.abs(value).toFixed(digits).replace('.', ',');
}

/** 64.1466 → "Latitude 64,15° N" */
export function formatLatitude(latitude: number): string {
  return `Latitude ${decimal(latitude)}° ${latitude >= 0 ? 'N' : 'S'}`;
}

/** -21.9426 → "Longitude 21,94° O" (O = oeste; L = leste) */
export function formatLongitude(longitude: number): string {
  return `Longitude ${decimal(longitude)}° ${longitude >= 0 ? 'L' : 'O'}`;
}

/** 7.6 → "8°". O -0 vira 0 para não aparecer "-0°". */
export function formatTemperature(celsius: number): string {
  const rounded = Math.round(celsius);
  return `${rounded === 0 ? 0 : rounded}°`;
}

/** Faixa do dia como no Figma: mínima / máxima → "5° / 8°". */
export function formatRange(min: number, max: number): string {
  return `${formatTemperature(min)} / ${formatTemperature(max)}`;
}

/** 18.4 → "18 km/h" */
export function formatWind(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Nome da linha na lista "Próximos dias".
 * O primeiro dia da previsão é "Hoje" e o segundo é "Amanhã" (a API começa no dia atual
 * do destino); do terceiro em diante, o dia da semana.
 * @param isoDate data no formato "2026-11-03", no fuso do destino
 */
export function dayLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  const [year, month, day] = isoDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekdays[weekday] ?? isoDate;
}

/** "2026-11-03T09:45" → "09:45" (horário local do destino, que a API já devolve). */
export function formatLocalTime(isoDateTime: string): string {
  const time = isoDateTime.split('T')[1] ?? '';
  return time.slice(0, 5);
}
