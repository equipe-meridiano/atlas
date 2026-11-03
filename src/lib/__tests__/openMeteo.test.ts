import { ApiError } from '../http';
import { parseForecast, parseGeocoding } from '../openMeteo';
import { describeWeather } from '../weatherCodes';

/** Respostas no formato documentado em https://open-meteo.com/en/docs */
const geocodingResponse = {
  results: [
    {
      id: 3413829,
      name: 'Reykjavík',
      latitude: 64.13548,
      longitude: -21.89541,
      elevation: 33,
      feature_code: 'PPLC',
      country_code: 'IS',
      timezone: 'Atlantic/Reykjavik',
      population: 118918,
      country: 'Islândia',
      admin1: 'Capital Region',
    },
    { id: 1, name: 'Sem fuso', latitude: 0, longitude: 0, country: 'Lugar nenhum' },
  ],
  generationtime_ms: 0.8,
};

const forecastResponse = {
  latitude: 64.125,
  longitude: -21.875,
  timezone: 'Atlantic/Reykjavik',
  utc_offset_seconds: 0,
  current: {
    time: '2026-11-03T09:45',
    interval: 900,
    temperature_2m: 7.8,
    apparent_temperature: 4.9,
    weather_code: 2,
    wind_speed_10m: 18.2,
  },
  daily: {
    time: ['2026-11-03', '2026-11-04', '2026-11-05'],
    weather_code: [2, 3, 61],
    temperature_2m_max: [8.1, 9.2, 7.0],
    temperature_2m_min: [4.9, 3.8, 2.6],
  },
};

describe('parseGeocoding', () => {
  it('converte resultados válidos e descarta os incompletos', () => {
    const places = parseGeocoding(geocodingResponse);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      id: '3413829',
      name: 'Reykjavík',
      country: 'Islândia',
      timezone: 'Atlantic/Reykjavik',
      isCapital: true,
    });
  });

  it('trata a ausência de "results" como busca sem resultado', () => {
    expect(parseGeocoding({ generationtime_ms: 0.4 })).toEqual([]);
  });

  it('recusa respostas fora do formato', () => {
    expect(() => parseGeocoding('oi')).toThrow(ApiError);
    expect(() => parseGeocoding({ results: 'x' })).toThrow(ApiError);
  });
});

describe('parseForecast', () => {
  it('lê o clima atual e os próximos dias', () => {
    const forecast = parseForecast(forecastResponse);
    expect(forecast.temperature).toBe(7.8);
    expect(forecast.days).toHaveLength(3);
    expect(forecast.days[2]).toEqual({ date: '2026-11-05', min: 2.6, max: 7.0, weatherCode: 61 });
  });

  it('recusa previsão com campo faltando', () => {
    const broken = { ...forecastResponse, current: { ...forecastResponse.current, temperature_2m: null } };
    expect(() => parseForecast(broken)).toThrow(ApiError);
    const shortDaily = { ...forecastResponse, daily: { ...forecastResponse.daily, temperature_2m_min: [1] } };
    expect(() => parseForecast(shortDaily)).toThrow(ApiError);
  });
});

describe('describeWeather', () => {
  it('traduz os códigos WMO', () => {
    expect(describeWeather(2)).toBe('Parcialmente nublado');
    expect(describeWeather(123)).toBe('Condição indisponível');
  });
});
