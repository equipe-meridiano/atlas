import {
  buildSparql,
  formatCredit,
  loadPlacePhoto,
  parseCommons,
  parseSparql,
  parseWikipediaFile,
  resetPlacePhotoCache,
} from '../placePhotos';

/** Respostas no formato do Wikidata Query Service e da API do Commons (formatversion=2). */
const sparqlResponse = {
  results: {
    bindings: [
      {
        gn: { type: 'literal', value: '3413829' },
        img: { type: 'uri', value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Reykjav%C3%ADk%20view.jpg' },
      },
      // Segunda imagem da mesma cidade: fica a primeira.
      {
        gn: { type: 'literal', value: '3413829' },
        img: { type: 'uri', value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Outra.jpg' },
      },
      {
        gn: { type: 'literal', value: '2660253' },
        img: { type: 'uri', value: 'http://commons.wikimedia.org/wiki/Special:FilePath/interlaken.jpg' },
      },
    ],
  },
};

const commonsResponse = {
  query: {
    normalized: [{ fromencoded: false, from: 'File:interlaken.jpg', to: 'File:Interlaken.jpg' }],
    pages: [
      {
        title: 'File:Reykjavík view.jpg',
        imageinfo: [
          {
            thumburl: 'https://upload.wikimedia.org/thumb/reykjavik-1280.jpg',
            url: 'https://upload.wikimedia.org/reykjavik.jpg',
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Ana">Ana &amp; Bia</a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          },
        ],
      },
      {
        title: 'File:Interlaken.jpg',
        imageinfo: [{ thumburl: 'https://upload.wikimedia.org/thumb/interlaken-1280.jpg', extmetadata: {} }],
      },
    ],
  },
};

describe('consulta ao Wikidata', () => {
  it('monta a consulta pelos ids do GeoNames', () => {
    expect(buildSparql(['1', '22'])).toContain('VALUES ?gn { "1" "22" }');
    expect(buildSparql(['1'])).toContain('wdt:P1566 ?gn ; wdt:P18 ?img');
  });

  it('extrai o nome do arquivo e fica com a primeira imagem de cada cidade', () => {
    const files = parseSparql(sparqlResponse);
    expect(files.get('3413829')).toBe('Reykjavík view.jpg');
    expect(files.get('2660253')).toBe('interlaken.jpg');
  });

  it('ignora respostas em formato inesperado', () => {
    expect(parseSparql(null).size).toBe(0);
    expect(parseSparql({ results: { bindings: [{ gn: 1 }] } }).size).toBe(0);
  });
});

describe('dados do Commons', () => {
  it('usa a miniatura e resolve títulos normalizados', () => {
    const photos = parseCommons(commonsResponse, ['File:Reykjavík view.jpg', 'File:interlaken.jpg']);
    expect(photos.get('File:Reykjavík view.jpg')).toEqual({
      uri: 'https://upload.wikimedia.org/thumb/reykjavik-1280.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File%3AReykjav%C3%ADk%20view.jpg',
      credit: 'Ana & Bia (CC BY-SA 4.0), Wikimedia Commons',
    });
    expect(photos.get('File:interlaken.jpg')?.credit).toBe('Wikimedia Commons');
  });

  it('recusa endereços que não são https', () => {
    const insecure = { query: { pages: [{ title: 'File:A.jpg', imageinfo: [{ thumburl: 'http://x/a.jpg' }] }] } };
    expect(parseCommons(insecure, ['File:A.jpg']).size).toBe(0);
  });

  it('monta o crédito com o que existir', () => {
    expect(formatCredit(undefined, 'CC0')).toBe('(CC0), Wikimedia Commons');
    expect(formatCredit('Fulano', undefined)).toBe('Fulano, Wikimedia Commons');
  });
});

describe('alternativa da Wikipedia', () => {
  const place = { name: 'São Paulo', latitude: -23.5475, longitude: -46.63611 };
  const response = (title: string, lat: number, lon: number) => ({ query: { pages: [
    { title, coordinates: [{ lat, lon }], pageimage: 'Sao_Paulo.jpg' },
  ] } });

  it('aceita a cidade com nome e coordenadas correspondentes', () => {
    expect(parseWikipediaFile(response('São Paulo (cidade)', -23.55, -46.63), place)).toBe('Sao_Paulo.jpg');
  });

  it('recusa homônimos distantes e atrações próximas', () => {
    expect(parseWikipediaFile(response('São Paulo', 10, 20), place)).toBeNull();
    expect(parseWikipediaFile(response('Museu de São Paulo', -23.55, -46.63), place)).toBeNull();
    expect(parseWikipediaFile(null, place)).toBeNull();
  });
});

describe('loadPlacePhoto', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => resetPlacePhotoCache());
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockApis() {
    const fetchMock = jest.fn(async (url: string) => {
      const body = url.startsWith('https://query.wikidata.org/') ? sparqlResponse : commonsResponse;
      return new Response(JSON.stringify(body), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  }

  it('agrupa os pedidos do mesmo instante em 2 requisições e guarda o resultado', async () => {
    const fetchMock = mockApis();
    const [reykjavik, interlaken, semFoto] = await Promise.all([
      loadPlacePhoto('3413829'),
      loadPlacePhoto('2660253'),
      loadPlacePhoto('999'),
    ]);

    expect(reykjavik?.uri).toBe('https://upload.wikimedia.org/thumb/reykjavik-1280.jpg');
    expect(interlaken?.uri).toBe('https://upload.wikimedia.org/thumb/interlaken-1280.jpg');
    expect(semFoto).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // O 2º pedido da mesma cidade vem do cache.
    await loadPlacePhoto('3413829');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('não consulta nada para ids que não são do GeoNames', async () => {
    const fetchMock = mockApis();
    await expect(loadPlacePhoto('destaque-antigo')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sem internet devolve null e tenta de novo depois', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(loadPlacePhoto('3413829')).resolves.toBeNull();

    const fetchMock = mockApis();
    await expect(loadPlacePhoto('3413829')).resolves.not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('busca na Wikipedia quando o GeoNames não tem imagem e conserva o crédito do Commons', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      const body = url.startsWith('https://query.wikidata.org/') ? { results: { bindings: [] } }
        : url.startsWith('https://pt.wikipedia.org/') ? { query: { pages: [{
          title: 'Interlaken', coordinates: [{ lat: 46.6833, lon: 7.85 }], pageimage: 'interlaken.jpg',
        }] } } : commonsResponse;
      return new Response(JSON.stringify(body), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const location = { name: 'Interlaken', latitude: 46.6863, longitude: 7.8632 };
    const photo = await loadPlacePhoto('2660253', location);
    expect(photo?.uri).toBe('https://upload.wikimedia.org/thumb/interlaken-1280.jpg');
    expect(photo?.sourceUrl).toContain('commons.wikimedia.org/wiki/');
    await loadPlacePhoto('2660253', location);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
