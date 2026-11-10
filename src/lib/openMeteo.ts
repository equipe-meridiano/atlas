import type { Place } from '@/data/place';
import { ApiError, getJson } from './http';

/**
 * Cliente do Open-Meteo (gratuito, sem chave de API).
 * - Geocoding (/v1/search): transforma o nome de uma cidade em coordenadas e fuso.
 * - Forecast (/v1/forecast): clima atual e dos próximos dias para uma coordenada.
 *
 * "Validar JSON" (pedido no handoff) = conferir campo a campo se a resposta tem o formato
 * esperado antes de usar. Se a API mudar ou responder algo estranho, o app mostra um erro
 * claro em vez de quebrar.
 */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export type Forecast = {
  /** Horário local do destino da última leitura, ex.: "2026-11-03T09:45". */
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  days: { date: string; min: number; max: number; weatherCode: number }[];
};

// ---------- verificadores pequenos ----------

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function numberArray(value: unknown, length: number): number[] | null {
  if (!Array.isArray(value) || value.length < length) return null;
  const slice = value.slice(0, length);
  return slice.every(isNumber) ? (slice as number[]) : null;
}

// ---------- geocoding ----------

/** Converte um item da resposta em Place. Itens incompletos viram null. */
function parseGeocodingResult(item: unknown): Place | null {
  if (!isObject(item)) return null;
  const { id, name, latitude, longitude, timezone, country, admin1, feature_code } = item;

  if (!isNumber(id) || !isText(name) || !isNumber(latitude) || !isNumber(longitude)) return null;
  if (!isText(timezone) || !isText(country)) return null;

  return {
    id: String(id),
    name,
    country,
    region: isText(admin1) ? admin1 : undefined,
    latitude,
    longitude,
    timezone,
    // PPLC é o código de "capital de país" no GeoNames, a base que o Open-Meteo usa.
    isCapital: feature_code === 'PPLC',
  };
}

export function parseGeocoding(json: unknown): Place[] {
  if (!isObject(json)) throw new ApiError('invalid', 'Resposta de busca em formato inesperado.');
  // Quando nada é encontrado, o Open-Meteo simplesmente não manda o campo "results".
  if (json.results === undefined) return [];
  if (!Array.isArray(json.results)) throw new ApiError('invalid', 'Lista de resultados inválida.');

  return json.results
    .map(parseGeocodingResult)
    .filter((place): place is Place => place !== null);
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<Place[]> {
  const query = new URLSearchParams({ name: name.trim(), count: '10', language: 'pt', format: 'json' });
  const json = await getJson(`${GEOCODING_URL}?${query.toString()}`, { signal });
  return parseGeocoding(json);
}

// ---------- previsão do tempo ----------

export function parseForecast(json: unknown): Forecast {
  const invalid = () => new ApiError('invalid', 'Previsão do tempo em formato inesperado.');
  if (!isObject(json) || !isObject(json.current) || !isObject(json.daily)) throw invalid();

  const { current, daily } = json;
  const { time, temperature_2m, apparent_temperature, weather_code, wind_speed_10m } = current;
  if (!isText(time) || !isNumber(temperature_2m) || !isNumber(apparent_temperature)) throw invalid();
  if (!isNumber(weather_code) || !isNumber(wind_speed_10m)) throw invalid();

  if (!Array.isArray(daily.time) || daily.time.length === 0 || !daily.time.every(isText)) throw invalid();
  const count = daily.time.length;
  const mins = numberArray(daily.temperature_2m_min, count);
  const maxs = numberArray(daily.temperature_2m_max, count);
  const codes = numberArray(daily.weather_code, count);
  if (!mins || !maxs || !codes) throw invalid();

  return {
    time,
    temperature: temperature_2m,
    apparentTemperature: apparent_temperature,
    weatherCode: weather_code,
    windSpeed: wind_speed_10m,
    days: (daily.time as string[]).map((date, i) => ({
      date,
      min: mins[i],
      max: maxs[i],
      weatherCode: codes[i],
    })),
  };
}

export async function getForecast(
  place: Pick<Place, 'latitude' | 'longitude'>,
  signal?: AbortSignal,
): Promise<Forecast> {
  const query = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '3',
  });
  const json = await getJson(`${FORECAST_URL}?${query.toString()}`, { signal });
  return parseForecast(json);
}
