import { Platform } from 'react-native';

import { getJson } from './http';

/**
 * Fotos reais dos destinos, vindas do Wikimedia (gratuito, sem chave de API).
 *
 * 1. Wikidata (SPARQL): o id do destino é o id do GeoNames (P1566 no Wikidata).
 *    Com ele achamos a cidade exata e a imagem principal dela (P18).
 * 2. Wikimedia Commons: endereço da miniatura, autor e licença da imagem.
 *
 * Cada lista de resultados vira só 2 requisições: os pedidos feitos no mesmo instante
 * (vários cards aparecendo juntos) são agrupados num lote.
 */

export type PlacePhoto = {
  uri: string;
  /** Autor e licença, ex.: "Fulano (CC BY-SA 4.0), Wikimedia Commons". */
  credit: string;
};

const SPARQL_URL = 'https://query.wikidata.org/sparql';
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

/** Largura padrão de miniatura do Wikimedia; outras larguras sofrem limite de acesso. */
export const THUMB_WIDTH = 1280;
/** Máximo de títulos por consulta na API do Commons. */
const MAX_BATCH = 50;
const BATCH_DELAY_MS = 16;

/**
 * A política do Wikimedia pede um User-Agent que identifique o app.
 * No navegador o cabeçalho não pode ser trocado, e o próprio Wikimedia aceita o do navegador.
 */
const headers: Record<string, string> =
  Platform.OS === 'web' ? {} : { 'User-Agent': 'Atlas/1.0 (https://github.com/equipe-meridiano/atlas)' };

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function isGeoNamesId(id: string): boolean {
  return /^\d+$/.test(id);
}

// ---------- 1. Wikidata ----------

/** Os ids já foram conferidos como só dígitos, então não há como injetar SPARQL. */
export function buildSparql(ids: string[]): string {
  const values = ids.map((id) => `"${id}"`).join(' ');
  return `SELECT ?gn ?img WHERE { VALUES ?gn { ${values} } ?item wdt:P1566 ?gn ; wdt:P18 ?img . }`;
}

const FILE_PATH_MARKER = '/Special:FilePath/';

/** Devolve id do GeoNames → nome do arquivo no Commons (a primeira imagem de cada cidade). */
export function parseSparql(json: unknown): Map<string, string> {
  const files = new Map<string, string>();
  if (!isObject(json) || !isObject(json.results) || !Array.isArray(json.results.bindings)) return files;

  for (const row of json.results.bindings) {
    if (!isObject(row) || !isObject(row.gn) || !isObject(row.img)) continue;
    const id = text(row.gn.value);
    const url = text(row.img.value);
    if (!id || !url || files.has(id)) continue;
    const index = url.indexOf(FILE_PATH_MARKER);
    if (index === -1) continue;
    try {
      files.set(id, decodeURIComponent(url.slice(index + FILE_PATH_MARKER.length)));
    } catch {
      // Endereço com codificação quebrada: a cidade fica com a foto de reserva.
    }
  }
  return files;
}

// ---------- 2. Commons ----------

/** O campo Artist vem em HTML (links, spans); aqui vira texto simples. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function metadataValue(metadata: Json, key: string): string | undefined {
  const entry = metadata[key];
  return isObject(entry) ? text(entry.value) : undefined;
}

export function formatCredit(artist: string | undefined, license: string | undefined): string {
  const author = artist ? stripHtml(artist) : '';
  const parts = [author, license ? `(${license})` : ''].filter(Boolean).join(' ');
  return parts ? `${parts}, Wikimedia Commons` : 'Wikimedia Commons';
}

/**
 * Resposta do Commons (formatversion=2) → título do arquivo → foto.
 * O Commons pode "normalizar" o título pedido (ex.: primeira letra maiúscula);
 * a lista `normalized` diz qual título pedido virou qual.
 */
