import { Platform } from 'react-native';

import { ApiError, getJson, isApiError } from './http';

/**
 * Fotos reais das cidades, vindas do Wikimedia (o acervo de imagens da Wikipédia).
 *
 * O Open-Meteo não tem fotos. Mas cada cidade que ele devolve tem um "id", que é o número
 * da cidade no GeoNames (um cadastro mundial de lugares). O Wikidata, a base de dados
 * da Wikipédia, guarda esse mesmo número e a foto principal de cada cidade. O caminho é:
 *
 * 1. Wikidata, busca: qual item tem este GeoNames ID?            → ex.: Q1764
 * 2. Wikidata, item: qual é a imagem principal (propriedade P18)? → "Reykjavík ....jpg"
 * 3. Wikimedia Commons: endereço da miniatura, autor e licença da foto.
 *
 * Tudo em lote: 3 requisições servem para a lista inteira de resultados.
 * Buscar pelo número, e não pelo nome, evita trocar "Lagos, Portugal" por "Lagos, Nigéria".
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** O Wikimedia pede que todo app se identifique nas requisições. */
const APP_AGENT = 'Atlas/1.0 (https://github.com/equipe-meridiano/atlas)';

/**
 * O Wikimedia bloqueia requisições sem identificação. No celular dá para mandar o
 * User-Agent de verdade (sem ele o Android envia "okhttp", que é recusado);
 * no navegador isso é proibido, então vai o Api-User-Agent.
 */
export const WIKIMEDIA_HEADERS: Record<string, string> =
  Platform.OS === 'web' ? { 'Api-User-Agent': APP_AGENT } : { 'User-Agent': APP_AGENT, 'Api-User-Agent': APP_AGENT };

/** Largura da miniatura: cobre a tela inteira em celulares de alta densidade (390pt × 3). */
const THUMB_WIDTH = 1200;
const STEP_TIMEOUT_MS = 5000;

export type CityPhoto = {
  /** Endereço da miniatura em upload.wikimedia.org. */
  url: string;
  /** Crédito para exibir: autor e licença, como as licenças Creative Commons exigem. */
  credit: string;
};

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function query(base: string, params: Record<string, string>): string {
  // origin=* libera o acesso pelo navegador (versão web do app); formatversion=2 deixa o JSON mais simples.
  const search = new URLSearchParams({ ...params, format: 'json', formatversion: '2', origin: '*' });
  return `${base}?${search.toString()}`;
}

// ---------- passo 1: GeoNames ID → itens do Wikidata ----------

export function parseWikidataSearch(json: unknown): string[] {
  if (!isObject(json) || !isObject(json.query) || !Array.isArray(json.query.search)) {
    throw new ApiError('invalid', 'Busca do Wikidata em formato inesperado.');
  }
  return json.query.search
    .map((hit) => (isObject(hit) ? hit.title : undefined))
    .filter((title): title is string => typeof title === 'string' && /^Q\d+$/.test(title));
}

// ---------- passo 2: itens → nome do arquivo da imagem principal ----------

type Claim = { rank?: unknown; mainsnak?: { datavalue?: { value?: unknown } } };

