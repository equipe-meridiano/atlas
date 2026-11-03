import { placeFromParams, placeToParams, featured } from '@/data/place';
import {
  attachCityPhotos,
  findCityPhotos,
  formatCredit,
  parseCommonsImages,
  parseSparqlImages,
  plainText,
} from '../cityPhotos';
import { parseStoredPlaces } from '../favorites';

/** Respostas no formato das APIs do Wikimedia. */
const sparqlResponse = {
  results: {
    bindings: [
      { gn: { value: '3413829' }, img: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Reykjavik_skyline.jpg' } },
      { gn: { value: '3413829' }, img: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Outra.jpg' } },
      { gn: { value: '2267057' }, img: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Lisboa%20B.jpg' } },
    ],
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
  it('lê o arquivo da imagem de cada GeoNames ID', () => {
    const files = parseSparqlImages(sparqlResponse);
    expect(files.get('3413829')).toBe('Reykjavik_skyline.jpg');
    expect(files.get('2267057')).toBe('Lisboa B.jpg');
    expect(() => parseSparqlImages({})).toThrow();
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
  it('faz 2 requisições para a lista toda e liga cada foto à sua cidade', async () => {
    const urls = mockWikimedia([sparqlResponse, commonsResponse]);
    const photos = await findCityPhotos(['3413829', '2267057']);

    expect(urls).toHaveLength(2);
    expect(decodeURIComponent(urls[0].replace(/\+/g, ' '))).toContain('VALUES ?gn { "3413829" "2267057" }');
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
