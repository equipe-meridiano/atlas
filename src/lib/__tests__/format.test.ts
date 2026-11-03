import {
  dayLabel,
  formatLatitude,
  formatLocalTime,
  formatLongitude,
  formatRange,
  formatTemperature,
  formatWind,
} from '../format';

describe('formatação brasileira', () => {
  it('formata coordenadas como no Figma', () => {
    expect(formatLatitude(64.1466)).toBe('Latitude 64,15° N');
    expect(formatLongitude(-21.9426)).toBe('Longitude 21,94° O');
    expect(formatLatitude(-23.5475)).toBe('Latitude 23,55° S');
    expect(formatLongitude(7.8632)).toBe('Longitude 7,86° L');
  });

  it('arredonda temperaturas e evita "-0°"', () => {
    expect(formatTemperature(7.6)).toBe('8°');
    expect(formatTemperature(-0.4)).toBe('0°');
    expect(formatRange(4.6, 8.2)).toBe('5° / 8°');
    expect(formatWind(18.4)).toBe('18 km/h');
  });

  it('nomeia os dias da previsão', () => {
    expect(dayLabel('2026-11-06', 0)).toBe('Hoje');
    expect(dayLabel('2026-11-07', 1)).toBe('Amanhã');
    expect(dayLabel('2026-11-08', 2)).toBe('Domingo');
    expect(dayLabel('2026-11-03', 2)).toBe('Terça');
  });

  it('extrai o horário local', () => {
    expect(formatLocalTime('2026-11-03T09:45')).toBe('09:45');
  });
});
