/** Um destino do Atlas: o que a busca do Open-Meteo devolve, já no formato do app. */
export type Place = {
  /** ID do GeoNames, o mesmo que a busca do Open-Meteo devolve. Também localiza a foto. */
  id: string;
  name: string;
  country: string;
  /** Estado ou região (admin1 na API). Pode não existir. */
  region?: string;
  latitude: number;
  longitude: number;
  /** Fuso horário IANA, ex.: "Atlantic/Reykjavik". */
  timezone: string;
  isCapital: boolean;
  /** Frase editorial mostrada na ficha do destino. */
  tagline?: string;
};

/** A quebra de linha repete a do Figma. */
export const defaultTagline = 'Um ponto de partida\npara novos horizontes.';

/**
 * Destinos em destaque na tela Explorar (os mesmos do Figma).
 * Coordenadas e fusos são fixos; o clima é sempre buscado na API.
 * Os ids são os do GeoNames, iguais aos da busca: salvar pelo destaque ou pela busca
 * guarda o mesmo destino uma vez só.
 */
export const featured = {
  hero: {
    id: '3413829',
    name: 'Reykjavík',
    country: 'Islândia',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
    isCapital: true,
    tagline: defaultTagline,
  },
  discover: {
    id: '2660253',
    name: 'Interlaken',
    country: 'Suíça',
    region: 'Berna',
    latitude: 46.6863,
    longitude: 7.8632,
    timezone: 'Europe/Zurich',
    isCapital: false,
    tagline: 'Lagos, montanhas e novos caminhos.',
  },
} satisfies Record<string, Place>;

/**
 * Rotas do Expo Router só carregam texto nos parâmetros.
 * Estas duas funções transformam um Place em texto e de volta, validando cada campo.
 */
export type PlaceParams = {
  id: string;
  nome: string;
  pais: string;
  regiao?: string;
  lat: string;
  lon: string;
  fuso: string;
  capital: '0' | '1';
  frase?: string;
};

export function placeToParams(place: Place): PlaceParams {
  return {
    id: place.id,
    nome: place.name,
    pais: place.country,
    ...(place.region ? { regiao: place.region } : {}),
    lat: String(place.latitude),
    lon: String(place.longitude),
    fuso: place.timezone,
    capital: place.isCapital ? '1' : '0',
    ...(place.tagline ? { frase: place.tagline } : {}),
  };
}

type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Devolve null se algum parâmetro obrigatório faltar ou vier inválido. */
export function placeFromParams(params: RawParams): Place | null {
  const id = single(params.id);
  const name = single(params.nome);
  const country = single(params.pais);
  const timezone = single(params.fuso);
  const latitude = Number(single(params.lat));
  const longitude = Number(single(params.lon));

  if (!id || !name || !country || !timezone) return null;
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) return null;
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;

  return {
    id,
    name,
    country,
    region: single(params.regiao),
    latitude,
    longitude,
    timezone,
    isCapital: single(params.capital) === '1',
    tagline: single(params.frase),
  };
}

/** Linha de apoio abaixo do card na busca: "Islândia / Capital". */
export function placeSubtitle(place: Place): string {
  const detail = place.isCapital ? 'Capital' : place.region;
  return detail ? `${place.country} / ${detail}` : place.country;
}