export function parseCommons(json: unknown, requested: string[]): Map<string, PlacePhoto> {
  const result = new Map<string, PlacePhoto>();
  if (!isObject(json) || !isObject(json.query) || !Array.isArray(json.query.pages)) return result;

  const byTitle = new Map<string, PlacePhoto>();
  for (const page of json.query.pages) {
    if (!isObject(page) || !Array.isArray(page.imageinfo) || !isObject(page.imageinfo[0])) continue;
    const title = text(page.title);
    const info = page.imageinfo[0];
    const uri = text(info.thumburl) ?? text(info.url);
    if (!title || !uri || !uri.startsWith('https://')) continue;
    const metadata = isObject(info.extmetadata) ? info.extmetadata : {};
    byTitle.set(title, {
      uri,
      credit: formatCredit(metadataValue(metadata, 'Artist'), metadataValue(metadata, 'LicenseShortName')),
    });
  }

  const normalized = new Map<string, string>();
  if (Array.isArray(json.query.normalized)) {
    for (const item of json.query.normalized) {
      const from = isObject(item) ? text(item.from) : undefined;
      const to = isObject(item) ? text(item.to) : undefined;
      if (from && to) normalized.set(from, to);
    }
  }

  for (const title of requested) {
    const photo = byTitle.get(normalized.get(title) ?? title);
    if (photo) result.set(title, photo);
  }
  return result;
}

// ---------- busca em lote ----------

async function fetchPhotos(ids: string[]): Promise<Map<string, PlacePhoto>> {
  const sparql = new URLSearchParams({ query: buildSparql(ids), format: 'json' });
  const files = parseSparql(await getJson(`${SPARQL_URL}?${sparql.toString()}`, { headers }));
  if (files.size === 0) return new Map();

  const titles = [...new Set(files.values())].map((file) => `File:${file}`);
  const commons = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
    iiextmetadatafilter: 'Artist|LicenseShortName',
    titles: titles.join('|'),
  });
  const photosByTitle = parseCommons(await getJson(`${COMMONS_API_URL}?${commons.toString()}`, { headers }), titles);

  const photos = new Map<string, PlacePhoto>();
  for (const [id, file] of files) {
    const photo = photosByTitle.get(`File:${file}`);
    if (photo) photos.set(id, photo);
  }
  return photos;
}

type Resolve = (photo: PlacePhoto | null) => void;

/** Fotos já resolvidas ou a caminho. `null` = a cidade não tem foto no Wikimedia. */
const cache = new Map<string, Promise<PlacePhoto | null>>();
let pending = new Map<string, Resolve>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  const batch = pending;
  pending = new Map();
  timer = null;

  const ids = [...batch.keys()];
  for (let start = 0; start < ids.length; start += MAX_BATCH) {
    const chunk = ids.slice(start, start + MAX_BATCH);
    try {
      const photos = await fetchPhotos(chunk);
      for (const id of chunk) batch.get(id)?.(photos.get(id) ?? null);
    } catch {
      // Sem internet ou serviço fora do ar: mostra a foto de reserva agora e
      // tenta de novo na próxima vez que o destino aparecer.
      for (const id of chunk) {
        cache.delete(id);
        batch.get(id)?.(null);
      }
    }
  }
}

/** Foto real de um destino. Nunca rejeita: em qualquer falha devolve null. */
export function loadPlacePhoto(placeId: string): Promise<PlacePhoto | null> {
  if (!isGeoNamesId(placeId)) return Promise.resolve(null);

  const cached = cache.get(placeId);
  if (cached) return cached;

  const promise = new Promise<PlacePhoto | null>((resolve) => pending.set(placeId, resolve));
  cache.set(placeId, promise);
  if (!timer) timer = setTimeout(flush, BATCH_DELAY_MS);
  return promise;
}

/** Só para testes: esquece o que foi carregado. */
export function resetPlacePhotoCache() {
  cache.clear();
  pending = new Map();
  if (timer) clearTimeout(timer);
  timer = null;
}
