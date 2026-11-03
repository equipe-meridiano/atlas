import { featured, placeFromParams, placeToParams } from '@/data/place';
import { parseStoredPlaces } from '../favorites';

describe('lugares salvos', () => {
  it('lê o que foi gravado e ignora itens corrompidos', () => {
    const raw = JSON.stringify([featured.hero, { id: 1 }, 'lixo']);
    expect(parseStoredPlaces(raw)).toEqual([featured.hero]);
  });

  it('não quebra com armazenamento vazio ou inválido', () => {
    expect(parseStoredPlaces(null)).toEqual([]);
    expect(parseStoredPlaces('{não é json')).toEqual([]);
  });
});

describe('parâmetros de rota', () => {
  it('ida e volta preservam o destino', () => {
    const params = placeToParams(featured.discover);
    expect(placeFromParams(params)).toEqual(featured.discover);
  });

  it('recusa coordenadas inválidas', () => {
    const params = { ...placeToParams(featured.hero), lat: '200' };
    expect(placeFromParams(params)).toBeNull();
  });
});
