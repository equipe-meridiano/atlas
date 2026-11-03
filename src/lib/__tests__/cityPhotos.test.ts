import { placeFromParams, placeToParams, featured } from '@/data/place';
import {
  attachCityPhotos,
  findCityPhotos,
  formatCredit,
  parseCommonsImages,
  parseWikidataEntities,
  parseWikidataSearch,
  plainText,
} from '../cityPhotos';
import { parseStoredPlaces } from '../favorites';

/** Respostas no formato das APIs do Wikimedia (formatversion=2). */
const searchResponse = { query: { search: [{ ns: 0, title: 'Q1764' }, { ns: 0, title: 'Q597' }] } };

const entitiesResponse = {
  entities: {
    Q1764: {
      id: 'Q1764',
      claims: {
        P1566: [{ mainsnak: { datavalue: { value: '3413829' } }, rank: 'normal' }],
        P18: [
          { mainsnak: { datavalue: { value: 'Velha.jpg' } }, rank: 'deprecated' },
          { mainsnak: { datavalue: { value: 'Reykjavik_skyline.jpg' } }, rank: 'normal' },
        ],
      },
    },
    Q597: {
      id: 'Q597',
      claims: {
        P1566: [{ mainsnak: { datavalue: { value: '2267057' } }, rank: 'normal' }],
        P18: [
          { mainsnak: { datavalue: { value: 'Lisboa A.jpg' } }, rank: 'normal' },
          { mainsnak: { datavalue: { value: 'Lisboa B.jpg' } }, rank: 'preferred' },
        ],
      },
    },
  },
};

const commonsResponse = {
  query: {
    normalized: [{ from: 'File:Reykjavik_skyline.jpg', to: 'File:Reykjavik skyline.jpg' }],
    pages: [
      {
        title: 'File:Reykjavik skyline.jpg',
        imageinfo: [
          {
            thumburl: 'https://upload.wikimedia.org/thumb/reykjavik-1200.jpg',
            url: 'https://upload.wikimedia.org/reykjavik.jpg',
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Ana">Ana&nbsp;Silva</a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          },
        ],
      },
      { title: 'File:Lisboa B.jpg', missing: true },
    ],
  },
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockWikimedia(responses: unknown[]) {
  const urls: string[] = [];
  globalThis.fetch = jest.fn(async (url: string) => {
    urls.push(url);
    const body = responses.shift();
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
  return urls;
}

describe('parsers do Wikimedia', () => {
  it('lê os itens encontrados no Wikidata', () => {
    expect(parseWikidataSearch(searchResponse)).toEqual(['Q1764', 'Q597']);
    expect(() => parseWikidataSearch({})).toThrow();
  });

  it('escolhe a imagem preferida e ignora a obsoleta', () => {
    const files = parseWikidataEntities(entitiesResponse);
    expect(files.get('3413829')).toBe('Reykjavik_skyline.jpg');
    expect(files.get('2267057')).toBe('Lisboa B.jpg');
  });

  it('lê miniatura e crédito do Commons, sem HTML', () => {
    const photo = parseCommonsImages(commonsResponse).get('File:Reykjavik skyline.jpg');
    expect(photo).toEqual({
      url: 'https://upload.wikimedia.org/thumb/reykjavik-1200.jpg',
      credit: 'Foto: Ana Silva, CC BY-SA 4.0, via Wikimedia Commons',
    });
  });

  it('limpa e encurta o nome do autor', () => {
    expect(plainText('<b>Joana</b> &amp; Rui')).toBe('Joana & Rui');
    expect(plainText('x'.repeat(80))).toHaveLength(60);
    expect(formatCredit('', '')).toBe('Foto: Wikimedia Commons');
  });
});

describe('findCityPhotos', () => {
  it('faz 3 requisições para a lista toda e liga cada foto à sua cidade', async () => {
    const urls = mockWikimedia([searchResponse, entitiesResponse, commonsResponse]);
    const photos = await findCityPhotos(['3413829', '2267057']);

    expect(urls).toHaveLength(3);
    expect(decodeURIComponent(urls[0])).toContain('haswbstatement:P1566=3413829|P1566=2267057');
    expect(photos.get('3413829')?.url).toBe('https://upload.wikimedia.org/thumb/reykjavik-1200.jpg');
    // A foto de Lisboa não existe no Commons: a cidade fica sem foto real.
    expect(photos.has('2267057')).toBe(false);
  });

  it('não chama a rede para ids que não são do GeoNames (ex.: destaques)', async () => {
    const urls = mockWikimedia([]);
    expect((await findCityPhotos(['destaque-reykjavik'])).size).toBe(0);
    expect(urls).toHaveLength(0);
  });

  it('se o Wikimedia falhar, a busca segue sem fotos', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const places = [{ id: '3413829', name: 'Reykjavík' }];
    await expect(attachCityPhotos(places)).resolves.toEqual(places);
  });
});

describe('foto real nos parâmetros e nos salvos', () => {
  const withPhoto = {
    ...featured.hero,
    id: '3413829',
    photoUrl: 'https://upload.wikimedia.org/thumb/reykjavik-1200.jpg',
    photoCredit: 'Foto: Ana Silva, CC BY-SA 4.0, via Wikimedia Commons',
  };

  it('ida e volta pela rota preservam a foto e o crédito', () => {
    expect(placeFromParams(placeToParams(withPhoto))).toEqual(withPhoto);
  });

  it('recusa endereço de foto que não seja HTTPS', () => {
    const params = { ...placeToParams(withPhoto), fotoUrl: 'javascript:alert(1)' };
    expect(placeFromParams(params)?.photoUrl).toBeUndefined();
    const stored = parseStoredPlaces(JSON.stringify([{ ...withPhoto, photoUrl: 'http://x' }]));
    expect(stored[0].photoUrl).toBeUndefined();
  });
});