/** Valor da afirmação mais confiável: a marcada como "preferred"; nunca uma "deprecated". */
function bestValue(claims: unknown): string | undefined {
  if (!Array.isArray(claims)) return undefined;
  const usable = (claims as Claim[]).filter((claim) => isObject(claim) && claim.rank !== 'deprecated');
  const chosen = usable.find((claim) => claim.rank === 'preferred') ?? usable[0];
  const value = chosen?.mainsnak?.datavalue?.value;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Devolve um mapa GeoNames ID → nome do arquivo no Commons. */
export function parseWikidataEntities(json: unknown): Map<string, string> {
  if (!isObject(json) || !isObject(json.entities)) {
    throw new ApiError('invalid', 'Itens do Wikidata em formato inesperado.');
  }
  const files = new Map<string, string>();
  for (const entity of Object.values(json.entities)) {
    if (!isObject(entity) || !isObject(entity.claims)) continue;
    const file = bestValue(entity.claims.P18);
    const geonamesClaims = entity.claims.P1566;
    if (!file || !Array.isArray(geonamesClaims)) continue;
    for (const claim of geonamesClaims as Claim[]) {
      const id = claim?.mainsnak?.datavalue?.value;
      if (typeof id === 'string' && !files.has(id)) files.set(id, file);
    }
  }
  return files;
}

// ---------- passo 3: arquivo → miniatura e crédito ----------

/** O autor vem em HTML (às vezes com link). Aqui vira texto simples e curto. */
export function plainText(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}...` : text;
}

function metadataValue(extmetadata: unknown, key: string): string {
  if (!isObject(extmetadata) || !isObject(extmetadata[key])) return '';
  const value = extmetadata[key].value;
  return typeof value === 'string' ? plainText(value) : '';
}

export function formatCredit(author: string, license: string): string {
  const parts = [author, license].filter(Boolean).join(', ');
  return parts ? `Foto: ${parts}, via Wikimedia Commons` : 'Foto: Wikimedia Commons';
}

/** Devolve um mapa título do arquivo ("File:...") → foto. */
export function parseCommonsImages(json: unknown): Map<string, CityPhoto> {
  if (!isObject(json) || !isObject(json.query) || !Array.isArray(json.query.pages)) {
    throw new ApiError('invalid', 'Resposta do Commons em formato inesperado.');
  }
  const photos = new Map<string, CityPhoto>();
  for (const page of json.query.pages) {
    if (!isObject(page) || typeof page.title !== 'string' || !Array.isArray(page.imageinfo)) continue;
    const info = page.imageinfo[0];
    if (!isObject(info)) continue;
    const url = typeof info.thumburl === 'string' ? info.thumburl : info.url;
    if (typeof url !== 'string' || !url.startsWith('https://')) continue;
    photos.set(page.title, {
      url,
      credit: formatCredit(metadataValue(info.extmetadata, 'Artist'), metadataValue(info.extmetadata, 'LicenseShortName')),
    });
  }
  return photos;
}

/** O Commons corrige o título (ex.: "_" vira espaço); a resposta diz de → para. */
function normalizedTitles(json: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!isObject(json) || !isObject(json.query) || !Array.isArray(json.query.normalized)) return map;
  for (const item of json.query.normalized) {
    if (isObject(item) && typeof item.from === 'string' && typeof item.to === 'string') map.set(item.from, item.to);
  }
  return map;
}

// ---------- tudo junto ----------

/**
 * Procura a foto de cada cidade. Devolve um mapa GeoNames ID → foto;
 * cidades sem foto no Wikimedia simplesmente não aparecem no mapa.
 */
export async function findCityPhotos(geonamesIds: string[], signal?: AbortSignal): Promise<Map<string, CityPhoto>> {
  const ids = [...new Set(geonamesIds.filter((id) => /^\d+$/.test(id)))].slice(0, 50);
  const result = new Map<string, CityPhoto>();
  if (ids.length === 0) return result;

  const options = { signal, timeoutMs: STEP_TIMEOUT_MS, headers: WIKIMEDIA_HEADERS };

  const search = await getJson(
    query(WIKIDATA_API, {
      action: 'query',
      list: 'search',
      srsearch: `haswbstatement:${ids.map((id) => `P1566=${id}`).join('|')}`,
      srlimit: '50',
      srprop: '',
    }),
    options,
  );
  const items = parseWikidataSearch(search);
  if (items.length === 0) return result;

  const entities = await getJson(
    query(WIKIDATA_API, { action: 'wbgetentities', ids: items.join('|'), props: 'claims' }),
    options,
  );
  const files = parseWikidataEntities(entities);
  const wanted = ids.filter((id) => files.has(id));
  if (wanted.length === 0) return result;

  const titles = [...new Set(wanted.map((id) => `File:${files.get(id)}`))];
  const commons = await getJson(
    query(COMMONS_API, {
      action: 'query',
      titles: titles.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      iiextmetadatafilter: 'Artist|LicenseShortName',
    }),
    options,
  );
  const photos = parseCommonsImages(commons);
  const normalized = normalizedTitles(commons);

  for (const id of wanted) {
    const title = `File:${files.get(id)}`;
    const photo = photos.get(normalized.get(title) ?? title);
    if (photo) result.set(id, photo);
  }
  return result;
}

/**
 * Coloca a foto em cada cidade que tiver uma. A foto é um extra: se o Wikimedia
 * falhar ou demorar, a busca continua e as cidades ficam com as fotos do design.
 */
export async function attachCityPhotos<T extends { id: string }>(
  places: T[],
  signal?: AbortSignal,
): Promise<(T & { photoUrl?: string; photoCredit?: string })[]> {
  try {
    const photos = await findCityPhotos(
      places.map((place) => place.id),
      signal,
    );
    return places.map((place) => {
      const photo = photos.get(place.id);
      return photo ? { ...place, photoUrl: photo.url, photoCredit: photo.credit } : place;
    });
  } catch (error) {
    if (isApiError(error, 'aborted')) throw error;
    // Aparece no terminal do Expo: ajuda a descobrir por que as fotos não vieram.
    console.warn('[Atlas] Fotos do Wikimedia indisponíveis:', error instanceof Error ? error.message : error);
    return places;
  }
}
